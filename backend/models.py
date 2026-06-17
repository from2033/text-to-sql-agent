from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel


# ---------- DB connection ----------

class DbConfigRequest(BaseModel):
    type: Literal["postgresql", "mysql", "sqlite", "clickhouse"] = "postgresql"
    host: str = "localhost"
    port: str = "5432"
    database: str = ""
    username: str = ""
    password: str = ""


class ColumnInfo(BaseModel):
    name: str
    type: str
    isPrimary: bool = False
    isForeignKey: bool = False
    isUnique: bool = False
    nullable: bool = True
    references: Optional[str] = None
    description: Optional[str] = None


class TableInfo(BaseModel):
    name: str
    description: Optional[str] = None
    rowCount: int = 0
    columns: list[ColumnInfo] = []


class DbSchema(BaseModel):
    name: str
    type: str
    host: str
    version: str
    tables: list[TableInfo] = []


class ConnectResponse(BaseModel):
    sessionId: str
    schema_: DbSchema

    model_config = {"populate_by_name": True}


class TestConnectionResponse(BaseModel):
    ok: bool
    message: str


# ---------- Query ----------

class QueryRequest(BaseModel):
    question: str
    sessionId: str


class ChartDataPoint(BaseModel):
    name: str
    value: float
    value2: Optional[float] = None


class QueryResponse(BaseModel):
    sql: str
    explanation: str
    columns: list[str]
    rows: list[list[Any]]
    rowCount: int
    confidence: float
    executionTime: int
    chartType: Optional[Literal["bar", "line", "pie", "area"]] = None
    chartData: Optional[list[ChartDataPoint]] = None
    isError: bool = False
    errorMessage: Optional[str] = None


# ---------- Training ----------

class TrainingPairCreate(BaseModel):
    question: str
    sql: str
    description: Optional[str] = None


class TrainingPair(BaseModel):
    id: str
    question: str
    sql: str
    description: Optional[str] = None
    createdAt: str
