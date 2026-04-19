from __future__ import annotations

from pathlib import Path

import jwt
from fastapi import HTTPException


class JwtVerifier:
    def __init__(self, public_key_path: str) -> None:
        self._public_key_path = Path(public_key_path)
        self._cached_key: str | None = None

    def _load_public_key(self) -> str:
        if self._cached_key is None:
            if not self._public_key_path.exists():
                raise RuntimeError(f"Public key not found at {self._public_key_path}")
            self._cached_key = self._public_key_path.read_text(encoding="utf-8")
        return self._cached_key

    def decode_optional(self, authorization_header: str | None) -> dict | None:
        if not authorization_header:
            return None
        normalized_header = authorization_header.strip()
        if normalized_header.lower() == "bearer":
            return None
        if not normalized_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header inválido")
        token = normalized_header.removeprefix("Bearer ").strip()
        if not token:
            return None
        try:
            return jwt.decode(token, self._load_public_key(), algorithms=["EdDSA"])
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=401, detail="JWT inválido") from exc

    @staticmethod
    def user_id_from_claims(claims: dict | None) -> str | None:
        if not claims:
            return None
        user_id = claims.get("userId")
        if isinstance(user_id, str) and user_id.strip():
            return user_id
        return None
