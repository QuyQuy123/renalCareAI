"""Prepare the UCI Apollo Hospitals CKD dataset for clinical research.

This module preserves source missingness, normalizes known text artifacts, and
creates a deterministic stratified development/test split.  It intentionally
does not impute, encode, scale, or oversample before splitting.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[3]
SOURCE_PATH = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "uci_ckd_400"
    / "Chronic_Kidney_Disease"
    / "chronic_kidney_disease_full.arff"
)
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_DIR = (
    PROJECT_ROOT
    / "outputs"
    / "01a00af2-bedd-74e1-a0e3-5211c67d89e7"
)

EXPECTED_COLUMNS = [
    "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba",
    "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wbcc",
    "rbcc", "htn", "dm", "cad", "appet", "pe", "ane", "class",
]

NUMERIC_COLUMNS = [
    "age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod",
    "pot", "hemo", "pcv", "wbcc", "rbcc",
]

CATEGORICAL_COLUMNS = [
    "rbc", "pc", "pcc", "ba", "htn", "dm", "cad", "appet", "pe",
    "ane", "class",
]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _parse_arff(path: Path) -> tuple[pd.DataFrame, int]:
    columns: list[str] = []
    rows: list[list[str]] = []
    structural_corrections = 0
    in_data = False
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        lower = stripped.lower()
        if lower.startswith("@attribute"):
            quoted = re.search(r"'([^']+)'", stripped)
            if not quoted:
                raise ValueError(f"Cannot parse attribute line: {stripped}")
            columns.append(quoted.group(1))
        elif lower == "@data":
            in_data = True
        elif in_data and stripped and not stripped.startswith("%"):
            row = next(csv.reader([stripped]))
            if len(row) == len(columns) + 1 and row[-1] == "":
                row.pop()
                structural_corrections += 1
            elif (
                len(row) == len(columns) + 1
                and row[-1].strip().lower() in {"ckd", "notckd"}
                and row[22].strip().lower() in {"good", "poor"}
            ):
                # One source row has an extra "no" before the appetite field.
                row.pop(21)
                structural_corrections += 1
            rows.append(row)

    if columns != EXPECTED_COLUMNS:
        raise ValueError(f"Unexpected UCI schema: {columns}")
    if any(len(row) != len(columns) for row in rows):
        raise ValueError("ARFF data row has an unexpected number of fields")
    return pd.DataFrame(rows, columns=columns), structural_corrections


def _stratified_split(target: pd.Series, test_fraction: float = 0.20, seed: int = 42):
    rng = np.random.default_rng(seed)
    train_parts: list[np.ndarray] = []
    test_parts: list[np.ndarray] = []
    for _, indices in target.groupby(target, sort=True).groups.items():
        shuffled = np.asarray(list(indices), dtype=int)
        rng.shuffle(shuffled)
        test_size = int(round(len(shuffled) * test_fraction))
        test_parts.append(shuffled[:test_size])
        train_parts.append(shuffled[test_size:])
    return pd.Index(np.concatenate(train_parts)), pd.Index(np.concatenate(test_parts))


def prepare() -> dict:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Missing official UCI source: {SOURCE_PATH}")

    raw_text, structural_corrections = _parse_arff(SOURCE_PATH)
    raw_text = raw_text.replace("?", pd.NA)
    normalized = raw_text.copy(deep=True)

    corrections = 0
    for column in CATEGORICAL_COLUMNS:
        before = normalized[column].copy()
        normalized[column] = (
            normalized[column]
            .astype("string")
            .str.replace(r"[\t\r\n]+", "", regex=True)
            .str.strip()
            .str.lower()
            .replace({"": pd.NA})
        )
        corrections += int(((before.astype("string") != normalized[column]) & before.notna()).sum())

    for column in NUMERIC_COLUMNS:
        normalized[column] = pd.to_numeric(
            normalized[column].astype("string").str.strip(), errors="coerce"
        )

    if normalized.shape != (400, 25):
        raise ValueError(f"Unexpected UCI dataset shape: {normalized.shape}")
    if normalized["class"].isna().any():
        raise ValueError("Target class contains missing values")
    if set(normalized["class"]) != {"ckd", "notckd"}:
        raise ValueError(f"Unexpected target labels: {set(normalized['class'])}")

    standardized = normalized.copy(deep=True)
    standardized.insert(
        0,
        "record_id",
        [f"UCI336_{number:03d}" for number in range(1, len(standardized) + 1)],
    )
    standardized["is_ckd"] = standardized["class"].eq("ckd").astype("int8")
    standardized["diagnosis_label"] = standardized["is_ckd"].map(
        {1: "CKD", 0: "No CKD"}
    )

    train_index, test_index = _stratified_split(
        standardized["is_ckd"], test_fraction=0.20, seed=42
    )
    standardized["data_split"] = "train"
    standardized.loc[test_index, "data_split"] = "test"

    ordered_columns = [
        "record_id",
        *EXPECTED_COLUMNS,
        "is_ckd",
        "diagnosis_label",
        "data_split",
    ]
    standardized = standardized[ordered_columns]
    model_columns = [
        "record_id",
        *[column for column in EXPECTED_COLUMNS if column != "class"],
        "is_ckd",
    ]
    train = standardized.loc[train_index, model_columns].sort_values("record_id")
    test = standardized.loc[test_index, model_columns].sort_values("record_id")

    for directory in (PROCESSED_DIR, OUTPUT_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    processed_paths = {
        "standard": PROCESSED_DIR / "ckd_clinical_uci400_standard.csv",
        "train": PROCESSED_DIR / "ckd_clinical_uci400_train.csv",
        "test": PROCESSED_DIR / "ckd_clinical_uci400_test.csv",
        "raw_parsed": PROCESSED_DIR / "ckd_clinical_uci400_raw_parsed.csv",
    }
    standardized.to_csv(processed_paths["standard"], index=False, encoding="utf-8")
    train.to_csv(processed_paths["train"], index=False, encoding="utf-8")
    test.to_csv(processed_paths["test"], index=False, encoding="utf-8")
    raw_text.to_csv(processed_paths["raw_parsed"], index=False, encoding="utf-8")
    for path in processed_paths.values():
        (OUTPUT_DIR / path.name).write_bytes(path.read_bytes())

    missing_counts = {
        column: int(value)
        for column, value in normalized.isna().sum().sort_values(ascending=False).items()
    }
    class_counts = {
        label: int(count)
        for label, count in normalized["class"].value_counts().items()
    }
    split_counts_frame = (
        standardized.groupby(["diagnosis_label", "data_split"], observed=True)
        .size()
        .unstack(fill_value=0)
    )
    split_counts = {
        label: {
            split: int(split_counts_frame.loc[label].get(split, 0))
            for split in ("train", "test")
        }
        for label in split_counts_frame.index
    }

    qc = {
        "source_path": str(SOURCE_PATH),
        "source_sha256": _sha256(SOURCE_PATH),
        "rows": int(len(standardized)),
        "source_columns": 25,
        "standard_columns": int(standardized.shape[1]),
        "class_counts": class_counts,
        "split_counts": split_counts,
        "train_rows": int(len(train)),
        "test_rows": int(len(test)),
        "duplicate_rows_raw": int(raw_text.duplicated().sum()),
        "missing_cells": int(normalized.isna().sum().sum()),
        "missing_counts": missing_counts,
        "text_artifact_corrections": corrections,
        "structural_row_corrections": structural_corrections,
        "source_url": "https://archive.ics.uci.edu/dataset/336/chronic",
        "source_doi": "https://doi.org/10.24432/C5G020",
        "source_hospital": "Apollo Hospitals, Karaikudi, Tamil Nadu, India",
        "source_license": "CC BY 4.0",
        "kdigo_url": "https://kdigo.org/wp-content/uploads/2024/03/KDIGO-2024-CKD-Guideline.pdf",
        "external_candidate_url": "https://archive.ics.uci.edu/dataset/857/risk+factor+prediction+of+chronic+kidney+disease",
        "external_candidate_reason_not_merged": (
            "The 200-row Bangladesh release stores most measurements as discretized "
            "interval labels and contains ambiguous/corrupted ranges, so it was not "
            "merged with continuous UCI336 measurements."
        ),
    }
    (OUTPUT_DIR / "ckd_clinical_uci400_qc.json").write_text(
        json.dumps(qc, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(qc, ensure_ascii=False, indent=2))
    return qc


if __name__ == "__main__":
    prepare()
