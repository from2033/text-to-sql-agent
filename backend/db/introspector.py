"""
Read database schema using SQLAlchemy inspection API.
Returns a DbSchema-compatible dict for the API response.
"""
from __future__ import annotations

from sqlalchemy import Engine, inspect, text

from models import ColumnInfo, DbSchema, TableInfo


def _db_type_label(engine: Engine) -> str:
    name = engine.dialect.name
    return {
        "postgresql": "PostgreSQL",
        "mysql": "MySQL",
        "sqlite": "SQLite",
        "clickhouse": "ClickHouse",
    }.get(name, name.capitalize())


def _db_version(engine: Engine) -> str:
    try:
        with engine.connect() as conn:
            dialect = engine.dialect.name
            if dialect == "postgresql":
                row = conn.execute(text("SELECT version()")).scalar()
                # "PostgreSQL 15.4 on ..." → "15.4"
                parts = str(row).split()
                return parts[1] if len(parts) > 1 else str(row)
            if dialect == "mysql":
                row = conn.execute(text("SELECT VERSION()")).scalar()
                return str(row)
            if dialect == "sqlite":
                row = conn.execute(text("SELECT sqlite_version()")).scalar()
                return str(row)
            return "unknown"
    except Exception:
        return "unknown"


def _row_count(engine: Engine, table: str) -> int:
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
            return int(result.scalar() or 0)
    except Exception:
        return 0


def get_schema(engine: Engine, db_name: str) -> DbSchema:
    insp = inspect(engine)
    table_names = insp.get_table_names()

    tables: list[TableInfo] = []
    for tname in table_names:
        try:
            raw_cols = insp.get_columns(tname)
            pk_cols = set(insp.get_pk_constraint(tname).get("constrained_columns", []))
            fk_map: dict[str, str] = {}
            for fk in insp.get_foreign_keys(tname):
                for col in fk.get("constrained_columns", []):
                    ref_table = fk.get("referred_table", "")
                    ref_cols = fk.get("referred_columns", [])
                    ref_col = ref_cols[0] if ref_cols else "id"
                    fk_map[col] = f"{ref_table}.{ref_col}"
            unique_cols: set[str] = set()
            for uc in insp.get_unique_constraints(tname):
                for col in uc.get("column_names", []):
                    unique_cols.add(col)

            columns: list[ColumnInfo] = []
            for col in raw_cols:
                cname = col["name"]
                columns.append(
                    ColumnInfo(
                        name=cname,
                        type=str(col["type"]),
                        isPrimary=cname in pk_cols,
                        isForeignKey=cname in fk_map,
                        isUnique=cname in unique_cols,
                        nullable=bool(col.get("nullable", True)),
                        references=fk_map.get(cname),
                    )
                )

            row_count = _row_count(engine, tname)
            tables.append(TableInfo(name=tname, rowCount=row_count, columns=columns))
        except Exception:
            tables.append(TableInfo(name=tname))

    return DbSchema(
        name=db_name,
        type=_db_type_label(engine),
        host=str(engine.url.host or "local"),
        version=_db_version(engine),
        tables=tables,
    )
