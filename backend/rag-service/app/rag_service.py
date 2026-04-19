from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .clients import HuggingFaceEmbeddingClient, OllamaClient, TaskCorpusEntry, TaskServiceClient
from .models import ChatRequest, ChatSource
from .vector_store import ChunkRecord, FaissVectorStore


@dataclass
class AnswerBundle:
    answer: str
    sources: list[ChatSource]
    used_user_data: bool


class RagService:
    def __init__(
        self,
        task_client: TaskServiceClient,
        generation_client: OllamaClient,
        embedding_client: HuggingFaceEmbeddingClient,
        vector_store: FaissVectorStore,
        docs_dir: Path,
        chat_model: str,
        chunk_size: int,
        chunk_overlap: int,
        max_chunks: int,
        max_history_messages: int,
    ) -> None:
        self._task_client = task_client
        self._generation = generation_client
        self._embeddings = embedding_client
        self._store = vector_store
        self._docs_dir = docs_dir
        self._chat_model = chat_model
        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap
        self._max_chunks = max_chunks
        self._max_history_messages = max_history_messages

    def answer(self, request: ChatRequest, bearer_token: str | None, user_id: str | None) -> AnswerBundle:
        has_user_context = bool(user_id and bearer_token)
        if not self._generation.is_available():
            combined, used_user_data = self._lexical_context(request.question, bearer_token, user_id)
            return self._fallback_answer(request, combined, used_user_data, reason="generation_unavailable")

        try:
            # Prefer lexical retrieval in the request path so the chat stays responsive
            # even when embedding models are not preloaded in the container.
            combined, used_user_data = self._lexical_context(request.question, bearer_token, user_id)
            prompt = self._build_prompt(request, combined, use_user_data=used_user_data)
            answer = self._generation.generate(self._chat_model, prompt)
            return AnswerBundle(
                answer=answer,
                sources=self._to_sources(combined),
                used_user_data=used_user_data,
            )
        except Exception:
            combined, used_user_data = self._lexical_context(request.question, bearer_token, user_id)
            return self._fallback_answer(request, combined, used_user_data, reason="retrieval_or_generation_failed")

    def _ensure_product_index(self) -> None:
        docs = self._load_product_docs()
        corpus_hash = self._hash_payload(docs)
        if self._store.matches_hash("product_docs", corpus_hash):
            return

        chunks: list[ChunkRecord] = []
        texts: list[str] = []
        for doc in docs:
            for idx, chunk in enumerate(self._chunk_text(doc["content"])):
                chunks.append(
                    ChunkRecord(
                        source_id=f"product:{doc['name']}:{idx}",
                        source_kind="product_doc",
                        title=doc["name"],
                        task_id=None,
                        content=chunk,
                        snippet=self._snippet(chunk),
                    )
                )
                texts.append(chunk)

        embeddings = self._embeddings.embed_texts(texts)
        self._store.save("product_docs", corpus_hash, chunks, embeddings)

    def _ensure_user_index(self, user_id: str, bearer_token: str) -> None:
        entries = self._task_client.load_user_corpus(bearer_token)
        serialized_entries = [entry.__dict__ for entry in entries]
        corpus_hash = self._hash_payload(serialized_entries)
        namespace = f"user:{user_id}"
        if self._store.matches_hash(namespace, corpus_hash):
            return

        chunks: list[ChunkRecord] = []
        texts: list[str] = []
        for entry in entries:
            task_title = entry.title or "Task sem título"
            summary_parts = [
                f"Título: {task_title}",
                f"Descrição: {entry.description}".strip(),
                f"Texto do documento: {entry.document_text}".strip(),
            ]
            summary_parts.extend(f"Bloco de texto: {text}" for text in entry.text_blocks if text.strip())
            summary = "\n".join(part for part in summary_parts if part and part.strip())
            for idx, chunk in enumerate(self._chunk_text(summary)):
                chunks.append(
                    ChunkRecord(
                        source_id=f"task:{entry.task_id}:summary:{idx}",
                        source_kind="task",
                        title=task_title,
                        task_id=entry.task_id,
                        content=chunk,
                        snippet=self._snippet(chunk),
                    )
                )
                texts.append(chunk)

        embeddings = self._embeddings.embed_texts(texts)
        self._store.save(namespace, corpus_hash, chunks, embeddings)

    def _load_product_docs(self) -> list[dict[str, str]]:
        docs: list[dict[str, str]] = []
        if self._docs_dir.exists():
            for path in sorted(self._docs_dir.glob("*.md")):
                docs.append({"name": path.stem.replace("-", " ").title(), "content": path.read_text(encoding="utf-8")})
        repo_readme = self._docs_dir.parent.parent.parent / "README.md"
        if repo_readme.exists():
            docs.append({"name": "TaskForge Overview", "content": repo_readme.read_text(encoding="utf-8")})
        return docs

    def _lexical_context(
        self, question: str, bearer_token: str | None, user_id: str | None
    ) -> tuple[list[ChunkRecord], bool]:
        ranked_product = self._lexical_rank(self._product_chunks(), question)
        ranked_user: list[ChunkRecord] = []
        used_user_data = False
        if user_id and bearer_token:
            try:
                ranked_user = self._lexical_rank(self._user_chunks(user_id, bearer_token), question)
                used_user_data = bool(ranked_user)
            except Exception:
                ranked_user = []
                used_user_data = False

        combined = self._dedupe_chunks(ranked_user + ranked_product)[: self._max_chunks]
        return combined, used_user_data

    def _product_chunks(self) -> list[ChunkRecord]:
        chunks: list[ChunkRecord] = []
        for doc in self._load_product_docs():
            for idx, chunk in enumerate(self._chunk_text(doc["content"])):
                chunks.append(
                    ChunkRecord(
                        source_id=f"product:{doc['name']}:{idx}",
                        source_kind="product_doc",
                        title=doc["name"],
                        task_id=None,
                        content=chunk,
                        snippet=self._snippet(chunk),
                    )
                )
        return chunks

    def _user_chunks(self, user_id: str, bearer_token: str) -> list[ChunkRecord]:
        entries = self._task_client.load_user_corpus(bearer_token)
        chunks: list[ChunkRecord] = []
        for entry in entries:
            task_title = entry.title or "Task sem título"
            summary_parts = [
                f"Título: {task_title}",
                f"Descrição: {entry.description}".strip(),
                f"Texto do documento: {entry.document_text}".strip(),
            ]
            summary_parts.extend(f"Bloco de texto: {text}" for text in entry.text_blocks if text.strip())
            summary = "\n".join(part for part in summary_parts if part and part.strip())
            for idx, chunk in enumerate(self._chunk_text(summary)):
                chunks.append(
                    ChunkRecord(
                        source_id=f"task:{user_id}:{entry.task_id}:summary:{idx}",
                        source_kind="task",
                        title=task_title,
                        task_id=entry.task_id,
                        content=chunk,
                        snippet=self._snippet(chunk),
                    )
                )
        return chunks

    def _lexical_rank(self, chunks: Iterable[ChunkRecord], question: str) -> list[ChunkRecord]:
        query_terms = self._tokenize(question)
        if not query_terms:
            return list(chunks)[: self._max_chunks]

        scored: list[tuple[int, int, ChunkRecord]] = []
        for chunk in chunks:
            chunk_terms = self._tokenize(chunk.content)
            overlap = len(query_terms & chunk_terms)
            if overlap == 0:
                continue
            scored.append((overlap, len(chunk.content), chunk))

        scored.sort(key=lambda item: (-item[0], item[1]))
        if scored:
            return [chunk for _, _, chunk in scored[: self._max_chunks]]
        return list(chunks)[: min(self._max_chunks, 3)]

    def _fallback_answer(
        self, request: ChatRequest, chunks: list[ChunkRecord], used_user_data: bool, reason: str
    ) -> AnswerBundle:
        summary = self._compose_fallback_summary(request.question, chunks, used_user_data)
        if reason == "generation_unavailable":
            summary += "\n\nObservação: a resposta foi montada sem o modelo generativo porque a dependência de IA não está disponível no ambiente atual."
        elif reason == "retrieval_or_generation_failed":
            summary += "\n\nObservação: a resposta foi montada com fallback local porque a geração automática falhou nesta tentativa."

        return AnswerBundle(
            answer=summary,
            sources=self._to_sources(chunks),
            used_user_data=used_user_data,
        )

    def _compose_fallback_summary(self, question: str, chunks: list[ChunkRecord], used_user_data: bool) -> str:
        normalized_question = self._normalize_text(question).lower()
        if not chunks:
            return "Não encontrei evidência suficiente na documentação local para responder com segurança."

        if any(term in normalized_question for term in ("defin", "o que", "aplica", "produto", "taskforge")):
            base = (
                "O TaskForge é um workspace para organizar tarefas, pastas e documentos de trabalho em um fluxo visual."
            )
            capabilities = self._collect_capabilities(chunks)
            if capabilities:
                return f"{base} Hoje ele oferece {capabilities}."
            return base

        sentences = self._rank_sentences(question, chunks)
        if not sentences:
            return "Encontrei contexto relacionado, mas não evidência suficiente para formular uma resposta melhor sem o modelo generativo."

        prefix = (
            "Com base na documentação do produto e nos seus dados, o que encontrei foi: "
            if used_user_data
            else "Com base na documentação local, o que encontrei foi: "
        )
        return prefix + " ".join(sentences[:3])

    def _collect_capabilities(self, chunks: list[ChunkRecord]) -> str:
        capability_patterns = [
            "autenticação de usuários",
            "criação e edição de tasks",
            "organização em árvore de pastas",
            "workspace com texto, desenho e imagens",
            "salvamento contínuo do documento da task",
            "criar e gerenciar tasks",
            "organizar tasks em pastas",
            "abrir workspaces de tasks com texto e desenho",
            "editar documentos com notas e esboços livres",
        ]
        found: list[str] = []
        haystack = " ".join(chunk.content.lower() for chunk in chunks)
        for capability in capability_patterns:
            if capability in haystack and capability not in found:
                found.append(capability)
        return ", ".join(found[:5])

    def _rank_sentences(self, question: str, chunks: list[ChunkRecord]) -> list[str]:
        query_terms = self._tokenize(question)
        scored: list[tuple[int, str]] = []
        for chunk in chunks:
            for sentence in re.split(r"(?<=[.!?])\s+", chunk.content):
                cleaned = sentence.strip(" -")
                if len(cleaned) < 24:
                    continue
                score = len(query_terms & self._tokenize(cleaned))
                if score > 0:
                    scored.append((score, cleaned))
        scored.sort(key=lambda item: (-item[0], len(item[1])))

        picked: list[str] = []
        seen: set[str] = set()
        for _, sentence in scored:
            if sentence in seen:
                continue
            seen.add(sentence)
            picked.append(sentence)
            if len(picked) >= 3:
                break
        return picked

    def _build_prompt(self, request: ChatRequest, chunks: list[ChunkRecord], use_user_data: bool) -> str:
        history_lines = []
        for message in request.history[-self._max_history_messages :]:
            role = "Usuário" if message.role == "user" else "Assistente"
            history_lines.append(f"{role}: {message.content}")

        context_sections = []
        for chunk in chunks:
            label = f"{chunk.source_kind.upper()} | {chunk.title}"
            if chunk.task_id:
                label += f" | taskId={chunk.task_id}"
            context_sections.append(f"[{label}]\n{chunk.content}")

        context_text = "\n\n".join(context_sections) if context_sections else "Nenhum contexto recuperado."
        route_text = request.route or "desconhecida"
        selected_task = request.selectedTaskTitle or "nenhuma"
        scope = "dados do usuário e documentação do produto" if use_user_data else "somente documentação do produto"
        return f"""
Você é o assistente do TaskForge.
Responda sempre em português do Brasil.
Use apenas o contexto fornecido. Se faltar evidência, diga isso claramente.
Não invente tarefas, ids ou funcionalidades.
Escopo disponível nesta resposta: {scope}.
Rota atual do usuário: {route_text}.
Task destacada no frontend: {selected_task}.

Histórico recente:
{chr(10).join(history_lines) if history_lines else "Sem histórico anterior."}

Contexto recuperado:
{context_text}

Pergunta do usuário:
{request.question}

Resposta esperada:
- objetiva
- útil
- grounded no contexto
- quando possível, cite de forma natural as fontes relevantes
""".strip()

    def _chunk_text(self, text: str) -> list[str]:
        normalized = self._normalize_text(text)
        if not normalized:
            return []
        if len(normalized) <= self._chunk_size:
            return [normalized]

        chunks: list[str] = []
        start = 0
        while start < len(normalized):
            end = min(start + self._chunk_size, len(normalized))
            candidate = normalized[start:end]
            if end < len(normalized):
                boundary = max(candidate.rfind("\n\n"), candidate.rfind(". "), candidate.rfind("; "), candidate.rfind(" "))
                if boundary > int(self._chunk_size * 0.45):
                    end = start + boundary + 1
                    candidate = normalized[start:end]
            chunks.append(candidate.strip())
            if end >= len(normalized):
                break
            start = max(end - self._chunk_overlap, start + 1)
        return [chunk for chunk in chunks if chunk]

    @staticmethod
    def _normalize_text(text: str) -> str:
        return re.sub(r"\s+", " ", text or "").strip()

    @classmethod
    def _tokenize(cls, text: str) -> set[str]:
        normalized = cls._normalize_text(text).lower()
        return {term for term in re.findall(r"[a-zà-ÿ0-9]{3,}", normalized)}

    @staticmethod
    def _snippet(text: str, length: int = 190) -> str:
        normalized = re.sub(r"\s+", " ", text).strip()
        return normalized if len(normalized) <= length else normalized[: length - 1].rstrip() + "…"

    @staticmethod
    def _hash_payload(payload: object) -> str:
        return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()

    @staticmethod
    def _dedupe_chunks(chunks: list[ChunkRecord]) -> list[ChunkRecord]:
        seen: set[str] = set()
        deduped: list[ChunkRecord] = []
        for chunk in chunks:
            if chunk.source_id in seen:
                continue
            seen.add(chunk.source_id)
            deduped.append(chunk)
        return deduped

    @staticmethod
    def _to_sources(chunks: list[ChunkRecord]) -> list[ChatSource]:
        return [
            ChatSource(
                kind=chunk.source_kind,
                title=chunk.title,
                snippet=chunk.snippet,
                taskId=chunk.task_id,
                sourceId=chunk.source_id,
            )
            for chunk in chunks[:4]
        ]
