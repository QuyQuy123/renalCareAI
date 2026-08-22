import joblib
import pandas as pd
from pathlib import Path

from ckd.config import PROJECT_ROOT

MODEL_PATH = PROJECT_ROOT / "models" / "ckd_clinical_pipeline.joblib"

FEATURE_COLUMNS = [
    "age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod",
    "pot", "hemo", "pcv", "wbcc", "rbcc",
    "rbc", "pc", "pcc", "ba", "htn", "dm", "cad", "appet", "pe", "ane",
]


def load_model(model_path=None):
    path = Path(model_path) if model_path else MODEL_PATH
    return joblib.load(path)


def predict(df: pd.DataFrame, model=None) -> pd.Series:
    model = model or load_model()
    return pd.Series(model.predict(df[FEATURE_COLUMNS]), index=df.index, name="prediction")


def predict_proba(df: pd.DataFrame, model=None) -> pd.Series:
    model = model or load_model()
    proba = model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    return pd.Series(proba, index=df.index, name="ckd_probability")
