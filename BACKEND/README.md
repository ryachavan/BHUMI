# BHUMI — Sikkim Landslide ML Inference Backend

Flask API serving the trained `RandomForestClassifier` model for real-time landslide risk prediction.

## Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server starts on **http://localhost:5000**.

> **Important:** This backend must be running **before** executing `backend/12_hourly_cloud_updater.py`, which calls the `/predict/batch` endpoint to score all grid cells with the real ML model. If the backend is not running, the updater will fall back to the legacy sigmoid formula and log a warning.

## Endpoints

### `GET /health`
Returns `{"status": "ok", "model_loaded": true}`.

### `POST /predict`
Single-cell prediction.

**Request:**
```json
{
  "rainfall_mm": 80,
  "soil_moisture": 60,
  "slope_degree": 30,
  "elevation_m": 2000,
  "temperature_c": 15,
  "humidity": 75
}
```

**Response:**
```json
{
  "risk_probability": 0.7234,
  "risk_percentage": 72.34,
  "risk_level": "SEVERE",
  "inputs_used": { ... }
}
```

### `POST /predict/batch`
Batch prediction for the entire grid. Accepts a JSON array of feature dicts, returns predictions in the same order.

**Request:**
```json
[
  {"rainfall_mm": 80, "soil_moisture": 60, "slope_degree": 30, "elevation_m": 2000, "temperature_c": 15, "humidity": 75},
  {"rainfall_mm": 10, "soil_moisture": 30, "slope_degree": 5, "elevation_m": 4000, "temperature_c": 8, "humidity": 50}
]
```

**Response:**
```json
[
  {"risk_probability": 0.7234, "risk_percentage": 72.34, "risk_level": "SEVERE"},
  {"risk_probability": 0.0812, "risk_percentage": 8.12, "risk_level": "LOW"}
]
```

## Model

- **File:** `sikkim_landslide_model.joblib`
- **Type:** scikit-learn `RandomForestClassifier`
- **Features (6):** `rainfall_mm`, `soil_moisture`, `slope_degree`, `elevation_m`, `temperature_c`, `humidity`
- **Output:** Binary probability (class 1 = landslide susceptible)
