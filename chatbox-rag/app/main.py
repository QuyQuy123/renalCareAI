from __future__ import annotations

import json
import logging
import traceback
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request
from pydantic import BaseModel, Field

from app.rag import answer_question
from app.settings import get_settings

settings = get_settings()
logger = logging.getLogger("renalcareai.rag")
RAG_VERSION = "rag-error-detail-v2"

app = FastAPI(title="RenalCareAI Chatbox RAG", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)
    history: list[ChatHistoryItem] = Field(default_factory=list)


@app.exception_handler(Exception)
def unhandled_exception_handler(_request: Request, error: Exception) -> JSONResponse:
    logger.exception("Unhandled RAG exception")
    error_type = type(error).__name__
    detail = "".join(traceback.format_exception_only(type(error), error)).strip()
    return JSONResponse(
        status_code=502,
        content={
            "detail": f"Unexpected RAG error ({error_type}): {detail}",
            "type": error_type,
            "version": RAG_VERSION,
        },
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": RAG_VERSION}


@app.get("/api/sources")
def sources() -> list[dict[str, str]]:
    with settings.source_file.open("r", encoding="utf-8") as file:
        return json.load(file)


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, object]:
    try:
        history = [item.model_dump() for item in request.history]
        return answer_question(request.message, history)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except RuntimeError as error:
        logger.exception("RAG runtime error")
        raise HTTPException(status_code=502, detail=f"{error} [{RAG_VERSION}]") from error
    except Exception as error:
        logger.exception("Unexpected RAG error")
        raise HTTPException(status_code=502, detail=f"Unexpected RAG error: {error} [{RAG_VERSION}]") from error
