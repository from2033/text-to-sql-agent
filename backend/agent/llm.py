"""
Thin wrapper around the Anthropic Messages API.
"""
from __future__ import annotations

import anthropic

from config import settings

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def generate_sql(system_prompt: str, user_question: str, few_shot: str = "") -> str:
    """Call Claude to produce a SQL statement. Returns raw SQL text."""
    user_content = ""
    if few_shot:
        user_content += few_shot + "\n\n"
    user_content += f"Q: {user_question}\nSQL:"

    msg = _get_client().messages.create(
        model=settings.sql_model,
        max_tokens=1024,
        temperature=0,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}],
    )
    return msg.content[0].text.strip()


def explain_result(prompt: str) -> str:
    """Call Claude (lighter model) to explain query results in Chinese."""
    msg = _get_client().messages.create(
        model=settings.explain_model,
        max_tokens=400,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()
