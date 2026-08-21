# RenalCareAI Sample Data

Use this sample data only in local development or a disposable staging
database. The password hashes below are BCrypt hashes for demo accounts.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@renalcare.ai` | `Password123` |
| Admin | `admin@renalcare.ai` | `Password123` |

## Insert SQL

```sql
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    status,
    created_at,
    updated_at
) VALUES
(
    'Nguyen Minh An',
    'customer@renalcare.ai',
    '$2a$10$A4uWvHcpUj1X3pOfMzKFLeFsCFM9SbHF218pJVgu53HmIkLz8MLlq',
    'CUSTOMER',
    'ACTIVE',
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
),
(
    'Quan tri RenalCareAI',
    'admin@renalcare.ai',
    '$2a$10$A4uWvHcpUj1X3pOfMzKFLeFsCFM9SbHF218pJVgu53HmIkLz8MLlq',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
);
```

The hash is for `Password123`. Replace it before using any seed data outside a
local development environment.
