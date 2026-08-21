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
    phone_number,
    date_of_birth,
    gender,
    address,
    health_note,
    password_hash,
    role,
    status,
    created_at,
    updated_at
) VALUES
(
    'Nguyen Minh An',
    'customer@renalcare.ai',
    '0901234567',
    '1994-05-12',
    'Nam',
    'Ha Noi',
    'Tien su tang huyet ap, muon theo doi nguy co benh than.',
    '$2a$10$A4uWvHcpUj1X3pOfMzKFLeFsCFM9SbHF218pJVgu53HmIkLz8MLlq',
    'CUSTOMER',
    'ACTIVE',
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
),
(
    'Quan tri RenalCareAI',
    'admin@renalcare.ai',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '$2a$10$A4uWvHcpUj1X3pOfMzKFLeFsCFM9SbHF218pJVgu53HmIkLz8MLlq',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6)
);

INSERT INTO medical_records (
    user_id,
    original_file_name,
    stored_file_name,
    file_path,
    content_type,
    file_size,
    status,
    risk_summary,
    uploaded_at
) VALUES (
    1,
    'ket-qua-xet-nghiem-mau.pdf',
    'sample-medical-record.pdf',
    'uploads/medical-records/1/sample-medical-record.pdf',
    'application/pdf',
    245760,
    'PENDING_ANALYSIS',
    'Da tai len. He thong se phan tich nguy co benh than o buoc tiep theo.',
    CURRENT_TIMESTAMP(6)
);
```

The hash is for `Password123`. Replace it before using any seed data outside a
local development environment.
