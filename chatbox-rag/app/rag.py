from __future__ import annotations

import json
import math
import re
from functools import lru_cache
from typing import Any

from openai import OpenAI, OpenAIError

from app.ml_predictor import predict_ckd_risk
from app.settings import get_settings

SYSTEM_INSTRUCTIONS = """
Bạn là Trợ lý Sức khỏe Thận RenalCareAI – một trợ lý y tế AI chuyên nghiệp, thân thiện, ân cần và đồng cảm, hỗ trợ người dùng tìm hiểu kiến thức, giải thích chỉ số y khoa và đồng hành chăm sóc sức khỏe thận.

NGUYÊN TẮC GIAO TIẾP VÀ TRẢ LỜI:
1. Phong cách & Thái độ:
   - Nói chuyện tự nhiên, gần gũi, ấm áp, nhã nhặn và dễ hiểu. Xưng "mình" (hoặc "RenalCareAI") và gọi người dùng là "bạn".
   - Tuyệt đối tránh các câu từ chối máy móc, cứng nhắc hoặc rập khuôn.

2. Chào hỏi & Giới thiệu năng lực:
   - Khi người dùng chào hỏi, hỏi bạn là ai hoặc hỏi bạn có thể giúp gì ("bạn có thể giúp mình những gì", "bạn làm được gì"...):
     Hãy phản hồi niềm nở, giới thiệu bạn là Trợ lý RenalCareAI và tóm tắt ngắn gọn các chủ đề bạn hỗ trợ:
     + Đọc hiểu & giải thích chỉ số xét nghiệm: eGFR, Creatinine, uACR, đạm niệu, xét nghiệm nước tiểu.
     + Phân tích & dự đoán nguy cơ bệnh thận từ các chỉ số lâm sàng (sử dụng mô hình Machine Learning tích hợp).
     + Tư vấn chế độ dinh dưỡng an toàn cho thận (kiểm soát muối, đạm, kali, phốt pho, lượng nước uống).
     + Hướng dẫn luyện tập thể dục, thể thao (bơi lội, đi bộ, yoga...) và lối sống phù hợp với sức khỏe thận.
     + Nhận biết sớm các dấu hiệu cảnh báo bệnh thận (sưng phù, mệt mỏi, thay đổi nước tiểu...).
     + Gợi ý câu hỏi cần thiết khi đi khám với bác sĩ chuyên khoa.

3. Dự đoán nguy cơ & Phân tích chỉ số lâm sàng:
   - Khi người dùng cung cấp các chỉ số xét nghiệm/bệnh lý (Creatinine, Huyết áp, Đường huyết, Đạm niệu, Phù chân, Tiểu đường...):
     + Trình bày rõ ràng xác suất nguy cơ bệnh thận mạn (%) và phân loại mức độ nguy cơ dựa trên mô hình Machine Learning.
     + Phân tích chi tiết từng chỉ số người dùng đã cung cấp (chỉ số nào bình thường, chỉ số nào bất thường và tác động của nó tới cầu thận/chức năng thận).
     + Đưa ra lời khuyên cụ thể về dinh dưỡng, sinh hoạt và hướng dẫn tái khám.

4. An toàn y khoa:
   - Thông tin chỉ mang tính chất tham khảo y khoa, không thay thế chẩn đoán hoặc chỉ định trực tiếp của bác sĩ chuyên khoa.
   - Không tự kê đơn thuốc, không khuyên người dùng tự ý ngưng hoặc thay đổi thuốc đang điều trị.
   - Khi phát hiện các dấu hiệu nguy hiểm/cấp cứu (khó thở dữ dội, đau ngực, phù toàn thân cấp tính, tiểu máu nhiều, vô niệu, huyết áp tăng vọt...), hãy khuyên người dùng đến ngay cơ sở y tế gần nhất.

5. Câu hỏi ngoài phạm vi y tế / sức khỏe:
   - Nếu người dùng hỏi những việc hoàn toàn ngoài lề (viết code, giải toán, tài chính, thơ văn, tin tức xã hội...), hãy từ chối một cách lịch sự, nhã nhặn và tự nhiên, rồi mời họ hỏi các vấn đề về sức khỏe thận.
""".strip()


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


def is_meta_or_greeting(message: str) -> bool:
    normalized = message.lower().strip(" ?.؟!！,，\n\t")
    meta_exact = {
        "hi", "hello", "hey", "alo", "chào", "chào bạn", "xin chào",
        "bạn là ai", "bạn tên gì", "bạn có thể làm gì", "bạn có thể giúp gì",
        "bạn giúp được gì", "bạn có thể giúp mình những gì", "bạn có thể giúp tôi những gì",
        "bạn làm được những gì", "chức năng của bạn là gì", "giới thiệu bản thân",
        "hướng dẫn sử dụng", "giúp tôi với", "cần giúp đỡ", "cảm ơn", "cam on", "thanks", "thank you",
        "tôi có thể hỏi gì", "có thể hỏi gì", "hỏi gì được", "hỗ trợ những gì",
    }
    if normalized in meta_exact:
        return True

    meta_keywords = [
        "bạn có thể giúp", "bạn giúp được", "bạn làm được gì", "bạn là ai",
        "chức năng của bạn", "giới thiệu về bạn", "bạn hỗ trợ gì", "bạn hỗ trợ những gì"
    ]
    if any(kw in normalized for kw in meta_keywords):
        return True

    return len(normalized) <= 12 and normalized.startswith(("chào", "hello", "hi ", "hey", "alo"))


def extract_clinical_features(message: str, history: list[dict[str, str]] | None = None) -> dict[str, Any]:
    """Extract clinical indicators from user message and recent context for the ML model."""
    combined_text = message
    if history:
        user_texts = [item.get("content", "") for item in history if item.get("role") == "user"]
        combined_text = " ".join(user_texts[-3:]) + " " + message

    features: dict[str, Any] = {}
    normalized = combined_text.lower()

    # Age
    age_match = re.search(r'(?:tuổi|age)\s*[:=]?\s*(\d{1,3})', normalized) or re.search(r'(\d{1,3})\s*(?:tuổi|years?\s*old)', normalized)
    if age_match:
        try:
            val = float(age_match.group(1))
            if 1 <= val <= 120:
                features["age"] = val
        except ValueError:
            pass

    # Blood Pressure (Systolic)
    bp_match = re.search(r'(?:huyết\s*áp|blood\s*pressure|bp)\s*[:=]?\s*(\d{2,3})(?:\s*[/]\s*(\d{2,3}))?', normalized)
    if bp_match:
        try:
            val = float(bp_match.group(1))
            if 50 <= val <= 250:
                features["bp"] = val
        except ValueError:
            pass

    # Serum Creatinine (sc)
    sc_match = re.search(r'(?:creatinine|creatinin|cre|sc)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if sc_match:
        try:
            val = float(sc_match.group(1).replace(",", "."))
            if 0.1 <= val <= 25.0:
                features["sc"] = val
        except ValueError:
            pass

    # Blood Glucose (bgr)
    bgr_match = re.search(r'(?:đường\s*huyết|glucose|blood\s*sugar|bgr)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if bgr_match:
        try:
            val = float(bgr_match.group(1).replace(",", "."))
            if 20 <= val <= 800:
                features["bgr"] = val
        except ValueError:
            pass

    # Albumin in urine (al: 0-5)
    al_match = re.search(r'(?:albumin|đạm|protein)\s*(?:niệu|nước\s*tiểu|urine)?\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if al_match:
        try:
            val = float(al_match.group(1).replace(",", "."))
            features["al"] = min(5.0, max(0.0, val))
        except ValueError:
            pass
    elif any(term in normalized for term in ["đạm niệu dương tính", "albumin niệu (+)", "đạm niệu (+)", "protein niệu (+)"]):
        features["al"] = 2.0

    # Blood Urea (bu)
    bu_match = re.search(r'(?:ure|urê|urea|bun|bu)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if bu_match:
        try:
            val = float(bu_match.group(1).replace(",", "."))
            if 1 <= val <= 300:
                features["bu"] = val
        except ValueError:
            pass

    # Hemoglobin (hemo)
    hemo_match = re.search(r'(?:hemoglobin|hgb|hb|hemo)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if hemo_match:
        try:
            val = float(hemo_match.group(1).replace(",", "."))
            if 2 <= val <= 25:
                features["hemo"] = val
        except ValueError:
            pass

    # Potassium (pot)
    pot_match = re.search(r'(?:kali|potassium|k\+?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if pot_match:
        try:
            val = float(pot_match.group(1).replace(",", "."))
            if 1 <= val <= 10:
                features["pot"] = val
        except ValueError:
            pass

    # Sodium (sod)
    sod_match = re.search(r'(?:natri|sodium|na\+?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)', normalized)
    if sod_match:
        try:
            val = float(sod_match.group(1).replace(",", "."))
            if 80 <= val <= 180:
                features["sod"] = val
        except ValueError:
            pass

    # Specific Gravity (sg)
    sg_match = re.search(r'(?:tỷ\s*trọng|specific\s*gravity|sg)\s*[:=]?\s*(1\.\d{3})', normalized)
    if sg_match:
        try:
            features["sg"] = float(sg_match.group(1))
        except ValueError:
            pass

    # Diabetes (dm)
    if any(term in normalized for term in ["tiểu đường", "đái tháo đường", "diabetes", "dm"]):
        if any(neg in normalized for neg in ["không bị tiểu đường", "không tiểu đường", "không đái tháo đường", "no diabetes"]):
            features["dm"] = "no"
        else:
            features["dm"] = "yes"

    # Hypertension (htn)
    if any(term in normalized for term in ["tăng huyết áp", "cao huyết áp", "hypertension", "htn"]):
        if any(neg in normalized for neg in ["không bị tăng huyết áp", "không cao huyết áp", "no hypertension"]):
            features["htn"] = "no"
        else:
            features["htn"] = "yes"

    # Pedal Edema (pe / phù)
    if any(term in normalized for term in ["phù chân", "sưng phù", "bị phù", "phù nề", "phù mặt", "edema"]):
        if any(neg in normalized for neg in ["không bị phù", "không phù"]):
            features["pe"] = "no"
        else:
            features["pe"] = "yes"

    # Anemia (ane / thiếu máu)
    if any(term in normalized for term in ["thiếu máu", "anemia"]):
        if any(neg in normalized for neg in ["không thiếu máu", "không bị thiếu máu"]):
            features["ane"] = "no"
        else:
            features["ane"] = "yes"

    # Coronary Artery Disease (cad)
    if any(term in normalized for term in ["bệnh mạch vành", "động mạch vành", "cad"]):
        features["cad"] = "yes"

    return features


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

    client = OpenAI(api_key=settings.openai_api_key)
    recent_history = history[-6:] if history else []
    history_text = "\n".join(f"{item['role']}: {item['content']}" for item in recent_history)

    if is_meta_or_greeting(message):
        prompt = f"""
Lịch sử hội thoại gần đây:
{history_text or "Chưa có."}

Tin nhắn của người dùng:
{message}

Yêu cầu:
- Phản hồi một cách ấm áp, niềm nở, tự nhiên và thân thiện.
- Giới thiệu bản thân là Trợ lý Sức khỏe Thận RenalCareAI và tóm tắt những gì bạn có thể hỗ trợ (giải thích chỉ số xét nghiệm eGFR/creatinine, dự đoán nguy cơ bệnh thận qua mô hình ML tích hợp, tư vấn chế độ ăn uống, tập luyện thể thao, nhận biết dấu hiệu bệnh thận...).
- Mời người dùng đặt câu hỏi hoặc chia sẻ vấn đề họ đang quan tâm.
""".strip()

        return {
            "answer": generate_answer(client, settings.chat_model, prompt),
            "sources": [],
            "retrieved": [],
        }

    # Extract clinical indicators for ML prediction
    extracted_features = extract_clinical_features(message, history)
    ml_prediction = predict_ckd_risk(extracted_features) if extracted_features else None

    ml_context = ""
    if ml_prediction and ml_prediction.get("has_prediction"):
        prob_pct = ml_prediction["ckd_probability_percent"]
        risk_label = ml_prediction["risk_label"]
        risk_level = ml_prediction["risk_level"]
        findings_str = "\n".join(f"- {f}" for f in ml_prediction.get("findings", []))
        features_str = ", ".join(f"{k}={v}" for k, v in ml_prediction.get("features_detected", {}).items())

        ml_context = f"""
KẾT QUẢ TỪ MÔ HÌNH MACHINE LEARNING DỰ ĐOÁN CKD (UCI Clinical Pipeline):
- Các chỉ số lâm sàng ghi nhận: {features_str}
- Xác suất nguy cơ bệnh thận mạn (CKD): {prob_pct}%
- Phân loại mức độ nguy cơ: {risk_label} ({risk_level})
- Nhận định chỉ số tự động:
{findings_str or "- Đã đối chiếu các chỉ số với ngưỡng chuẩn y khoa."}
"""

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

    prompt = f"""
Lịch sử hội thoại gần đây:
{history_text or "Chưa có."}

{ml_context}

Tài liệu tham khảo y khoa từ cơ sở dữ liệu:
{context}

Câu hỏi / Thông tin người dùng:
{message}

Yêu cầu trả lời:
- Trả lời tự nhiên, ân cần, rõ ràng, gãy gọn và giàu thông tin y khoa hữu ích.
- NẾU có kết quả từ mô hình Machine Learning ở trên:
  + Trình bày rõ ràng xác suất nguy cơ bệnh thận mạn (tính bằng %) và mức độ nguy cơ mà mô hình tính toán được.
  + Phân tích từng chỉ số mà người dùng đã cung cấp (chỉ số nào bình thường, chỉ số nào bất thường/cần lưu ý và giải thích vì sao nó ảnh hưởng tới thận).
  + Đưa ra lời khuyên thiết thực về dinh dưỡng (giảm muối, kiểm soát đạm, đường), thói quen sinh hoạt và vận động.
- NẾU là câu hỏi chung về sức khỏe thận: Giải thích cặn kẽ, khoa học và dễ hiểu.
- Luôn nhắc nhở kết quả mang tính chất sàng lọc tham khảo, người dùng nên đi khám chuyên khoa thận để được bác sĩ đánh giá chính xác.
- Nếu câu hỏi hoàn toàn không liên quan đến sức khỏe/y tế, hãy lịch sự từ chối và hướng người dùng quay lại chủ đề sức khỏe thận.
- Tuyệt đối KHÔNG ghi thêm dòng chữ "Nguồn tham khảo: ..." ở cuối câu trả lời vì giao diện web đã tự hiển thị nguồn.
""".strip()

    relevant_chunks = [chunk for chunk in chunks if chunk.get("score", 0) >= 0.28]
    sources = unique_sources(relevant_chunks) if relevant_chunks else unique_sources(chunks[:2])

    return {
        "answer": generate_answer(client, settings.chat_model, prompt),
        "sources": sources,
        "prediction": ml_prediction if (ml_prediction and ml_prediction.get("has_prediction")) else None,
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
