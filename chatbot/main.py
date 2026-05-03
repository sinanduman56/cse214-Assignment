from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
from graph import app as langgraph_app

server = FastAPI(title="ShopPlatform AI Chatbot")
app = server  # uvicorn main:app için alias

server.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:4200"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    message: str
    userId: Optional[int] = None
    userRole: Optional[str] = "CUSTOMER"

class AskResponse(BaseModel):
    success: bool
    answer: str = ""
    chart_data: Optional[Any] = None
    visualization_code: Optional[str] = None
    guardrail_info: Optional[Any] = None
    error: str = ""

@server.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    try:
        result = langgraph_app.invoke({
            "question": req.message,
            "user_id": req.userId,
            "user_role": req.userRole or "CUSTOMER",
            "iteration_count": 0,
            "error": None,
            "final_answer": "",
            "is_in_scope": False,
            "sql_query": None,
            "query_result": None,
            "chart_data": None,
            "visualization_code": None,
            "guardrail_info": None,
        })
        return AskResponse(
            success=True,
            answer=result.get("final_answer", "Cevap üretilemedi."),
            chart_data=result.get("chart_data"),
            visualization_code=result.get("visualization_code"),
            guardrail_info=result.get("guardrail_info"),
        )
    except Exception as e:
        return AskResponse(success=False, error=str(e), answer="Bir hata oluştu. Lütfen tekrar deneyin.")

@server.get("/health")
def health():
    return {"status": "ok"}
