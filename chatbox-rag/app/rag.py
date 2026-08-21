from __future__ import annotations

import json
import math
from functools import lru_cache
from typing import Any

from openai import OpenAI, OpenAIError

from app.settings import get_settings

SYSTEM_INSTRUCTIONS = """
Bạn là trợ lý RenalCareAI, trả lời bằng tiếng Việt có dấu, rõ ràng và thận trọng.
Chỉ trả lời các câu hỏi liên quan đến bệnh thận, sức khỏe thận, xét nghiệm thận,
ăn uống/luyện tập/thuốc trong bối cảnh chăm sóc thận.
Nếu người dùng hỏi ngoài phạm vi bệnh thận, hãy từ chối ngắn gọn và mời họ hỏi lại
về sức khỏe thận. Không viết thơ, viết code, tư vấn chủ đề chung, giải trí,
tài chính, pháp lý hoặc nội dung không liên quan thận.
Chỉ dùng nội dung được cung cấp từ tài liệu tham khảo để trả lời về sức khỏe thận.
Không chẩn đoán bệnh, không tự kê đơn, không thay đổi thuốc của người dùng.
Luôn nhắc người dùng trao đổi với bác sĩ khi có kết quả xét nghiệm bất thường,
triệu chứng kéo dài hoặc câu hỏi liên quan đến thuốc. Với triệu chứng cấp cứu
như khó thở, đau ngực, lú lẫn, phù nặng, tiểu máu nhiều hoặc huyết áp rất cao,
hãy khuyên đi khám/cấp cứu ngay.
""".strip()

KIDNEY_SCOPE_TERMS = {
    "albumin",
    "albumin niệu",
    "bệnh thận",
    "bệnh thận mạn",
    "blood pressure",
    "ckd",
    "creatinine",
    "đạm niệu",
    "đái tháo đường",
    "dialysis",
    "egfr",
    "huyết áp",
    "kidney",
    "lọc máu",
    "microalbumin",
    "nephrology",
    "phù",
    "protein niệu",
    "sỏi thận",
    "suy thận",
    "thận",
    "tiểu buốt",
    "tiểu đường",
    "tiểu máu",
    "tiểu nhiều",
    "tiểu rắt",
    "ure",
    "urê",
    "urine",
    "xét nghiệm nước tiểu",
}

GENERAL_HEALTH_TERMS = {
    "ăn",
    "ăn uống",
    "bác sĩ",
    "chế độ ăn",
    "cấp cứu",
    "dấu hiệu",
    "dinh dưỡng",
    "đi khám",
    "khám",
    "kiêng",
    "khi nào",
    "luyện tập",
    "thuốc",
    "tập thể dục",
    "uống nước",
    "triệu chứng",
    "xét nghiệm",
}

KIDNEY_CONTEXTUAL_QUESTIONS = {
    "khi nào nên đi khám",
    "khi nào cần đi khám",
    "khi nào phải đi khám",
    "khi nào nên gặp bác sĩ",
    "khi nào cần gặp bác sĩ",
    "dấu hiệu nào cần đi khám",
}

OFF_TOPIC_RESPONSE = (
    "Mình chỉ hỗ trợ các câu hỏi liên quan đến bệnh thận và chăm sóc sức khỏe thận. "
    "Bạn có thể hỏi về dấu hiệu bệnh thận, eGFR, creatinine, xét nghiệm nước tiểu, "
    "ăn uống, luyện tập hoặc dùng thuốc trong bối cảnh bệnh thận nhé."
)


def dot_product(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right, strict=False))


def vector_norm(vector: list[float]) -> float:
    return math.sqrt(sum(value * value for value in vector))


def cosine_similarity(left: list[float], right: list[float]) -> float:
    denominator = vector_norm(left) * vector_norm(right)
    if denominator == 0:
        return 0
    return dot_product(left, right) / denominator


@lru_cache(maxsize=1)
def load_store() -> dict[str, Any]:
    settings = get_settings()
    if not settings.vector_store_file.exists():
        raise FileNotFoundError(
            "Vector store not found. Run `python -m app.ingest` inside chatbox-rag first."
        )
    with settings.vector_store_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def retrieve(question: str, top_k: int | None = None) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("Missing OPENAI_API_KEY in chatbox-rag/.env")

    client = OpenAI(api_key=settings.openai_api_key)
    store = load_store()
    response = client.embeddings.create(model=store["embedding_model"], input=question)
    query_vector = response.data[0].embedding
    limit = top_k or settings.top_k

    scored = [
        {**document, "score": cosine_similarity(query_vector, document["embedding"])}
        for document in store["documents"]
    ]
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:limit]


def unique_sources(chunks: list[dict[str, Any]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    sources: list[dict[str, str]] = []
    for chunk in chunks:
        if chunk["url"] in seen:
            continue
        seen.add(chunk["url"])
        sources.append({"title": chunk["title"], "url": chunk["url"], "publisher": chunk["publisher"]})
    return sources


def contains_any(text: str, terms: set[str]) -> bool:
    normalized = text.lower()
    return any(term in normalized for term in terms)


def is_kidney_related(message: str, history: list[dict[str, str]] | None = None) -> bool:
    if contains_any(message, KIDNEY_SCOPE_TERMS):
        return True

    normalized_message = message.lower().strip(" ?.؟!！")
    if normalized_message in KIDNEY_CONTEXTUAL_QUESTIONS:
        return True

    recent_history = history[-4:] if history else []
    history_text = " ".join(item.get("content", "") for item in recent_history)
    has_kidney_context = contains_any(history_text, KIDNEY_SCOPE_TERMS)
    return has_kidney_context and contains_any(message, GENERAL_HEALTH_TERMS)


def generate_answer(client: OpenAI, model: str, prompt: str) -> str:
    try:
        if hasattr(client, "responses"):
            response = client.responses.create(
                model=model,
                instructions=SYSTEM_INSTRUCTIONS,
                input=prompt,
            )
            return response.output_text

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content or ""
    except OpenAIError as error:
        raise RuntimeError(
            f"OpenAI request failed for model '{model}'. Check OPENAI_API_KEY, model access, billing, "
            f"or upgrade the Python package with `pip install --upgrade -r requirements.txt`. Details: {error}"
        ) from error


def answer_question(message: str, history: list[dict[str, str]] | None = None) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("Missing OPENAI_API_KEY in chatbox-rag/.env")

    if not is_kidney_related(message, history):
        return {
            "answer": OFF_TOPIC_RESPONSE,
            "sources": [],
            "retrieved": [],
        }

    try:
        chunks = retrieve(message)
    except OpenAIError as error:
        raise RuntimeError(
            "OpenAI embedding request failed. Check OPENAI_API_KEY, billing, or embedding model access. "
            f"Details: {error}"
        ) from error
    context = "\n\n".join(
        f"Nguồn: {chunk['title']} ({chunk['url']})\n{chunk['content']}" for chunk in chunks
    )
    recent_history = history[-6:] if history else []
    history_text = "\n".join(f"{item['role']}: {item['content']}" for item in recent_history)
    prompt = f"""
Lịch sử hội thoại gần đây:
{history_text or "Chưa có."}

Tài liệu tham khảo:
{context}

Câu hỏi của người dùng:
{message}

Yêu cầu trả lời:
- Trả lời ngắn gọn, dễ hiểu, theo gạch đầu dòng khi phù hợp.
- Nêu rõ đây là thông tin tham khảo, không thay thế bác sĩ.
- Cuối câu trả lời ghi mục "Nguồn tham khảo" với tên nguồn đã dùng.
""".strip()

    client = OpenAI(api_key=settings.openai_api_key)

    return {
        "answer": generate_answer(client, settings.chat_model, prompt),
        "sources": unique_sources(chunks),
        "retrieved": [
            {
                "title": chunk["title"],
                "url": chunk["url"],
                "score": round(chunk["score"], 4),
                "snippet": chunk["content"][:260],
            }
            for chunk in chunks
        ],
    }
