from __future__ import annotations

import os

import uvicorn

from app.ingest import main as ingest_main
from app.settings import get_settings


def main() -> None:
    settings = get_settings()
    if not settings.vector_store_file.exists():
        print("Vector store not found. Building RAG index before starting API...")
        ingest_main()

    uvicorn.run(
        "app.main:app",
        host=os.getenv("RAG_HOST", "127.0.0.1"),
        port=int(os.getenv("RAG_PORT", "8001")),
    )


if __name__ == "__main__":
    main()
