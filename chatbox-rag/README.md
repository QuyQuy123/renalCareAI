# RenalCareAI Chatbox RAG

Python service riêng cho chatbox hỏi đáp sức khỏe thận. Service này lấy tài
liệu từ các nguồn y khoa uy tín, tạo embeddings bằng OpenAI, lưu vector store
cục bộ, rồi trả lời bằng tiếng Việt kèm nguồn tham khảo.

## Chạy local

```powershell
cd chatbox-rag
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Nếu đã tạo `.venv` trước đó, chạy lại lệnh này sau khi cập nhật code:

```powershell
pip install --upgrade -r requirements.txt
```

Mở `.env` và điền:

```text
OPENAI_API_KEY=sk-...
```

Nếu tài khoản của bạn có model khác, đổi `OPENAI_CHAT_MODEL` theo đúng tên
model trên OpenAI Platform.

## Tạo dữ liệu RAG

```powershell
python -m app.ingest
```

Lệnh này đọc `config/sources.json`, tải nội dung, chia đoạn, tạo embeddings và
lưu vào `storage/vector_store.json`.

## Chạy API

```powershell
python -m app.start
```

Nếu chưa có `storage/vector_store.json`, lệnh này sẽ tự chạy ingest lần đầu.

Khi chạy cùng Spring Boot, frontend gọi backend qua:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Backend sẽ tự start RAG bằng cấu hình `app.rag.*` và proxy `/api/chat` sang
service Python nội bộ.

## API

- `GET /api/health`: kiểm tra service.
- `GET /api/sources`: xem danh sách nguồn.
- `POST /api/chat`: gửi câu hỏi.

Ví dụ request:

```json
{
  "message": "Dấu hiệu sớm của bệnh thận là gì?",
  "history": []
}
```

## Lưu ý y khoa

Chatbox chỉ hỗ trợ tham khảo, không chẩn đoán và không thay thế bác sĩ. Với đau
ngực, khó thở, phù nặng, tiểu máu nhiều, lú lẫn, huyết áp rất cao hoặc triệu
chứng cấp cứu, người dùng cần liên hệ cơ sở y tế ngay.
