# RenalCareAI Product Docs

This directory maps RenalCareAI product authority for future work. Keep detailed
product, design, and architecture intent in the source documents below instead
of copying large sections here.

## Authoritative Sources

Before any code change, read the project entrypoint and the relevant authority:

1. `AGENTS.md`
2. `docs/WORKFLOW.md`
3. `RULES.md`
4. `DESIGN_Customer.md`
5. `DESIGN_Admin.md`
6. `ARCHITECTURE.md`

Use these files as the current product contract:

- `RULES.md`: required coding rules, medical-safety boundaries, security rules,
  and deployment rules.
- `DESIGN_Customer.md`: customer-facing design and experience authority.
- `DESIGN_Admin.md`: admin-facing design and experience authority.
- `ARCHITECTURE.md`: system architecture, user flows, data model direction,
  security principles, and CI/CD expectations.
- `docs/product/risk-model.md`: current medical-record extraction, OCR, KFRE,
  CKD feature guidance, and risk-screening boundaries.

## Product Boundary

RenalCareAI is a kidney-health support system. Features that estimate kidney
disease risk or suggest food, exercise, medication reminders, or follow-up
actions must remain supportive guidance and must not claim to replace doctors or
provide definitive diagnosis.

## Update Rule

When behavior changes:

1. Update the affected authority document when expected behavior, design,
   architecture, security, or deployment guidance changes.
2. Update the active execution plan when complex work uses one.
3. Add a lasting decision in `docs/decisions/` only when future work must inherit
   a consequential product, architecture, data, security, compatibility, or
   validation choice.
4. Add or update executable proof that exercises the behavior.

Bounded changes do not require a parallel lifecycle record.
