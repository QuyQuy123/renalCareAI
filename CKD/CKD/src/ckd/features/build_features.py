import pandas as pd
from ckd.config import PROJECT_ROOT, load_config


def build_features(df: pd.DataFrame, cfg=None) -> pd.DataFrame:
    cfg = cfg or load_config()
    target = cfg["data"]["target"]
    drop_cols = cfg["data"].get("drop_columns", [])
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])
    df = df.dropna(subset=[target]).reset_index(drop=True)
    return df
