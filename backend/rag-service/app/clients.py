from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests


@dataclass
class TaskCorpusEntry:
    task_id: str
    title: str
    description: str
    folder_id: str | None
    text_blocks: list[str]
    drawing_blocks: list[str]
    document_text: str


class TaskServiceClient:
    def __init__(self, base_url: str, connect_timeout: float, read_timeout: float) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = (connect_timeout, read_timeout)
        self._session = requests.Session()

    def _get_json(self, path: str, bearer_token: str) -> Any:
        response = self._session.get(
            f"{self._base_url}{path}",
            headers={"Authorization": f"Bearer {bearer_token}"},
            timeout=self._timeout,
        )
        response.raise_for_status()
        return response.json()

    def load_user_corpus(self, bearer_token: str) -> list[TaskCorpusEntry]:
        tree = self._get_json("/event/tree", bearer_token)
        tasks: list[dict[str, Any]] = tree.get("tasks", [])
        entries: list[TaskCorpusEntry] = []
        for task in tasks:
            task_id = str(task["id"])
            detail = self._get_json(f"/event/task/{task_id}", bearer_token)
            document = self._get_json(f"/event/tasks/{task_id}/document", bearer_token)
            text_blocks = [block.get("textContent", "") for block in detail.get("blocks", []) if block.get("type") == "TEXT"]
            drawing_blocks = [
                block.get("drawingData", "")
                for block in detail.get("blocks", [])
                if block.get("type") == "DRAW" and block.get("drawingData")
            ]
            document_content = document.get("content", {})
            document_text = document_content.get("text", "") if isinstance(document_content, dict) else ""
            entries.append(
                TaskCorpusEntry(
                    task_id=task_id,
                    title=detail.get("title", task.get("title", "")),
                    description=detail.get("description", task.get("description", "")),
                    folder_id=detail.get("folderId"),
                    text_blocks=text_blocks,
                    drawing_blocks=drawing_blocks,
                    document_text=document_text,
                )
            )
        return entries


class OllamaClient:
    def __init__(self, base_url: str, connect_timeout: float, read_timeout: float) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = (connect_timeout, read_timeout)
        self._session = requests.Session()

    def is_available(self) -> bool:
        try:
            response = self._session.get(f"{self._base_url}/api/tags", timeout=(1, 2))
            response.raise_for_status()
            return True
        except requests.RequestException:
            return False

    def generate(self, model: str, prompt: str) -> str:
        response = self._session.post(
            f"{self._base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=self._timeout,
        )
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("response", "")).strip()


class HuggingFaceEmbeddingClient:
    def __init__(self, model_name: str) -> None:
        self._model_name = model_name
        self._model: Any | None = None

    def _load_model(self) -> Any:
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self._model_name)
        return self._model

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        matrix = self._load_model().encode(texts, normalize_embeddings=True)
        return matrix.tolist()
