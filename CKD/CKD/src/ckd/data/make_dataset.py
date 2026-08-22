import pandas as pd
from pathlib import Path
from ckd.config import load_config


def load_raw_data(cfg=None, raw_path=None) -> pd.DataFrame:
    cfg = cfg or load_config()
    path = Path(raw_path) if raw_path else Path(cfg["data"]["raw_path"])
    return pd.read_csv(path)


def save_processed(df: pd.DataFrame, cfg=None, name="dataset.parquet") -> None:
    cfg = cfg or load_config()
    out = Path(cfg["data"]["processed_path"]) / name
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out, index=False)
