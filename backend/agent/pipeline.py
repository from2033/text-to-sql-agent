"""
Main Text-to-SQL pipeline:
  question → few-shot retrieval → prompt → LLM SQL → safety check
  → execute → LLM explain → chart hint → QueryResponse
"""
from __future__ import annotations
import re
import time
from typing import Any

from sqlalchemy import Engine, text

from config import settings
from models import ChartDataPoint, DbSchema, QueryResponse, TrainingPair
from agent import llm, prompt_builder
from training import store, vector


# ---------- safety ----------

_ALLOWED_PATTERN = re.compile(r"^\s*SELECT\b", re.IGNORECASE)
_FORBIDDEN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|MERGE|EXEC|EXECUTE)\b",
    re.IGNORECASE,
)


def _is_safe(sql: str) -> bool:
    if not _ALLOWED_PATTERN.match(sql):
        return False
    if _FORBIDDEN.search(sql):
        return False
    return True


# ---------- chart heuristic ----------

def _infer_chart(sql_lower: str, columns: list[str]) -> str | None:
    time_kw = ("date", "month", "week", "day", "year", "time", "period", "quarter")
    pie_kw = ("pct", "percent", "ratio", "proportion", "share")
    if any(k in sql_lower for k in time_kw):
        return "area"
    if any(k in col.lower() for col in columns for k in pie_kw):
        return "pie"
    if "group by" in sql_lower:
        return "bar"
    return None


def _build_chart_data(columns: list[str], rows: list[list[Any]]) -> list[ChartDataPoint] | None:
    if not rows or len(columns) < 2:
        return None
    name_col = 0
    val_col = 1
    val2_col = 2 if len(columns) > 2 else None
    result: list[ChartDataPoint] = []
    for row in rows[:20]:
        try:
            name = str(row[name_col])
            value = float(row[val_col]) if row[val_col] is not None else 0.0
            value2 = float(row[val2_col]) if val2_col and row[val2_col] is not None else None
            result.append(ChartDataPoint(name=name, value=value, value2=value2))
        except (TypeError, ValueError):
            continue
    return result or None


# ---------- execution ----------

def _execute_sql(engine: Engine, sql: str) -> tuple[list[str], list[list[Any]], int]:
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        columns = list(result.keys())
        rows = [list(row) for row in result.fetchmany(settings.max_result_rows)]
        return columns, rows, len(rows)


# ---------- main entry ----------

def run_query(question: str, engine: Engine, schema: DbSchema) -> QueryResponse:
    t0 = time.time()

    # 1. Retrieve similar training pairs
    similar_ids = vector.search(question, n=3)
    similar_pairs: list[TrainingPair] = []
    for pid in similar_ids:
        pair = store.get_pair(pid)
        if pair:
            similar_pairs.append(pair)

    # 2. Build prompt
    system_prompt = prompt_builder.build_system_prompt(schema)
    few_shot = prompt_builder.build_few_shot(similar_pairs)

    # 3. Generate SQL
    try:
        sql = llm.generate_sql(system_prompt, question, few_shot)
    except Exception as e:
        return QueryResponse(
            sql="",
            explanation=f"LLM 调用失败：{e}",
            columns=[],
            rows=[],
            rowCount=0,
            confidence=0.0,
            executionTime=int((time.time() - t0) * 1000),
            isError=True,
            errorMessage=str(e),
        )

    # Strip markdown fences if model wrapped the SQL
    sql = re.sub(r"```sql\s*", "", sql)
    sql = re.sub(r"```\s*", "", sql)
    sql = sql.strip()

    # 4. Safety check
    if not _is_safe(sql):
        return QueryResponse(
            sql=sql,
            explanation="生成的 SQL 包含非 SELECT 操作，已被安全拦截。",
            columns=[],
            rows=[],
            rowCount=0,
            confidence=0.0,
            executionTime=int((time.time() - t0) * 1000),
            isError=True,
            errorMessage="Unsafe SQL blocked",
        )

    # 5. Execute
    try:
        columns, rows, row_count = _execute_sql(engine, sql)
    except Exception as e:
        return QueryResponse(
            sql=sql,
            explanation=f"SQL 执行失败：{e}",
            columns=[],
            rows=[],
            rowCount=0,
            confidence=0.5,
            executionTime=int((time.time() - t0) * 1000),
            isError=True,
            errorMessage=str(e),
        )

    exec_ms = int((time.time() - t0) * 1000)

    # 6. Explain result
    preview = "\n".join(
        ["\t".join(str(v) for v in r) for r in rows[: settings.max_query_preview_rows]]
    )
    explain_prompt = prompt_builder.build_explain_prompt(question, sql, preview)
    try:
        explanation = llm.explain_result(explain_prompt)
    except Exception:
        explanation = f"查询返回 **{row_count}** 行数据。"

    # 7. Chart hint
    chart_type = _infer_chart(sql.lower(), columns)
    chart_data = _build_chart_data(columns, rows) if chart_type else None

    # Confidence: drops when few-shot coverage is low
    confidence = round(0.95 - max(0, (3 - len(similar_pairs)) * 0.08), 2)

    return QueryResponse(
        sql=sql,
        explanation=explanation,
        columns=columns,
        rows=rows,
        rowCount=row_count,
        confidence=confidence,
        executionTime=exec_ms,
        chartType=chart_type,
        chartData=chart_data,
    )
