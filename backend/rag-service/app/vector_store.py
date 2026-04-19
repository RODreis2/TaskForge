from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import faiss
import numpy as np


@dataclass
class ChunkRecord:
    source_id: str
    source_kind: str
    title: str
    task_id: str | None
    content: str
    snippet: str


class FaissVectorStore:
    def __init__(self, base_dir: Path) -> None:
        self._base_dir = base_dir
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, namespace: str, corpus_hash: str, chunks: list[ChunkRecord], embeddings: list[list[float]]) -> None:
        if not chunks or not embeddings:
            self._write_metadata(namespace, {"corpus_hash": corpus_hash, "chunks": []})
            return

        vectors = np.array(embeddings, dtype="float32")
        index = faiss.IndexFlatL2(vectors.shape[1])
        index.add(vectors)
        faiss.write_index(index, str(self._index_path(namespace)))
        self._write_metadata(
            namespace,
            {
                "corpus_hash": corpus_hash,
                "chunks": [asdict(chunk) for chunk in chunks],
            },
        )

    def search(self, namespace: str, query_embedding: list[float], limit: int) -> list[ChunkRecord]:
        metadata = self.load(namespace)
        index_path = self._index_path(namespace)
        if not metadata or not metadata.get("chunks") or not index_path.exists():
            return []

        index = faiss.read_index(str(index_path))
        query = np.array([query_embedding], dtype="float32")
        _, indices = index.search(query, max(1, limit))
        chunks = [ChunkRecord(**item) for item in metadata.get("chunks", [])]
        results: list[ChunkRecord] = []
        for idx in indices[0]:
            if idx < 0 or idx >= len(chunks):
                continue
            results.append(chunks[idx])
        return results

    def load(self, namespace: str) -> dict | None:
        path = self._metadata_path(namespace)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def matches_hash(self, namespace: str, corpus_hash: str) -> bool:
        metadata = self.load(namespace)
        return bool(metadata and metadata.get("corpus_hash") == corpus_hash)

    def _write_metadata(self, namespace: str, payload: dict) -> None:
        self._metadata_path(namespace).write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    def _metadata_path(self, namespace: str) -> Path:
        return self._base_dir / f"{self._safe_namespace(namespace)}.json"

    def _index_path(self, namespace: str) -> Path:
        return self._base_dir / f"{self._safe_namespace(namespace)}.faiss"

    @staticmethod
    def _safe_namespace(namespace: str) -> str:
        return hashlib.sha256(namespace.encode("utf-8")).hexdigest()
