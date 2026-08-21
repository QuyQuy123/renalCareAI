# RenalCareAI Architecture

RenalCareAI is a personal kidney-care assistant that helps users ask kidney-health questions, upload medical records after login, estimate kidney-disease risk, and receive suggestions for meals, exercise, medication reminders, and follow-up actions. The system must support both customer-facing flows and future admin/clinical management flows.

## Technology Stack

- Frontend: React, TypeScript, Vite.
- Backend: Spring Boot, Java 21, Spring MVC/WebFlux, Spring Security, Spring Data JPA.
- Database: MySQL, local default `localhost:3307/RenalCareAI`.
- Deployment:
  - Frontend: Vercel.
  - Backend: Render.
  - Database: hosted MySQL service, configured through environment variables in production.

## High-Level Components

1. Frontend application
   - Provides customer pages, admin pages, authentication screens, chat box, medical-record upload UI, risk dashboard, and recommendation views.
   - Calls backend APIs through a configured API base URL.

2. Backend API
   - Owns authentication, authorization, user profile data, medical-record metadata, risk-analysis workflow, chat endpoints, and recommendation APIs.
   - Validates requests before saving data or triggering prediction/recommendation logic.
   - Keeps medical and account data behind authenticated endpoints.

3. MySQL database
   - Stores users, roles, profiles, uploaded-record metadata, extracted health indicators, risk scores, chat sessions/messages, recommendations, medication plans, exercise plans, and audit data.

4. AI and prediction layer
   - Parses structured indicators from uploaded medical records.
   - Estimates kidney-risk level from clinical values and user context.
   - Produces food, exercise, medication, lifestyle, and follow-up recommendations.
   - Chat answers must include medical-safety disclaimers and should encourage users to consult healthcare professionals for diagnosis or treatment decisions.

## Core User Flows

### Customer

1. Visitor opens the frontend and can view public health information.
2. User registers or logs in.
3. Authenticated user uploads medical records.
4. Backend stores the file metadata and extracts useful health indicators.
5. Risk-analysis service calculates risk level and explanation.
6. Recommendation service suggests meals, exercise, medication reminders, and lifestyle actions.
7. User can chat with the system about kidney-health questions and their own saved results.

### Admin

1. Admin logs in with elevated role.
2. Admin views users, uploaded records, risk results, recommendations, and system activity.
3. Admin can manage educational content, review flagged AI outputs, and monitor system quality.

## Suggested Backend Package Structure

```text
com.renalCareAI.renalCareAI
  common
  config
  controller
  dto
    request
    response
  model
  repository
  service
    impl
  rag
```

Backend code is organized by layer. Controllers belong in `controller`, service contracts belong in `service`, service implementations belong in `service.impl`, JPA entities and enums belong in `model`, Spring Data repositories belong in `repository`, request DTOs belong in `dto.request`, response DTOs belong in `dto.response`, and shared exceptions, response wrappers, validation helpers, and constants belong in `common`.

## Data Model Direction

- `users`: login identity, encrypted password, account status.
- `roles`: role names such as `CUSTOMER` and `ADMIN`.
- `user_profiles`: age, gender, height, weight, health background.
- `medical_records`: uploaded file metadata, owner, upload status.
- `health_indicators`: creatinine, eGFR, urea/BUN, urine protein, blood pressure, glucose, and other extracted values.
- `risk_assessments`: risk score, risk level, model version, explanation.
- `recommendations`: food, exercise, medication reminder, lifestyle, and follow-up suggestions.
- `chat_sessions` and `chat_messages`: conversation history and safety metadata.

## Security Principles

- Never expose raw database credentials in frontend code.
- Production secrets must be configured through Render/Vercel/GitHub environment variables.
- Passwords must be hashed before storage.
- Medical records and extracted health data are sensitive; endpoints must require authentication and ownership checks.
- Admin endpoints must require an admin role.
- AI responses must not claim to replace doctors or provide definitive diagnosis.

## CI/CD

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs on every push to `main`.

1. Backend CI installs JDK 21 and runs Maven tests.
2. Frontend CI installs Node.js dependencies, runs lint, and builds Vite.
3. If backend CI passes, GitHub triggers the Render deploy hook.
4. If frontend CI passes, GitHub deploys the Vercel project to production.

Required GitHub Secrets:

- `RENDER_DEPLOY_HOOK_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required Render environment variables for backend production:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `SPRING_JPA_SHOW_SQL`

For production, prefer `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` after database migrations are introduced.
