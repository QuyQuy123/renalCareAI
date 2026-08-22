"""Train a clinical CKD classifier on the UCI Apollo Hospitals dataset.

Uses the deterministic stratified train/test split produced by
``ckd.data.prepare_clinical_uci400`` (``data/processed/ckd_clinical_uci400_{train,test}.csv``).
The target is ``is_ckd`` (1 = CKD, 0 = No CKD).

Usage::

    python -m ckd.models.train_clinical
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ckd.config import PROJECT_ROOT

PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
MODEL_DIR = PROJECT_ROOT / "models"
REPORT_DIR = PROJECT_ROOT / "reports"

TARGET = "is_ckd"
ID_COLUMN = "record_id"

NUMERIC_COLUMNS = [
    "age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "sod",
    "pot", "hemo", "pcv", "wbcc", "rbcc",
]
CATEGORICAL_COLUMNS = [
    "rbc", "pc", "pcc", "ba", "htn", "dm", "cad", "appet", "pe", "ane",
]

SEED = 42


def load_splits() -> tuple[pd.DataFrame, pd.DataFrame]:
    train = pd.read_csv(PROCESSED_DIR / "ckd_clinical_uci400_train.csv")
    test = pd.read_csv(PROCESSED_DIR / "ckd_clinical_uci400_test.csv")
    return train, test


def make_preprocessor() -> ColumnTransformer:
    numeric = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("num", numeric, NUMERIC_COLUMNS),
            ("cat", categorical, CATEGORICAL_COLUMNS),
        ]
    )


def make_candidates(seed: int = SEED) -> dict[str, dict]:
    return {
        "logistic_regression": {
            "estimator": LogisticRegression(max_iter=2000, random_state=seed),
            "importances": "coefficients",
        },
        "random_forest": {
            "estimator": RandomForestClassifier(
                n_estimators=300, min_samples_leaf=2, random_state=seed
            ),
            "importances": "feature_importances",
        },
        "gradient_boosting": {
            "estimator": GradientBoostingClassifier(random_state=seed),
            "importances": "feature_importances",
        },
    }


def cross_validate_candidates(
    X_train: pd.DataFrame, y_train: pd.Series, seed: int = SEED
) -> tuple[dict[str, dict], str]:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    summaries: dict[str, dict] = {}
    for name, spec in make_candidates(seed).items():
        pipe = Pipeline(
            steps=[("preprocess", make_preprocessor()), ("model", spec["estimator"])]
        )
        scores = cross_validate(
            pipe,
            X_train,
            y_train,
            cv=cv,
            scoring={"accuracy": "accuracy", "roc_auc": "roc_auc", "f1": "f1"},
        )
        summaries[name] = {
            "cv_accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "cv_accuracy_std": float(np.std(scores["test_accuracy"])),
            "cv_roc_auc_mean": float(np.mean(scores["test_roc_auc"])),
            "cv_f1_mean": float(np.mean(scores["test_f1"])),
        }
    best_name = max(summaries, key=lambda name: summaries[name]["cv_roc_auc_mean"])
    return summaries, best_name


def get_feature_names(preprocessor: ColumnTransformer) -> list[str]:
    output_names = preprocessor.get_feature_names_out()
    return [name.split("__", 1)[1] for name in output_names]


def get_importance_table(
    fitted_pipeline: Pipeline, kind: str
) -> pd.DataFrame:
    preprocessor = fitted_pipeline.named_steps["preprocess"]
    model = fitted_pipeline.named_steps["model"]
    names = get_feature_names(preprocessor)
    if kind == "coefficients":
        values = np.abs(model.coef_[0])
    else:
        values = model.feature_importances_
    table = (
        pd.DataFrame({"feature": names, "importance": values})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )
    return table


def evaluate_on_test(
    fitted_pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series
) -> dict:
    y_pred = fitted_pipeline.predict(X_test)
    y_prob = fitted_pipeline.predict_proba(X_test)[:, 1]
    report = classification_report(
        y_test, y_pred, target_names=["No CKD", "CKD"], output_dict=True
    )
    return {
        "test_rows": int(len(y_test)),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, y_pred)),
        "precision_ckd": float(precision_score(y_test, y_pred)),
        "recall_sensitivity_ckd": float(recall_score(y_test, y_pred)),
        "f1_ckd": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": report,
    }


def main(seed: int = SEED) -> dict:
    train, test = load_splits()
    feature_columns = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS
    X_train, y_train = train[feature_columns], train[TARGET]
    X_test, y_test = test[feature_columns], test[TARGET]

    cv_summaries, best_name = cross_validate_candidates(X_train, y_train, seed)

    candidates = make_candidates(seed)
    best_pipeline = Pipeline(
        steps=[
            ("preprocess", make_preprocessor()),
            ("model", candidates[best_name]["estimator"]),
        ]
    )
    best_pipeline.fit(X_train, y_train)
    test_metrics = evaluate_on_test(best_pipeline, X_test, y_test)
    importance_table = get_importance_table(
        best_pipeline, candidates[best_name]["importances"]
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "ckd_clinical_pipeline.joblib"
    joblib.dump(best_pipeline, model_path)

    result = {
        "dataset": "UCI Apollo Hospitals CKD (400 rows)",
        "target": TARGET,
        "best_model": best_name,
        "cv_summary": cv_summaries,
        "test_metrics": test_metrics,
        "top_features": importance_table.head(15).to_dict(orient="records"),
        "artifacts": {"model_path": str(model_path)},
    }
    metrics_path = REPORT_DIR / "metrics_clinical_uci400.json"
    metrics_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    importance_table.to_csv(
        REPORT_DIR / "feature_importance_clinical_uci400.csv", index=False
    )
    print(f"Best model: {best_name}")
    print(f"Test accuracy: {test_metrics['accuracy']:.4f}")
    print(f"Test ROC-AUC:  {test_metrics['roc_auc']:.4f}")
    print(f"Sensitivity (recall CKD): {test_metrics['recall_sensitivity_ckd']:.4f}")
    print(f"Model saved to: {model_path}")
    print(f"Metrics saved to: {metrics_path}")
    return result


if __name__ == "__main__":
    main()
