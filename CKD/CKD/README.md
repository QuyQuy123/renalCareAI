# CKD - Chronic Kidney Disease Classification

Dự án Machine Learning phân loại bệnh thận mạn (CKD) từ bộ dữ liệu lâm sàng UCI Apollo Hospitals (`data/processed/ckd_clinical_uci400_standard.csv`, 400 mẫu).

## Cấu trúc

```
CKD/
├── data/
│   ├── raw/          # Dữ liệu gốc (không sửa)
│   ├── processed/    # Dữ liệu đã làm sạch
│   └── external/     # Dữ liệu tham khảo bên ngoài
├── notebooks/        # Jupyter notebooks (EDA, modeling)
├── src/ckd/          # Package chính
│   ├── data/         # Load & làm sạch dữ liệu
│   ├── features/     # Feature engineering
│   ├── models/       # Train & predict
│   └── visualization/# Biểu đồ, EDA
├── models/           # Model đã train
├── reports/figures/  # Hình ảnh báo cáo
├── config/           # Cấu hình YAML
├── tests/            # Unit tests
├── requirements.txt
└── pyproject.toml
```

## Cài đặt

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -e ".[dev]"
```

## Sử dụng

```bash
.venv\Scripts\python -m ckd.models.train_clinical
```

Kết quả: model lưu tại `models/ckd_clinical_pipeline.joblib`, metrics tại `reports/metrics_clinical_uci400.json`.

```python
from ckd.models.train_clinical import main

result = main()
print(result["test_metrics"]["accuracy"])
```

## Chạy test

```bash
pytest
```
