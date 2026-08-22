from __future__ import annotations

import logging
import os

import uvicorn

from app.settings import get_settings

logger = logging.getLogger("renalcareai.start")


def should_rebuild_index() -> bool:
    settings = get_settings()
    if not settings.vector_store_file.exists():
        return True

    return settings.source_file.stat().st_mtime > settings.vector_store_file.stat().st_mtime


def main() -> None:
    settings = get_settings()
    if should_rebuild_index():
        if not settings.openai_api_key:
            print("Notice: OPENAI_API_KEY is not set or vector_store already built. Skipping RAG indexing on startup.")
        else:
            try:
                print("Vector store is missing or older than sources.json. Building RAG index before starting API...")
                from app.ingest import main as ingest_main
                ingest_main()
            except Exception as error:
                print(f"Warning: Failed to rebuild RAG index on startup ({error}). Starting server with existing data...")

    host = os.getenv("RAG_HOST", "127.0.0.1")
    port = int(os.getenv("RAG_PORT", "8001"))
    print(f"Starting RenalCareAI RAG & CKD ML service on http://{host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
    )


if __name__ == "__main__":
    main()
