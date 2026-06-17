from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    sql_model: str = "claude-sonnet-4-6"
    explain_model: str = "claude-haiku-4-5-20251001"

    # Embedding: "sentence-transformers" or "anthropic"
    embedding_backend: str = "sentence-transformers"
    st_model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"

    chroma_path: str = "./data/chroma"
    sqlite_path: str = "./data/training.db"

    max_result_rows: int = 500
    max_query_preview_rows: int = 20


settings = Settings()
