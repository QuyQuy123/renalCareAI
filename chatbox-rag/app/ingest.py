from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup
from openai import OpenAI

from app.settings import get_settings

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 180
REQUEST_TIMEOUT_SECONDS = 25
REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36 RenalCareAI-RAG/1.0"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
}


def load_sources(source_file: Path) -> list[dict[str, str]]:
    with source_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def fetch_text(url: str) -> str:
    response = requests.get(
        url,
        timeout=REQUEST_TIMEOUT_SECONDS,
        headers=REQUEST_HEADERS,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    main = soup.find("main") or soup.body or soup
    text = main.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text)


def chunk_text(text: str) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = max(0, end - CHUNK_OVERLAP)
    return chunks


def embed_texts(client: OpenAI, model: str, texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    batch_size = 32
    for index in range(0, len(texts), batch_size):
        batch = texts[index : index + batch_size]
        response = client.embeddings.create(model=model, input=batch)
        embeddings.extend(item.embedding for item in response.data)
    return embeddings


def build_store() -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("Missing OPENAI_API_KEY in chatbox-rag/.env")

    client = OpenAI(api_key=settings.openai_api_key)
    sources = load_sources(settings.source_file)
    documents: list[dict[str, Any]] = []

    for source in sources:
        print(f"Fetching {source['title']}")
        try:
            text = fetch_text(source["url"])
        except requests.RequestException as error:
            print(f"Warning: skipped {source['title']} ({source['url']}): {error}")
            continue

        for chunk_index, chunk in enumerate(chunk_text(text)):
            documents.append(
                {
                    "id": f"{source['publisher']}:{source['topic']}:{chunk_index}",
                    "title": source["title"],
                    "url": source["url"],
                    "publisher": source["publisher"],
                    "topic": source["topic"],
                    "content": chunk,
                }
            )

    if not documents:
        raise RuntimeError("Could not fetch any RAG source. Check network access or update config/sources.json.")

    vectors = embed_texts(client, settings.embedding_model, [doc["content"] for doc in documents])
    for document, vector in zip(documents, vectors, strict=True):
        document["embedding"] = vector

    return {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "embedding_model": settings.embedding_model,
        "documents": documents,
    }


def main() -> None:
    settings = get_settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    store = build_store()
    with settings.vector_store_file.open("w", encoding="utf-8") as file:
        json.dump(store, file, ensure_ascii=False)
    print(f"Wrote {len(store['documents'])} chunks to {settings.vector_store_file}")


if __name__ == "__main__":
    main()
