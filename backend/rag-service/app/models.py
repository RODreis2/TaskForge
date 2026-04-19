from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=6000)
    route: str | None = Field(default=None, max_length=255)
    taskId: str | None = Field(default=None, max_length=64)
    selectedTaskTitle: str | None = Field(default=None, max_length=255)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatSource(BaseModel):
    kind: Literal["task", "document", "product_doc"]
    title: str
    snippet: str
    taskId: str | None = None
    sourceId: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    usedUserData: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
