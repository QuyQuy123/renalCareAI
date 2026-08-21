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

The architecture also expects these future tables:

- `user_profiles`
- `medical_records`
- `health_indicators`
- `risk_assessments`
- `recommendations`
- `chat_sessions`
- `chat_messages`

Add table details here when those features are implemented.
