from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    service_name: str = os.getenv("RAG_SERVICE_NAME", "taskforge-rag")
    app_port: int = int(os.getenv("RAG_PORT", "8090"))
    task_service_base_url: str = os.getenv("TASK_SERVICE_BASE_URL", "http://task-service:8080")
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    ollama_chat_model: str = os.getenv("OLLAMA_CHAT_MODEL", "llama3")
    embedding_model_name: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-mpnet-base-v2")
    public_key_path: str = os.getenv("PUBLIC_KEY", "/run/keys/public.pem")
    data_dir: Path = Path(os.getenv("RAG_DATA_DIR", "/data"))
    docs_dir: Path = Path(os.getenv("RAG_DOCS_DIR", "/app/docs"))
    read_timeout_seconds: float = float(os.getenv("RAG_READ_TIMEOUT_SECONDS", "60"))
    connect_timeout_seconds: float = float(os.getenv("RAG_CONNECT_TIMEOUT_SECONDS", "5"))
    max_chunks: int = int(os.getenv("RAG_MAX_CHUNKS", "6"))
    chunk_size: int = int(os.getenv("RAG_CHUNK_SIZE", "700"))
    chunk_overlap: int = int(os.getenv("RAG_CHUNK_OVERLAP", "120"))
    max_history_messages: int = int(os.getenv("RAG_MAX_HISTORY_MESSAGES", "8"))


settings = Settings()
