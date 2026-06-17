"""
Build the system + user prompt for SQL generation.
"""
from __future__ import annotations

from models import DbSchema, TrainingPair


def schema_to_text(schema: DbSchema) -> str:
    lines = [f"数据库类型: {schema.type}，数据库名: {schema.name}\n"]
    for table in schema.tables:
        desc = f"  -- {table.description}" if table.description else ""
        lines.append(f"表: {table.name}{desc}")
        for col in table.columns:
            flags = []
            if col.isPrimary:
                flags.append("PK")
            if col.isForeignKey and col.references:
                flags.append(f"FK→{col.references}")
            if col.isUnique:
                flags.append("UNIQUE")
            if not col.nullable:
                flags.append("NOT NULL")
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            col_desc = f"  -- {col.description}" if col.description else ""
            lines.append(f"  {col.name} {col.type}{flag_str}{col_desc}")
        lines.append("")
    return "\n".join(lines)


def build_system_prompt(schema: DbSchema) -> str:
    schema_text = schema_to_text(schema)
    return f"""你是一个专业的 SQL 专家助手，帮助用户将自然语言问题转换为 {schema.type} SQL 查询。

## 数据库 Schema
{schema_text}

## 规则
1. 只输出纯 SQL，不要任何解释文字、markdown 代码块或注释。
2. 只生成 SELECT 语句，绝不生成 INSERT / UPDATE / DELETE / DROP / ALTER 等写操作。
3. 默认加 LIMIT 500，除非用户明确要求更多或更少。
4. 列名使用双引号（{schema.type} 兼容），表名同理。
5. 如果无法生成有意义的 SQL，输出：SELECT 'UNABLE_TO_GENERATE' AS error;
"""


def build_few_shot(pairs: list[TrainingPair]) -> str:
    if not pairs:
        return ""
    lines = ["## 参考示例（Few-shot）"]
    for p in pairs:
        lines.append(f"Q: {p.question}")
        lines.append(f"SQL:\n{p.sql}\n")
    return "\n".join(lines)


def build_explain_prompt(question: str, sql: str, preview_rows: str) -> str:
    return f"""用户提问：「{question}」
生成的 SQL：
{sql}

查询返回结果（前若干行）：
{preview_rows}

请用中文简洁分析这个查询结果，指出关键数据点和业务洞察，控制在 100 字以内，使用 **加粗** 高亮重要数字。"""
