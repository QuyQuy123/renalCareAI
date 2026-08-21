from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class Settings:
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    chat_model: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-5.5")
    embedding_model: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    top_k: int = int(os.getenv("RAG_TOP_K", "5"))
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("RAG_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    source_file: Path = BASE_DIR / "config" / "sources.json"
    storage_dir: Path = BASE_DIR / "storage"
    vector_store_file: Path = storage_dir / "vector_store.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
