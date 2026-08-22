from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("renalcareai.ml_predictor")

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = BASE_DIR / "storage" / "models" / "ckd_clinical_pipeline.joblib"

FEATURE_COLUMNS = [
    "age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod",
    "pot", "hemo", "pcv", "wbcc", "rbcc",
    "rbc", "pc", "pcc", "ba", "htn", "dm", "cad", "appet", "pe", "ane",
]

NUMERIC_COLUMNS = [
    "age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod",
    "pot", "hemo", "pcv", "wbcc", "rbcc",
]

CATEGORICAL_COLUMNS = [
    "rbc", "pc", "pcc", "ba", "htn", "dm", "cad", "appet", "pe", "ane",
]

# Aliases mapping user-friendly keys to model feature names
FEATURE_ALIASES: dict[str, str] = {
    "age": "age",
    "tuoi": "age",
    "bp": "bp",
    "blood_pressure": "bp",
    "bloodpressure": "bp",
    "systolic": "bp",
    "systolicbloodpressure": "bp",
    "huyet_ap": "bp",
    "huyetap": "bp",
    "sg": "sg",
    "specific_gravity": "sg",
    "specificgravity": "sg",
    "ty_trong": "sg",
    "tytrong": "sg",
    "al": "al",
    "albumin": "al",
    "albumin_urine": "al",
    "urine_albumin": "al",
    "dam_nieu": "al",
    "damnieu": "al",
    "protein_nieu": "al",
    "su": "su",
    "sugar": "su",
    "urine_sugar": "su",
    "duong_nieu": "su",
    "bgr": "bgr",
    "blood_glucose": "bgr",
    "glucose": "bgr",
    "duong_huyet": "bgr",
    "bu": "bu",
    "blood_urea": "bu",
    "urea": "bu",
    "ure": "bu",
    "bun": "bu",
    "sc": "sc",
    "serum_creatinine": "sc",
    "creatinine": "sc",
    "creatinin": "sc",
    "sod": "sod",
    "sodium": "sod",
    "natri": "sod",
    "pot": "pot",
    "potassium": "pot",
    "kali": "pot",
    "hemo": "hemo",
    "hemoglobin": "hemo",
    "hgb": "hemo",
    "hb": "hemo",
    "pcv": "pcv",
    "packed_cell_volume": "pcv",
    "dung_tich_hong_cau": "pcv",
    "wbcc": "wbcc",
    "wbc": "wbcc",
    "bach_cau": "wbcc",
    "white_blood_cell": "wbcc",
    "rbcc": "rbcc",
    "rbc_count": "rbcc",
    "hong_cau": "rbcc",
    "red_blood_cell": "rbcc",
    # Categorical
    "rbc": "rbc",
    "pc": "pc",
    "pcc": "pcc",
    "ba": "ba",
    "bacteria": "ba",
    "vi_khuan": "ba",
    "htn": "htn",
    "hypertension": "htn",
    "tang_huyet_ap": "htn",
    "cao_huyet_ap": "htn",
    "dm": "dm",
    "diabetes": "dm",
    "tieu_duong": "dm",
    "dai_thao_duong": "dm",
    "cad": "cad",
    "coronary_artery_disease": "cad",
    "mach_vanh": "cad",
    "appet": "appet",
    "appetite": "appet",
    "an_uong": "appet",
    "pe": "pe",
    "pedal_edema": "pe",
    "edema": "pe",
    "phu": "pe",
    "phu_chan": "pe",
    "ane": "ane",
    "anemia": "ane",
    "thieu_mau": "ane",
}


@lru_cache(maxsize=1)
def load_ckd_pipeline(model_path: Path | str | None = None) -> Any:
    path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
    if not path.exists():
        fallback_path = BASE_DIR.parent / "CKD" / "CKD" / "models" / "ckd_clinical_pipeline.joblib"
        if fallback_path.exists():
            path = fallback_path
        else:
            raise FileNotFoundError(f"CKD ML pipeline model not found at {path} or {fallback_path}")
    
    logger.info("Loading CKD ML pipeline from %s", path)
    return joblib.load(path)


def normalize_input_features(raw_features: dict[str, Any]) -> dict[str, Any]:
    """Map user-provided features to standard 24 model features."""
    normalized: dict[str, Any] = {}
    for key, value in raw_features.items():
        clean_key = key.strip().lower().replace("-", "_").replace(" ", "_")
        canonical_key = FEATURE_ALIASES.get(clean_key, clean_key)
        if canonical_key in FEATURE_COLUMNS:
            if canonical_key in NUMERIC_COLUMNS:
                try:
                    if value is not None and value != "":
                        normalized[canonical_key] = float(value)
                except (ValueError, TypeError):
                    pass
            elif canonical_key in CATEGORICAL_COLUMNS:
                if isinstance(value, bool):
                    normalized[canonical_key] = "yes" if value else "no"
                elif isinstance(value, (int, float)):
                    normalized[canonical_key] = "yes" if value > 0 else "no"
                elif isinstance(value, str):
                    val_lower = value.strip().lower()
                    if val_lower in {"yes", "co", "true", "1", "present", "abnormal", "poor"}:
                        if canonical_key in {"rbc", "pc"}:
                            normalized[canonical_key] = "abnormal"
                        elif canonical_key in {"pcc", "ba"}:
                            normalized[canonical_key] = "present"
                        elif canonical_key == "appet":
                            normalized[canonical_key] = "poor"
                        else:
                            normalized[canonical_key] = "yes"
                    elif val_lower in {"no", "khong", "false", "0", "notpresent", "normal", "good"}:
                        if canonical_key in {"rbc", "pc"}:
                            normalized[canonical_key] = "normal"
                        elif canonical_key in {"pcc", "ba"}:
                            normalized[canonical_key] = "notpresent"
                        elif canonical_key == "appet":
                            normalized[canonical_key] = "good"
                        else:
                            normalized[canonical_key] = "no"
                    else:
                        normalized[canonical_key] = val_lower
    return normalized


def assess_clinical_findings(features: dict[str, Any]) -> list[str]:
    """Analyze provided indicators and return clinical observations."""
    findings = []
    sc = features.get("sc")
    if sc is not None:
        if sc >= 2.0:
            findings.append(f"Creatinine huyết thanh tăng cao ({sc} mg/dL) – cảnh báo chức năng lọc của thận suy giảm rõ rệt.")
        elif sc > 1.3:
            findings.append(f"Creatinine huyết thanh hơi cao ({sc} mg/dL) so với ngưỡng bình thường (0.6 - 1.2 mg/dL).")
        else:
            findings.append(f"Creatinine huyết thanh trong giới hạn bình thường ({sc} mg/dL).")

    bp = features.get("bp")
    if bp is not None:
        if bp >= 140:
            findings.append(f"Huyết áp cao ({bp} mmHg) – yếu tố nguy cơ hàng đầu gây tổn thương vi mạch cầu thận.")
        elif bp < 90:
            findings.append(f"Huyết áp thấp ({bp} mmHg).")

    al = features.get("al")
    if al is not None and al > 0:
        findings.append(f"Albumin/đạm niệu dương tính mức {int(al)}/5 – dấu hiệu màng lọc cầu thận bị rò rỉ đạm.")

    sg = features.get("sg")
    if sg is not None and sg < 1.010:
        findings.append(f"Tỷ trọng nước tiểu thấp ({sg}) – gợi ý khả năng cô đặc nước tiểu của thận giảm.")

    hemo = features.get("hemo")
    if hemo is not None and hemo < 11.5:
        findings.append(f"Hemoglobin giảm ({hemo} g/dL) – có dấu hiệu thiếu máu (thường liên quan đến giảm sản xuất Erythropoietin từ thận).")

    bgr = features.get("bgr")
    if bgr is not None and bgr > 140:
        findings.append(f"Đường huyết ngẫu nhiên cao ({bgr} mg/dL) – cần kiểm soát để phòng tránh biến chứng thận do đái tháo đường.")

    bu = features.get("bu")
    if bu is not None and bu > 50:
        findings.append(f"Chỉ số Ure máu tăng ({bu} mg/dL) – nồng độ chất thải chứa nitơ tích tụ trong máu.")

    pot = features.get("pot")
    if pot is not None:
        if pot >= 5.2:
            findings.append(f"Kali máu cao ({pot} mEq/L) – cần thận trọng và theo dõi sát vì có thể ảnh hưởng nhịp tim.")
        elif pot < 3.5:
            findings.append(f"Kali máu thấp ({pot} mEq/L).")

    if features.get("dm") == "yes":
        findings.append("Tiền sử đái tháo đường – nguyên nhân phổ biến nhất dẫn đến bệnh thận mạn.")

    if features.get("htn") == "yes":
        findings.append("Tiền sử tăng huyết áp – tăng áp lực nội cầu thận.")

    if features.get("pe") == "yes":
        findings.append("Triệu chứng phù chân/ngoại biên – có thể do giảm bài tiết natri và nước hoặc mất đạm qua nước tiểu.")

    if features.get("ane") == "yes":
        findings.append("Có biểu hiện thiếu máu.")

    return findings


def predict_ckd_risk(features: dict[str, Any]) -> dict[str, Any]:
    """
    Run prediction on the given features using the trained Scikit-learn Pipeline.
    Missing features are automatically handled by the pipeline's SimpleImputer.
    """
    normalized = normalize_input_features(features)
    if not normalized:
        return {
            "has_prediction": False,
            "message": "Không có đủ chỉ số lâm sàng để chạy mô hình dự đoán.",
            "features_detected": {},
            "ckd_probability": 0.0,
            "risk_level": "UNKNOWN",
            "predicted_class": "UNKNOWN",
            "findings": [],
        }

    try:
        pipeline = load_ckd_pipeline()
    except Exception as error:
        logger.error("Failed to load CKD ML pipeline: %s", error)
        return {
            "has_prediction": False,
            "message": f"Không thể tải mô hình ML: {error}",
            "features_detected": normalized,
            "ckd_probability": 0.0,
            "risk_level": "ERROR",
            "predicted_class": "ERROR",
            "findings": assess_clinical_findings(normalized),
        }

    # Prepare DataFrame row with all 24 features
    row_data = {col: normalized.get(col, np.nan) for col in FEATURE_COLUMNS}
    input_df = pd.DataFrame([row_data])

    try:
        prob = float(pipeline.predict_proba(input_df)[0][1])
        prediction_class = int(pipeline.predict(input_df)[0])
    except Exception as error:
        logger.exception("Error executing CKD pipeline prediction")
        return {
            "has_prediction": False,
            "message": f"Lỗi khi thực thi mô hình: {error}",
            "features_detected": normalized,
            "ckd_probability": 0.0,
            "risk_level": "ERROR",
            "predicted_class": "ERROR",
            "findings": assess_clinical_findings(normalized),
        }

    # Determine risk level
    if prob >= 0.70:
        risk_level = "VERY_HIGH"
        risk_label = "Rất cao"
    elif prob >= 0.45:
        risk_level = "HIGH"
        risk_label = "Cao"
    elif prob >= 0.20:
        risk_level = "MODERATE"
        risk_label = "Trung bình / Cần theo dõi"
    else:
        risk_level = "LOW"
        risk_label = "Thấp"

    findings = assess_clinical_findings(normalized)

    return {
        "has_prediction": True,
        "ckd_probability": round(prob, 4),
        "ckd_probability_percent": round(prob * 100, 1),
        "risk_level": risk_level,
        "risk_label": risk_label,
        "predicted_class": "CKD" if prediction_class == 1 else "NO_CKD",
        "features_detected": normalized,
        "features_count": len(normalized),
        "findings": findings,
    }
