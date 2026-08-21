# RenalCareAI Risk Model Notes

This document records how the current medical-record risk screening borrows
ideas from external kidney-disease projects while staying conservative for a
personal support application.

## Applied Sources

### `lshpaner/kfre`

Use this project as the primary reference for structured kidney-failure risk
estimation. The useful parts for RenalCareAI are:

- KFRE 4-variable model: age, sex, eGFR, and uACR.
- Optional KFRE 6-variable and 8-variable direction for later: diabetes,
  hypertension, serum albumin, phosphorus, bicarbonate, and calcium.
- Strict input handling:
  - uACR must be positive.
  - sex must be recognized instead of silently coerced.
  - KFRE is most appropriate for adults with CKD stages G3-G5.
  - Outputs must be treated as risk estimates, not diagnosis.

Current backend implementation applies the KFRE 4-variable equation only when
age, sex, eGFR, and uACR are available from OCR/text extraction. If any required
input is missing, the response explicitly states that KFRE could not be
calculated.

### `ryuzaki-ved/ckd_detection`

Use this project as feature-engineering guidance, not as a production model.
The repository uses the UCI CKD dataset and a neural-network pipeline with
missing-value imputation, label encoding, scaling, PCA, oversampling, model
evaluation, and SHAP explanation. That is useful for deciding what uploaded
records should extract, but the trained `.h5` model should not be dropped into
RenalCareAI without a reproducible preprocessing pipeline and validation.

Current backend extraction therefore watches for these CKD-related indicators:

- age
- blood pressure
- specific gravity
- urine albumin/protein
- urine sugar/glucose
- blood glucose
- blood urea/BUN
- serum creatinine
- sodium
- potassium
- hemoglobin
- diabetes and hypertension mentions
- edema and anemia mentions

## Current Product Position

RenalCareAI currently performs supportive screening:

1. Extract text and indicators from PDF/text files.
2. Use OpenAI OCR for images, scans, or weak local extraction.
3. Compute KFRE 2-year and 5-year estimates when the required inputs are
   available.
4. Combine KFRE with conservative CKD-signal rules for eGFR, uACR,
   creatinine, blood pressure, potassium, blood urea, hemoglobin, and urine
   indicators.
5. Store extracted JSON and prediction JSON in `medical_records`.

The result must remain phrased as guidance for discussion with a healthcare
professional, not a diagnosis or treatment order.
