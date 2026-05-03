import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from state import AgentState
from config import AGENT_CONFIGS
import psycopg2
from psycopg2.extras import RealDictCursor

# .env dosyasındaki GOOGLE_API_KEY'i sisteme yükle
load_dotenv()

# Gemini 2.5 Flash: Hızlı, Ücretsiz ve Geniş Context Window
# Sıfır yaratıcılık (temperature=0) ile en tutarlı sonuçları alırız.
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0) 
# Not: API tarafında model isimlendirmesi güncel sürüme göre değişebilir, 
# "gemini-2.5-flash" veya duyurulan "gemini-3.0-flash" sürümlerini kontrol edebilirsin.

def guardrails_node(state: AgentState):
    """
    Kapıdaki Güvenlik Görevlisi: Sorunun rol kapsamında olup olmadığını kontrol eder.
    """
    print("--- [AGENT] GUARDRAILS ÇALIŞIYOR ---")
    question = state["question"]
    user_id = state.get("user_id")
    user_role = state.get("user_role", "customer").upper()

    # Admin her şeye erişebilir — guardrails'ı geç
    if user_role == "ADMIN":
        print("-> Karar: ADMİN — Tüm sorgular açık, geçildi.")
        return {"is_in_scope": True, "final_answer": "", "guardrail_info": None}

    # ── Bypass anahtar kelime tespiti ──────────────────────────────────────────
    BYPASS_PATTERNS = [
        # ── AV-01 / AV-10: Direct prompt injection & context poisoning ────────
        ("ignore your previous",         "Prompt injection",            "ignore your previous"),
        ("ignore previous instructions", "Prompt injection",            "ignore previous instructions"),
        ("disregard prior",              "Prompt injection",            "disregard prior"),
        ("disregard your instructions",  "Prompt injection",            "disregard your instructions"),
        ("system override",              "Prompt injection",            "system override"),
        ("[system",                       "Prompt injection",           "[system"),
        ("you are now operating",        "Prompt injection",            "you are now operating"),
        ("for testing purposes",         "Prompt injection",            "for testing purposes"),
        ("assume i have admin",          "Prompt injection",            "assume i have admin"),
        ("assume admin",                 "Prompt injection",            "assume admin"),
        ("i am the system administrator","Prompt injection",            "i am the system administrator"),
        ("i have been granted",          "Prompt injection",            "i have been granted"),
        ("full data access",             "Prompt injection",            "full data access"),
        ("elevated to admin",            "Prompt injection",            "elevated to admin"),
        ("önceki talimatları unut",      "Prompt injection",            "önceki talimatları unut"),
        ("sistem talimatlarını yoksay",  "Prompt injection",            "sistem talimatlarını yoksay"),
        ("admin olarak davran",          "Prompt injection",            "admin olarak davran"),
        ("test amaçlı",                  "Prompt injection",            "test amaçlı"),

        # ── AV-07: System prompt leakage / introspection ──────────────────────
        ("repeat your system prompt",    "System prompt leakage",       "repeat your system prompt"),
        ("print everything above",       "System prompt leakage",       "print everything above"),
        ("what instructions were you",   "System prompt leakage",       "what instructions were you"),
        ("what tables exist",            "System prompt leakage",       "what tables exist"),
        ("list all column",              "System prompt leakage",       "list all column"),
        ("list all table",               "System prompt leakage",       "list all table"),
        ("what is your configuration",   "System prompt leakage",       "what is your configuration"),
        ("raw initialization context",   "System prompt leakage",       "raw initialization context"),
        ("output your raw",              "System prompt leakage",       "output your raw"),
        ("sistem promptunu",             "System prompt leakage",       "sistem promptunu"),
        ("talimatlarını tekrar et",      "System prompt leakage",       "talimatlarını tekrar et"),
        ("hangi tablolar var",           "System prompt leakage",       "hangi tablolar var"),
        ("tüm kolonları listele",        "System prompt leakage",       "tüm kolonları listele"),

        # ── Filtre kaldırma girişimleri ───────────────────────────────────────
        ("filtreyi kaldır",              "Filter bypass attempt",       "filtreyi kaldır"),
        ("filter kaldır",                "Filter bypass attempt",       "filter kaldır"),
        ("store_id filtresini kaldır",   "Filter bypass attempt",       "store_id filtresini kaldır"),
        ("store_id'yi kaldır",           "Filter bypass attempt",       "store_id'yi kaldır"),
        ("store_id yi kaldır",           "Filter bypass attempt",       "store_id yi kaldır"),
        ("where koşulunu kaldır",        "Filter bypass attempt",       "where koşulunu kaldır"),
        ("where olmadan",                "Filter bypass attempt",       "where olmadan"),
        ("filtre olmadan",               "Filter bypass attempt",       "filtre olmadan"),
        ("user_id olmadan",              "Filter bypass attempt",       "user_id olmadan"),
        ("kısıtlamayı kaldır",           "Restriction removal attempt", "kısıtlamayı kaldır"),
        ("kısıtlama olmadan",            "Restriction removal attempt", "kısıtlama olmadan"),
        # Yetki yükseltme
        ("admin gibi",                   "Privilege escalation",        "admin gibi"),
        ("admin olarak",                 "Privilege escalation",        "admin olarak"),
        ("admin yetkisiyle",             "Privilege escalation",        "admin yetkisiyle"),
        ("tüm yetkilere",                "Privilege escalation",        "tüm yetkilere"),
        # Diğer mağazaların verilerine erişim
        ("diğer mağazaların",            "Cross-store data access",     "diğer mağazaların"),
        ("diğer mağazalar",              "Cross-store data access",     "diğer mağazalar"),
        ("tüm mağazaların geliri",       "Cross-store data access",     "tüm mağazaların geliri"),
        ("tüm mağazaların satışı",       "Cross-store data access",     "tüm mağazaların satışı"),
        ("rakip mağazaların müşterileri","Cross-store data access",     "rakip mağazaların müşterileri"),
        # Kullanıcı/müşteri verilerine yetkisiz erişim
        ("tüm kullanıcıların",           "Unauthorized data access",    "tüm kullanıcıların"),
        ("tüm müşterilerin",             "Unauthorized data access",    "tüm müşterilerin"),
        ("tüm kullanıcıları listele",    "Unauthorized data access",    "tüm kullanıcıları listele"),
        ("müşteri emaillerini",          "Unauthorized data access",    "müşteri emaillerini"),
        ("kullanıcı bilgilerini",        "Unauthorized data access",    "kullanıcı bilgilerini"),
        # Hassas alan erişimi
        ("password",                     "Sensitive field access",      "password"),
        ("şifre",                        "Sensitive field access",      "şifre"),
        ("password_hash",                "Sensitive field access",      "password_hash"),
        ("ip_address",                   "Sensitive field access",      "ip_address"),
        ("ip adresi",                    "Sensitive field access",      "ip adresi"),
        ("audit log",                    "Sensitive field access",      "audit log"),
        ("audit_log",                    "Sensitive field access",      "audit_log"),
    ]

    q_lower = question.lower()
    bypass_info = None
    for pattern, detection_type, keyword in BYPASS_PATTERNS:
        if pattern in q_lower:
            bypass_info = {
                "detected": True,
                "detection_type": detection_type,
                "keyword": keyword,
                "action": "SQL üretimi durduruldu",
            }
            print(f"-> BYPASS TESPİT EDİLDİ: [{detection_type}] — '{keyword}'")
            break

    if bypass_info:
        if user_role == "STORE_OWNER":
            alternative = "Mağazanız için dönemsel ciro karşılaştırması yapabilirim — örn. bu ay vs geçen ay."
        else:
            alternative = "Kendi siparişleriniz veya harcamalarınız hakkında analiz yapabilirim."
        return {
            "is_in_scope": False,
            "final_answer": "Bu sorgu kısıtlı veri kapsamına giriyor.",
            "guardrail_info": {**bypass_info, "alternative": alternative},
        }
    # ──────────────────────────────────────────────────────────────────────────

    system_prompt = AGENT_CONFIGS["guardrails_agent"]["system_prompt"]

    # Rol bazlı ek kapsam kuralları
    if user_role == "STORE_OWNER":
        role_scope = """
ROL: MAĞAZA SAHİBİ
EVET (İZİN VERİLEN):
- Kendi mağazasına ait ürünler, satışlar, gelirler, sipariş sayıları, yorumlar
- Kendi mağazasının aylık/haftalık istatistikleri, kategori dağılımı
- Herkese açık pazar araştırması: "hangi mağaza X'i daha ucuz satıyor", "en çok satan ürün hangisi", "en yüksek puanlı mağazalar"
- Ürün fiyat karşılaştırmaları, kategori listeleri (herkese açık)
- Platformdaki sıralama ve istatistik sorguları: "kaçıncı satıcıyım", "kaçıncı mağazayım", "toplam kaç mağaza var", "mağazam kaçıncı sırada" — bu sorular hassas kişisel veri içermez, izinlidir
- Selamlama ve genel yardım

HAYIR (YASAK):
- Diğer kullanıcıların kişisel bilgileri (email hariç)
- Platform geneli TÜM kullanıcıların kişisel harcama detayları, özel sipariş bilgileri (admin yetkisi)
- Audit log erişimi
"""
    else:  # CUSTOMER
        role_scope = """
ROL: MÜŞTERİ
EVET (İZİN VERİLEN):
- Kendi siparişleri, sipariş durumu, geçmiş alımlar, harcama özeti
- Kendi yorumları, sepeti, favori listesi
- Pazar araştırması (herkese açık): "en iyi hangi mağaza X satar", "en ucuz nerede", "bu ürünü kim satar", "en yüksek puanlı ürün"
- Ürün fiyatları, kategoriler, mağaza bilgileri (herkese açık)
- Selamlama ve genel yardım

HAYIR (YASAK):
- Platformdaki tüm siparişler, tüm kullanıcıların harcamaları (admin yetkisi)
- Diğer müşterilerin kişisel bilgileri
- Kullanıcı listeleri, tüm email adresleri
- Platform toplam geliri, satış raporları (admin yetkisi)
"""

    instruction = f"""{system_prompt}

Kullanıcı Rolü: {user_role}
Kullanıcı Sorusu: {question}
Kullanıcı ID: {user_id or "Bilinmiyor"}

{role_scope}

Sadece 'YES' veya 'NO' şeklinde cevap ver."""

    response = llm.invoke(instruction)
    answer = response.content.strip().upper()
    is_in_scope = "YES" in answer

    if not is_in_scope:
        if user_role == "STORE_OWNER":
            final_answer = "Bu bilgiye erişim yetkiniz bulunmamaktadır. Yalnızca kendi mağazanıza ait veriler ve herkese açık ürün/mağaza bilgilerini görüntüleyebilirsiniz."
            alternative = "Mağazanıza ait verileri veya herkese açık pazar araştırması yapabilirim."
        else:
            final_answer = "Bu bilgiye erişim yetkiniz bulunmamaktadır. Yalnızca kendi hesabınıza ait bilgileri veya herkese açık ürün/mağaza bilgilerini görüntüleyebilirsiniz."
            alternative = "Kendi siparişleriniz, harcamalarınız veya herkese açık ürün/mağaza bilgilerini sorgulayabilirim."
        print(f"-> Karar: YETKİSİZ SORGU. Erişim reddedildi.")
        guardrail_info = {
            "detected": True,
            "detection_type": "Unauthorized data access",
            "keyword": None,
            "action": "SQL üretimi durduruldu",
            "alternative": alternative,
        }
    else:
        final_answer = ""
        guardrail_info = None
        print(f"-> Karar: KAPSAM İÇİ. SQL Agent'a geçiş yapılıyor.")

    return {"is_in_scope": is_in_scope, "final_answer": final_answer, "guardrail_info": guardrail_info}

# Gelecek Adım: SQL Üretimi, Veri Analizi ve Hata Düzeltme fonksiyonlarını buraya ekleyeceğiz.
# --- Veritabanı Şeması (LLM'e öğreteceğimiz Context) ---
DB_SCHEMA = """
Veritabanı PostgreSQL'dir. Aşağıdaki tablolara ve ilişkilere (Foreign Keys) sahipsin:

1. users: (id PK, email, vb.)
2. categories: (id PK, name UNIQUE, description)
3. stores: (id PK, name, location, active, owner_id FK->users(id))
4. products: (id PK, sku UNIQUE, name, unit_price, image_url, category_id FK->categories(id), store_id FK->stores(id))
5. customer_profiles: (id PK, user_id FK->users(id) UNIQUE, age, city, membership_type, total_spend)
6. orders: (id PK, user_id FK->users(id), order_date, status, grand_total, payment_method, fulfilment)
7. order_items: (id PK, order_id FK->orders(id), product_id FK->products(id), quantity, unit_price)
8. carts: (id PK, user_id FK->users(id) UNIQUE)
9. cart_items: (id PK, cart_id FK->carts(id), product_id FK->products(id), quantity)
10. reviews: (id PK, product_id FK->products(id), user_id FK->users(id), star_rating (1-5), helpful_votes, total_votes, content, created_at)
11. audit_logs: (id PK, entity_id, entity_type, action, details, timestamp, user_email, ip_address)
"""

def sql_node(state: AgentState):
    """
    SQL Uzmanı: Kullanıcının sorusunu alır ve veritabanı şemasına uygun PostgreSQL sorgusu üretir.
    """
    print("--- [AGENT] SQL GENERATOR ÇALIŞIYOR ---")
    question = state["question"]
    user_id = state.get("user_id")
    user_role = state.get("user_role", "customer").upper()
    error = state.get("error", None)

    system_prompt = AGENT_CONFIGS["sql_agent"]["system_prompt"]

    # Rol bazlı SQL context
    if user_role == "ADMIN":
        role_context = f"""
ROL: ADMİN (user_id = {user_id})
- Tüm tablolara tam erişim. Hiçbir user_id filtresi ZORUNLU değil.
- Platform geneli sorgular: tüm siparişler, tüm kullanıcılar, toplam gelir, audit_logs.
- password_hash ve ip_address kolonlarını ASLA sorgulama.
- Admin'in kendi işlemlerini sorgularken user_id = {user_id} kullan.
"""
    elif user_role == "STORE_OWNER":
        role_context = f"""
ROL: MAĞAZA SAHİBİ (owner_id / user_id = {user_id})
- Kendi mağazası: WHERE s.owner_id = {user_id}
- Kendi ürünleri: WHERE p.store_id IN (SELECT id FROM stores WHERE owner_id = {user_id})
- Kendi mağazasının siparişleri/gelirleri:
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    JOIN stores s ON s.id = p.store_id
    WHERE s.owner_id = {user_id}
- Kendi ürünlerinin yorumları / puanları (iyi/kötü ürün analizi):
    SELECT p.name, AVG(r.star_rating) AS avg_rating, COUNT(r.id) AS review_count
    FROM products p
    JOIN reviews r ON r.product_id = p.id
    WHERE p.store_id IN (SELECT id FROM stores WHERE owner_id = {user_id})
    GROUP BY p.id, p.name
    ORDER BY avg_rating DESC
- "İyi ürün" = avg_rating >= 4, "Kötü ürün" = avg_rating <= 2
- Hem satış hem de yorum birleştirmek için:
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders o ON o.id = oi.order_id
    ve reviews r ON r.product_id = p.id
    ile birlikte WHERE p.store_id IN (SELECT id FROM stores WHERE owner_id = {user_id})
- Halka açık pazar araştırması (hangi mağaza ucuz, en yüksek puanlı ürün, en çok satan vb.):
    user_id / owner_id filtresi GEREKMEZ

PLATFORM SIRALAMALARI — RANK() KURALI (ÇOK ÖNEMLİ):
Eğer kullanıcı "kaçıncıyım", "kaçıncı sıradayım", "sıralamada neredeyim", "en iyi satıcı mıyım" gibi platform geneli bir sıralama sorusu sorarsa:
1. Tüm mağazalar üzerinden RANK() hesapla (kiracı izolasyonu — diğer mağaza isimleri veya özel verileri döndürme)
2. Sadece giriş yapan mağazanın satırını döndür (WHERE my_rank.owner_id = {user_id})
3. Varsayılan ölçüt: Toplam satış adedi (quantity). Kullanıcı "gelir/ciro" derse SUM(oi.unit_price * oi.quantity) kullan.

Satış adedi sıralaması için ÖRNEK FORMAT:
SELECT
  my_rank.store_name,
  my_rank.total_qty,
  my_rank.sales_rank,
  (SELECT COUNT(DISTINCT s2.id) FROM stores s2) AS total_store_count
FROM (
  SELECT
    s.id AS store_id,
    s.owner_id,
    s.name AS store_name,
    COALESCE(SUM(oi.quantity), 0) AS total_qty,
    RANK() OVER (ORDER BY COALESCE(SUM(oi.quantity), 0) DESC) AS sales_rank
  FROM stores s
  LEFT JOIN products p ON p.store_id = s.id
  LEFT JOIN order_items oi ON oi.product_id = p.id
  GROUP BY s.id, s.owner_id, s.name
) AS my_rank
WHERE my_rank.owner_id = {user_id}

Bu sorgu: diğer mağazaların isimlerini veya verilerini ASLA döndürmez, sadece giriş yapan satıcının sırasını ve toplam mağaza sayısını verir.
"""
    else:  # CUSTOMER
        role_context = f"""
ROL: MÜŞTERİ (user_id = {user_id})
- Kişisel veriler: WHERE user_id = {user_id} veya WHERE o.user_id = {user_id}
- Pazar araştırması — herkese açık (user_id filtresi GEREKMEZ):
    "En iyi hangi mağaza X'i satar" -> stores + products + reviews join, filtre yok
    "En ucuz ürün nerede" -> products + stores join, ORDER BY unit_price, filtre yok
    "En yüksek puanlı ürünler" -> AVG(star_rating) ile sırala, filtre yok
    "Bu ürünü hangi mağaza satar" -> products + stores join, filtre yok
"""

    instruction = f"""{system_prompt}

{role_context}

{DB_SCHEMA}

User Question: {question}
"""

    if error:
        instruction += f"\n\nÖNCEKİ SORGUN ŞU HATAYI VERDİ. LÜTFEN DÜZELT:\n{error}"

    instruction += "\n\nSADECE GEÇERLİ BİR POSTGRESQL SORGUSU DÖNDÜR. Markdown (```sql) KULLANMA, AÇIKLAMA YAZMA. SADECE SELECT KOMUTU İLE BAŞLAYAN KODU YAZ."

    response = llm.invoke(instruction)

    sql_query = response.content.strip()
    if sql_query.startswith("```sql"):
        sql_query = sql_query[6:]
    if sql_query.endswith("```"):
        sql_query = sql_query[:-3]

    sql_query = sql_query.strip()

    print(f"-> Üretilen SQL:\n{sql_query}\n")

    return {"sql_query": sql_query, "error": None}
def execute_sql_node(state: AgentState):
    """
    Veritabanı Yöneticisi: Üretilen SQL'i PostgreSQL'de çalıştırır.
    """
    print("--- [AGENT] SQL EXECUTOR ÇALIŞIYOR ---")
    sql_query = state.get("sql_query")
    iteration_count = state.get("iteration_count", 0)
    
    # 3 defadan fazla hata yaptıysa sonsuz döngüye girmesini engelle
    if iteration_count >= 3:
        return {
            "query_result": None, 
            "error": "Maksimum deneme sayısına ulaşıldı. Lütfen soruyu farklı bir şekilde sorun.",
            "iteration_count": iteration_count + 1
        }
        
    if not sql_query:
        return {"error": "Çalıştırılacak SQL sorgusu bulunamadı.", "iteration_count": iteration_count + 1}
        
    try:
        # .env dosyasındaki bilgilerle veritabanına bağlan
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432")
        )
        
        # RealDictCursor, veriyi [{kolon: deger}] şeklinde döndürür. LLM bunu çok iyi anlar!
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql_query)
        
        # Sadece SELECT gibi veri döndüren sorguları çek
        if cursor.description:
            results = cursor.fetchall()
            # LLM'e göndereceğimiz için veriyi String formatına çeviriyoruz
            result_str = str([dict(row) for row in results])
        else:
            result_str = "Sorgu çalıştı ancak veri dönmedi."
            
        cursor.close()
        conn.close()
        
        print("-> Başarılı: Veritabanından veri çekildi.")
        # İşlem başarılıysa error'u None yapıp sonucu kaydediyoruz
        return {"query_result": result_str, "error": None, "iteration_count": iteration_count + 1}
        
    except Exception as e:
        error_msg = str(e)
        print(f"-> ❌ SQL ÇALIŞTIRMA HATASI:\n{error_msg}")
        
        # Hata durumunda bağlantıyı açık bırakmamak için kapatıyoruz
        if 'conn' in locals() and conn:
            conn.close()
            
        # Hatayı state'e yazıyoruz ki SQL Agent bunu okuyup kendini düzeltsin
        return {"query_result": None, "error": error_msg, "iteration_count": iteration_count + 1}


def analysis_node(state: AgentState):
    """
    Veri Analisti: Veritabanından gelen ham sonucu alır, doğal dilde yorumlar,
    grafik gerektiriyorsa Chart.js uyumlu JSON üretir.
    """
    print("--- [AGENT] ANALYZER ÇALIŞIYOR ---")
    question = state["question"]
    query_result = state.get("query_result")
    error = state.get("error")
    user_role = state.get("user_role", "customer").upper()

    system_prompt = AGENT_CONFIGS["analysis_agent"]["system_prompt"]

    if error or not query_result:
        final_answer = f"Üzgünüm, sorgunuzu işlerken bir sorunla karşılaştım: {error or 'Veri alınamadı.'}"
        print(f"-> Hata durumu: {final_answer}")
        return {"final_answer": final_answer, "chart_data": None}

    # Rol bazlı dil tonu
    if user_role == "ADMIN":
        tone = "ADMİN perspektifinden yaz. 'Platform genelinde...', 'Toplam...', 'Tüm siparişlerde...' gibi istatistiksel ifadeler kullan. Sayıları ve oranları öne çıkar."
    elif user_role == "STORE_OWNER":
        tone = """MAĞAZA SAHİBİ perspektifinden yaz. 'Mağazanızda...', 'Ürünlerinizde...', 'Satışlarınızda...' gibi sahiplik ifadeleri kullan. İş kararlarına yönelik içgörüler ekle.

SIRALAMALI SONUÇ GELİRSE: Sonuçta 'sales_rank' ve 'total_store_count' alanları varsa şu formatı kullan:
'Satış adetlerine göre platformdaki [total_store_count] satıcı arasında [sales_rank]. sıradasınız.'
KESİNLİKLE diğer satıcıların adlarını, satış rakamlarını veya özel verilerini gösterme — sadece giriş yapan satıcının kendi sırası ve toplam katılımcı sayısı görünür."""
    else:
        tone = "MÜŞTERİ perspektifinden yaz. 'Siparişlerinizde...', 'Satın aldığınız...', 'Harcamalarınızda...' gibi kişisel ifadeler kullan. Pazar araştırması sonuçlarını da samimi bir şekilde sun."

    instruction = f"""{system_prompt}

Dil Tonu: {tone}

Kullanıcı Sorusu: {question}

Veritabanı Sorgu Sonucu:
{query_result}

Görevin:
1. Kullanıcının sorusunu Türkçe olarak net ve anlaşılır şekilde yanıtla.
2. Sadece metin cevabı yaz — grafik üretimi ayrı bir ajan tarafından yapılacak.

Kurallar:
- password_hash, ip_address, token gibi hassas alanları KESİNLİKLE gösterme.
- Eğer sorgu sonucunda "son_siparis_tutari" ve "toplam_harcama" gibi ham veriler varsa, yüzdeyi kendin hesapla ve net göster.
- Kullanıcı "nasıl yaptın / nasıl hesapladın" diye sorarsa KESİNLİKLE SQL kodu, tablo adı veya JSON paylaşma; sadece Türkçe matematiksel açıklama yap.
- Sadece Türkçe metin cevabı yaz, başka bir şey ekleme.
"""

    response = llm.invoke(instruction)
    final_answer = response.content.strip()

    print(f"-> Analiz tamamlandı.")
    return {"final_answer": final_answer}


def visualization_node(state: AgentState):
    """
    Görselleştirme Uzmanı: Sorgu sonucunu inceler, grafiğe dönüştürmeye değer mi karar verir.
    Chart.js uyumlu JSON (Angular frontend) ve Plotly Python kodu üretir.
    """
    print("--- [AGENT] VISUALIZATION ÇALIŞIYOR ---")
    query_result = state.get("query_result")
    question = state.get("question", "")
    error = state.get("error")

    # Hata varsa veya veri yoksa grafik üretme
    if error or not query_result or query_result == "Sorgu çalıştı ancak veri dönmedi.":
        print("-> Veri yok, grafik atlanıyor.")
        return {"chart_data": None, "visualization_code": None}

    system_prompt = AGENT_CONFIGS["visualization_agent"]["system_prompt"]

    instruction = f"""{system_prompt}

Kullanıcı Sorusu: {question}

Sorgu Sonucu:
{query_result}

Grafik türleri:
- Kategori/durum/karşılaştırma → "bar"
- Zaman serisi (günlük/haftalık/aylık) → "line"  
- Oran/yüzde dağılımı → "doughnut"

Chart.js JSON formatı (labels ve datasets zorunlu):
{{"type":"bar","title":"Başlık","labels":["A","B"],"datasets":[{{"label":"Seri","data":[10,20]}}]}}

Plotly kodu formatı (import ve fig.show() dahil):
import plotly.express as px
import pandas as pd
df = pd.DataFrame(...)
fig = px.bar(df, x="...", y="...", title="...")
fig.show()

Yanıt formatı (sadece bu iki satır, başka hiçbir şey yazma):
CHART_DATA: <JSON veya null>
PLOTLY_CODE: <Python kodu veya null>
"""

    response = llm.invoke(instruction)
    raw = response.content.strip()

    chart_data = None
    visualization_code = None

    # CHART_DATA parse
    if "CHART_DATA:" in raw:
        lines = raw.split("\n")
        chart_line = ""
        plotly_lines = []
        in_plotly = False

        for line in lines:
            if line.startswith("CHART_DATA:"):
                chart_line = line[len("CHART_DATA:"):].strip()
            elif line.startswith("PLOTLY_CODE:"):
                plotly_part = line[len("PLOTLY_CODE:"):].strip()
                if plotly_part.lower() != "null":
                    in_plotly = True
                    plotly_lines.append(plotly_part)
            elif in_plotly:
                plotly_lines.append(line)

        # Chart.js JSON parse
        if chart_line and chart_line.lower() != "null":
            # Markdown temizle
            if chart_line.startswith("```"):
                chart_line = chart_line.strip("`").strip()
                if chart_line.startswith("json"):
                    chart_line = chart_line[4:].strip()
            try:
                chart_data = json.loads(chart_line)
                print(f"-> Chart.js verisi üretildi: {chart_data.get('type')} - {chart_data.get('title')}")
            except Exception as e:
                print(f"-> Chart.js parse hatası: {e}")
                chart_data = None

        # Plotly kodu parse
        if plotly_lines:
            code = "\n".join(plotly_lines).strip()
            if code.lower() != "null" and len(code) > 10:
                # Markdown temizle
                if code.startswith("```"):
                    code = code.strip("`").strip()
                    if code.startswith("python"):
                        code = code[6:].strip()
                visualization_code = code
                print(f"-> Plotly kodu üretildi ({len(visualization_code)} karakter)")
    else:
        print("-> LLM grafik üretmedi (CHART_DATA satırı yok)")

    return {"chart_data": chart_data, "visualization_code": visualization_code}
