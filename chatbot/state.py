from typing import TypedDict, Optional, Any, Dict, List

class AgentState(TypedDict):
    question: str
    user_id: Optional[int]            # Giriş yapmış müşterinin ID'si (erişim kontrolü için)
    user_role: Optional[str]          # Kullanıcı rolü: CUSTOMER, STORE_OWNER, ADMIN
    sql_query: Optional[str]          # SQL Agent tarafından üretilen PostgreSQL kodu
    query_result: Any                 # Executor tarafından veritabanından çekilen ham sonuç
    error: Optional[str]              # SQL çalışmazsa dönecek hata mesajı
    final_answer: str                 # Analysis Agent'ın hazırladığı son cevap
    chart_data: Optional[Dict]        # Chart.js uyumlu grafik verisi: {type, labels, datasets, title}
    visualization_code: Optional[str] # Visualization Agent'ın ürettiği Plotly Python kodu
    is_in_scope: bool                 # Guardrails Agent'ın kapsam içi/dışı kararı
    iteration_count: int              # Sonsuz döngü engelleyici sayaç
    guardrail_info: Optional[Dict]    # Yetkisiz erişim tespiti detayları