# RenalCareAI Coding Rules

Before starting any code change in this project, read these files in order:

1. `RULES.md`
2. `DESIGN_Customer.md`
3. `DESIGN_Admin.md`
4. `ARCHITECTURE.md`

## Product Rules

- RenalCareAI is a kidney-health support system, not a replacement for doctors.
- Any feature that predicts disease risk or gives medical recommendations must clearly treat the result as supportive guidance.
- Preserve the customer and admin experiences described in the design documents.
- Keep sensitive medical data private and scoped to the authenticated owner unless an admin flow explicitly requires access.

## Engineering Rules

- Follow the architecture described in `ARCHITECTURE.md`.
- Backend code should be organized by feature package when possible.
- Frontend code should keep customer and admin flows understandable and separated.
- Use environment variables for production secrets and service URLs.
- Do not put database passwords, API keys, deploy tokens, or medical sample data into frontend code.
- Add validation for user input, uploaded files, and medical indicator values.
- Add tests for business logic that affects authentication, authorization, risk scoring, and recommendations.

## Deployment Rules

- The `main` branch is the personal production branch.
- Pushes to `main` trigger CI/CD through `.github/workflows/deploy.yml`.
- Backend deployment is handled by Render.
- Frontend deployment is handled by Vercel.
- Database credentials for hosted MySQL must be configured in Render environment variables, not committed into code.
