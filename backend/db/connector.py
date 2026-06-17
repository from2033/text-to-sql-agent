"""
In-memory session registry that maps sessionId → SQLAlchemy engine.
Credentials are never persisted to disk.
"""
from __future__ import annotations
import uuid
from typing import Optional

from sqlalchemy import create_engine, text, Engine

from models import DbConfigRequest

_sessions: dict[str, Engine] = {}


def _build_url(cfg: DbConfigRequest) -> str:
    t = cfg.type
    if t == "postgresql":
        return (
            f"postgresql+psycopg2://{cfg.username}:{cfg.password}"
            f"@{cfg.host}:{cfg.port}/{cfg.database}"
        )
    if t == "mysql":
        return (
            f"mysql+pymysql://{cfg.username}:{cfg.password}"
            f"@{cfg.host}:{cfg.port}/{cfg.database}?charset=utf8mb4"
        )
    if t == "sqlite":
        # cfg.database is the file path
        return f"sqlite:///{cfg.database}"
    if t == "clickhouse":
        return (
            f"clickhouse+http://{cfg.username}:{cfg.password}"
            f"@{cfg.host}:{cfg.port}/{cfg.database}"
        )
    raise ValueError(f"Unsupported db type: {t}")


def test_connection(cfg: DbConfigRequest) -> None:
    """Raise on failure."""
    url = _build_url(cfg)
    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 5})
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine.dispose()


def create_session(cfg: DbConfigRequest) -> str:
    url = _build_url(cfg)
    engine = create_engine(url, pool_pre_ping=True)
    # Verify connectivity before registering
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    session_id = str(uuid.uuid4())
    _sessions[session_id] = engine
    return session_id


def get_engine(session_id: str) -> Optional[Engine]:
    return _sessions.get(session_id)


def close_session(session_id: str) -> None:
    engine = _sessions.pop(session_id, None)
    if engine:
        engine.dispose()
