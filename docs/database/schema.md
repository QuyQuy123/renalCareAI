# RenalCareAI Database Schema

This document describes the current database tables required by the implemented
authentication flow. Hibernate can create/update these tables from the JPA
entities while `SPRING_JPA_HIBERNATE_DDL_AUTO=update` is enabled.

## users

Stores login identity and account metadata.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `BIGINT` | Yes | Primary key, auto increment. |
| `full_name` | `VARCHAR(120)` | Yes | Display name shown in the frontend header after login. |
| `email` | `VARCHAR(160)` | Yes | Unique login email, stored lowercase. |
| `phone_number` | `VARCHAR(30)` | No | Optional phone number for profile contact. |
| `date_of_birth` | `DATE` | No | Optional birth date. |
| `gender` | `VARCHAR(20)` | No | Optional user-selected gender label. |
| `address` | `VARCHAR(255)` | No | Optional contact address. |
| `health_note` | `VARCHAR(1000)` | No | Optional health context note entered by the user. |
| `password_hash` | `VARCHAR(255)` | Yes | BCrypt hash only; never store plain-text passwords. |
| `role` | `ENUM`/`VARCHAR(30)` | Yes | `CUSTOMER` or `ADMIN`; Hibernate may create a MySQL `ENUM`. |
| `status` | `ENUM`/`VARCHAR(30)` | Yes | `ACTIVE`, `LOCKED`, or `DISABLED`; Hibernate may create a MySQL `ENUM`. |
| `created_at` | `DATETIME(6)` | Yes | Created by JPA lifecycle hook. |
| `updated_at` | `DATETIME(6)` | Yes | Updated by JPA lifecycle hook. |

Expected unique constraint:

```sql
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);
```

## Planned Tables

## medical_records

Stores metadata for medical examination files uploaded by a logged-in user.
The file is saved on the backend, extracted indicators are stored as JSON, and
the kidney-risk screening result is stored as JSON for the "Hồ sơ khám" view.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `BIGINT` | Yes | Primary key, auto increment. |
| `user_id` | `BIGINT` | Yes | Foreign key to `users.id`. |
| `original_file_name` | `VARCHAR(255)` | Yes | Name uploaded by the user. |
| `stored_file_name` | `VARCHAR(255)` | Yes | Generated safe file name on server. |
| `file_path` | `VARCHAR(600)` | Yes | Server-side storage path. |
| `content_type` | `VARCHAR(120)` | No | MIME type reported by the upload. |
| `file_size` | `BIGINT` | Yes | Uploaded file size in bytes. |
| `status` | `ENUM`/`VARCHAR(40)` | Yes | `UPLOADED`, `PENDING_ANALYSIS`, `ANALYZED`, or `FAILED`. |
| `risk_summary` | `VARCHAR(1000)` | No | Short user-facing risk summary. |
| `extracted_data_json` | `LONGTEXT` | No | JSON object containing extraction mode, OpenAI OCR status/raw output, preview text, and parsed indicators. |
| `prediction_result_json` | `LONGTEXT` | No | JSON object containing risk level, score, findings, recommendations, and limitations. |
| `uploaded_at` | `DATETIME(6)` | Yes | Created by JPA lifecycle hook. |

## Planned Tables

The architecture also expects these future tables:

- `user_profiles`
- `health_indicators`
- `risk_assessments`
- `recommendations`
- `chat_sessions`
- `chat_messages`

Add table details here when those features are implemented.
