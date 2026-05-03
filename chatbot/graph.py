from langgraph.graph import StateGraph, END
from state import AgentState
from agents import guardrails_node, sql_node, execute_sql_node, analysis_node, visualization_node

# Sistemi Kuracak Fonksiyon
def build_agentic_workflow():
    # 1. Grafiği State (Hafıza) ile Başlat
    workflow = StateGraph(AgentState)

    # 2. Düğümleri (Ajanları) Sisteme Ekle
    workflow.add_node("guardrails", guardrails_node)
    workflow.add_node("sql_generator", sql_node)
    workflow.add_node("sql_executor", execute_sql_node)
    workflow.add_node("analyzer", analysis_node)
    workflow.add_node("visualizer", visualization_node)

    # 3. Giriş Noktasını Belirle (Her soru önce güvenliğe gider)
    workflow.set_entry_point("guardrails")

    # 4. Yönlendirme Kuralları (Conditional Edges)
    
    # Guardrails Kararı: Kapsam içindeyse SQL'e git, değilse işlemi bitir (END)
    workflow.add_conditional_edges(
        "guardrails",
        lambda state: "sql_generator" if state.get("is_in_scope") else END
    )

    # SQL üretildikten sonra mutlaka çalıştırıcıya (Executor) git
    workflow.add_edge("sql_generator", "sql_executor")

    # Executor Kararı: Hata varsa ve 3 denemeyi geçmediyse SQL'i baştan yazması için geri dön. 
    # Hata yoksa veya max denemeye ulaşıldıysa analizciye git.
    def check_execution_status(state: AgentState):
        if state.get("error") and state.get("iteration_count", 0) < 3:
            print("-> Hata tespit edildi, düzeltme için SQL Agent'a geri dönülüyor...")
            return "sql_generator"
        return "analyzer"

    workflow.add_conditional_edges(
        "sql_executor",
        check_execution_status
    )

    # Analizci metni ürettikten sonra görselleştirme ajanına git
    workflow.add_edge("analyzer", "visualizer")

    # Görselleştirme tamamlandıktan sonra süreci sonlandır
    workflow.add_edge("visualizer", END)

    # Grafiği derle ve kullanıma hazır hale getir
    return workflow.compile()

# Projenin diğer yerlerinden çağırabilmek için derlenmiş uygulamayı dışa aktarıyoruz
app = build_agentic_workflow()