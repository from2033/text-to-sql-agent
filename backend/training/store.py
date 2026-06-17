"""
SQLite-backed persistent store for training pairs.
Uses raw sqlite3 (no ORM needed for this simple schema).
"""
from __future__ import annotations
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from config import settings
from models import TrainingPair, TrainingPairCreate


def _conn() -> sqlite3.Connection:
    Path(settings.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.sqlite_path)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS training_pairs (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                sql TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


_init_db()


def list_pairs() -> list[TrainingPair]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM training_pairs ORDER BY created_at DESC"
        ).fetchall()
    return [
        TrainingPair(
            id=r["id"],
            question=r["question"],
            sql=r["sql"],
            description=r["description"],
            createdAt=r["created_at"],
        )
        for r in rows
    ]


def add_pair(data: TrainingPairCreate) -> TrainingPair:
    pair_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with _conn() as c:
        c.execute(
            "INSERT INTO training_pairs (id, question, sql, description, created_at) VALUES (?,?,?,?,?)",
            (pair_id, data.question, data.sql, data.description, created_at),
        )
    return TrainingPair(
        id=pair_id,
        question=data.question,
        sql=data.sql,
        description=data.description,
        createdAt=created_at,
    )


def delete_pair(pair_id: str) -> bool:
    with _conn() as c:
        rowcount = c.execute(
            "DELETE FROM training_pairs WHERE id = ?", (pair_id,)
        ).rowcount
    return rowcount > 0


def get_pair(pair_id: str) -> TrainingPair | None:
    with _conn() as c:
        row = c.execute(
            "SELECT * FROM training_pairs WHERE id = ?", (pair_id,)
        ).fetchone()
    if not row:
        return None
    return TrainingPair(
        id=row["id"],
        question=row["question"],
        sql=row["sql"],
        description=row["description"],
        createdAt=row["created_at"],
    )
