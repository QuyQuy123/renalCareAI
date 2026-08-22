import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from pathlib import Path

from ckd.config import load_config


def plot_correlation(df: pd.DataFrame, cfg=None, name="correlation.png") -> None:
    cfg = cfg or load_config()
    out_dir = Path(cfg["report"]["figures_path"])
    out_dir.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(12, 10))
    sns.heatmap(df.corr(numeric_only=True), annot=False, cmap="RdBu_r")
    plt.tight_layout()
    plt.savefig(out_dir / name, dpi=150)
    plt.close()
