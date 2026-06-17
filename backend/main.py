"""
FastAPI entry point for the Text-to-SQL Agent backend.
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ConnectResponse,
    DbConfigRequest,
    DbSchema,
    QueryRequest,
    QueryResponse,
    TestConnectionResponse,
    TrainingPair,
    TrainingPairCreate,
)
from db import connector, introspector
from agent import pipeline
from training import store, vector

app = FastAPI(title="Text-to-SQL Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache: sessionId → DbSchema (so we don't re-introspect on every query)
_schema_cache: dict[str, DbSchema] = {}


# ---------- Connection ----------

@app.post("/api/test-connection", response_model=TestConnectionResponse)
def test_connection(cfg: DbConfigRequest):
    try:
        connector.test_connection(cfg)
        return TestConnectionResponse(ok=True, message="连接成功！")
    except Exception as e:
        return TestConnectionResponse(ok=False, message=str(e))


@app.post("/api/connect")
def connect(cfg: DbConfigRequest):
    try:
        session_id = connector.create_session(cfg)
        engine = connector.get_engine(session_id)
        db_name = cfg.database or "database"
        schema = introspector.get_schema(engine, db_name)
        _schema_cache[session_id] = schema
        # Return using alias to match frontend expectation key "schema"
        return {"sessionId": session_id, "schema": schema.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/disconnect")
def disconnect(body: dict):
    session_id = body.get("sessionId", "")
    connector.close_session(session_id)
    _schema_cache.pop(session_id, None)
    return {"ok": True}


# ---------- Query ----------

@app.post("/api/query", response_model=QueryResponse)
def query(req: QueryRequest):
    engine = connector.get_engine(req.sessionId)
    if engine is None:
        raise HTTPException(status_code=404, detail="Session not found. Please reconnect.")
    schema = _schema_cache.get(req.sessionId)
    if schema is None:
        raise HTTPException(status_code=404, detail="Schema not cached. Please reconnect.")
    result = pipeline.run_query(req.question, engine, schema)
    return result


# ---------- Training ----------

@app.get("/api/training", response_model=list[TrainingPair])
def list_training():
    return store.list_pairs()


@app.post("/api/training", response_model=TrainingPair)
def add_training(data: TrainingPairCreate):
    pair = store.add_pair(data)
    vector.upsert(pair.id, pair.question)
    return pair


@app.delete("/api/training/{pair_id}")
def delete_training(pair_id: str):
    deleted = store.delete_pair(pair_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Training pair not found")
    vector.delete(pair_id)
    return {"ok": True}


# ---------- Health ----------

@app.get("/health")
def health():
    return {"status": "ok"}
