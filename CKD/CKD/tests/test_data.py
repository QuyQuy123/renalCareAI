from ckd.config import load_config
from ckd.data.make_dataset import load_raw_data
from ckd.features.build_features import build_features


def test_load_raw_data():
    df = load_raw_data()
    assert not df.empty
    assert "is_ckd" in df.columns


def test_build_features():
    cfg = load_config()
    df = load_raw_data(cfg=cfg)
    df = build_features(df, cfg=cfg)
    for column in cfg["data"]["drop_columns"]:
        assert column not in df.columns
    assert set(df["is_ckd"].unique()).issubset({0, 1})
