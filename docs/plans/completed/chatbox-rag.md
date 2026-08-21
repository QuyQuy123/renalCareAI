# Chatbox RAG Service

## Outcome

Improve the frontend chatbox UI, create a separate Python RAG service for kidney
health Q&A, configure OpenAI through local environment variables, and seed the
RAG pipeline with authoritative kidney-health links.

## Authority

- `RULES.md`: medical answers must be supportive, not definitive diagnosis.
- `ARCHITECTURE.md`: chat belongs to the AI/prediction layer and must include
  medical-safety disclaimers.
- `docs/product/README.md`: RenalCareAI product authority map.

## Approach

1. Add a `chatbox-rag/` Python service with FastAPI, OpenAI client usage,
   ingestion, local vector store, and documented run commands.
2. Add source URLs from CDC, NIDDK, National Kidney Foundation, MedlinePlus, and
   OpenAI API references.
3. Create `.env.example` and a local `.env` placeholder while keeping secrets
   ignored by git.
4. Update frontend chatbox UI to be taller, richer, and API-connected.
5. Validate frontend build/lint and Python syntax.

## Progress

- [x] Created plan.
- [x] Python RAG service added.
- [x] Frontend chatbox connected and redesigned.
- [x] Validation completed.

## Notes

- The local `.env` file must not contain a real key in source control.
- The RAG service is a separate development surface and can later be deployed as
  its own service or proxied through the Spring Boot backend.
- Spring Boot now autostarts the Python RAG process through `app.rag.*` and
  exposes `/api/chat` as the frontend-facing proxy.
- `python -m app.start` builds the vector store on first startup when
  `storage/vector_store.json` is missing.

## Validation

- `python -c "...compile(...)"`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `scripts\bin\harness doctor`: passed.
- `mvn test`: passed after adding an H2-backed test profile with RAG autostart
  disabled.
