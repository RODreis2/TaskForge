from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException
from requests import HTTPError, RequestException

from .auth import JwtVerifier
from .clients import HuggingFaceEmbeddingClient, OllamaClient, TaskServiceClient
from .config import settings
from .models import ChatRequest, ChatResponse, HealthResponse
from .rag_service import RagService
from .vector_store import FaissVectorStore

app = FastAPI(title="TaskForge RAG Service", version="0.1.0")

jwt_verifier = JwtVerifier(settings.public_key_path)
task_client = TaskServiceClient(
    base_url=settings.task_service_base_url,
    connect_timeout=settings.connect_timeout_seconds,
    read_timeout=settings.read_timeout_seconds,
)
ollama_client = OllamaClient(
    base_url=settings.ollama_base_url,
    connect_timeout=settings.connect_timeout_seconds,
    read_timeout=settings.read_timeout_seconds,
)
embedding_client = HuggingFaceEmbeddingClient(settings.embedding_model_name)
vector_store = FaissVectorStore(settings.data_dir)
rag_service = RagService(
    task_client=task_client,
    generation_client=ollama_client,
    embedding_client=embedding_client,
    vector_store=vector_store,
    docs_dir=settings.docs_dir,
    chat_model=settings.ollama_chat_model,
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap,
    max_chunks=settings.max_chunks,
    max_history_messages=settings.max_history_messages,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.service_name)


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, authorization: str | None = Header(default=None)) -> ChatResponse:
    claims = jwt_verifier.decode_optional(authorization)
    user_id = jwt_verifier.user_id_from_claims(claims)
    bearer_token = authorization.removeprefix("Bearer ").strip() if authorization and authorization.startswith("Bearer ") else None
    try:
        bundle = rag_service.answer(request=request, bearer_token=bearer_token, user_id=user_id)
        return ChatResponse(answer=bundle.answer, sources=bundle.sources, usedUserData=bundle.used_user_data)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao consultar serviço dependente: {exc.response.text[:240]}") from exc
    except RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Dependência indisponível: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
