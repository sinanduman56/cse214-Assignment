from graph import app

tests = [
    ("en son satilan 5 urunu goster", 5),
    ("bu urunleri kimler aldi", 5),
    ("kendi siparislerimi goster", 5),
    ("selam", 5),
]

base_state = {
    "user_id": 5,
    "user_role": "CUSTOMER",
    "iteration_count": 0,
    "error": None,
    "final_answer": "",
    "is_in_scope": False,
    "sql_query": None,
    "query_result": None,
    "visualization_code": None,
}

for question, uid in tests:
    state = {**base_state, "question": question, "user_id": uid}
    result = app.invoke(state)
    print(f"SORU  : {question}")
    print(f"CEVAP : {result['final_answer'][:150]}")
    print("---")
