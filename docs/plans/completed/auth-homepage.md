# Auth And Homepage Refresh

## Outcome

Build a polished Vietnamese homepage with proper accents, add email/password
registration and login, persist user identity in the frontend session, create
backend user entities and auth APIs, and document the resulting database tables
plus sample seed data.

## Authority

- `RULES.md`: medical guidance must remain supportive; passwords and secrets
  must be protected.
- `DESIGN_Customer.md`: customer-facing experience authority.
- `DESIGN_Admin.md`: admin-facing experience authority.
- `ARCHITECTURE.md`: backend package structure, auth/user data direction, and
  security principles.
- `docs/product/README.md`: product authority map.

## Approach

1. Add backend auth/user model, repository, service, controller, security config,
   and CORS config.
2. Add database documentation for auth tables and sample insert data.
3. Rework frontend homepage copy/design with Vietnamese accents.
4. Add register/login UI and API integration through `VITE_API_BASE_URL`.
5. Validate backend tests and frontend lint/build.

## Progress

- [x] Created plan.
- [x] Backend auth and user model implemented.
- [x] Database docs added.
- [x] Frontend homepage/auth UI implemented.
- [x] Validation completed.

## Validation

- `mvn test` passed for backend.
- `npm run lint` passed for frontend.
- `npm run build` passed for frontend.

## Risks

- JWT/protected-resource enforcement is not required for the current UI-only
  authenticated homepage state; future medical-record upload endpoints should add
  token-based authorization before handling sensitive data.
