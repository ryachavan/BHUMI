# BHUMI: Boundary Hazard & Unstable terrain Monitoring Intelligence

BHUMI is a comprehensive, automated landslide early warning system built for the vulnerable terrains of Sikkim. By combining real time satellite telemetry, machine learning, and explainable AI, BHUMI predicts landslide susceptibility at a highly localized grid level. The system operates on a zero maintenance serverless pipeline that ensures decision makers have access to the most current risk data through an interactive geospatial dashboard.

## Key Features

* Real Time Geospatial Dashboard: A responsive, map based interface providing granular visualization of active threat zones across Sikkim.
* Explainable AI (XAI) Risk Factors: The dashboard displays transparent reasoning for every prediction, explicitly breaking down which environmental factors are driving the risk level.
* Multilingual Support: Breaks down language barriers by providing the interface and critical alerts in multiple regional languages to ensure maximum accessibility.
* Role Based Access Control: Dedicated portals tailored for different stakeholders, including specialized views for Citizens, Government Officials, and Data Analysts.
* Landslide Simulation: Advanced simulation capabilities allow authorities to model hypothetical weather scenarios and visualize potential disaster impacts before they occur.
* Citizen Incident Reporting: Crowdsourced ground truth data collection powered by Firebase Realtime Database (RTDB), enabling citizens to report active landslides and infrastructural damage in real time.
* Automated Telemetry Ingestion: The system autonomously fetches live weather, soil moisture, temperature, and humidity data from the Open-Meteo Global API.
* Fully Automated Pipeline: A GitOps based orchestration engine triggers hourly updates, runs ML inference, builds the latest data into the frontend, and deploys it automatically.
* High Availability Fallback: If the machine learning backend experiences downtime, the system gracefully degrades to a deterministic mathematical model (Sigmoid Risk Formula) to guarantee uninterrupted warnings.

## Interactive Dashboard

The frontend application serves as the primary visual interface for decision makers and emergency responders. Built using React and Leaflet, it transforms complex predictive data into actionable intelligence.

* Interactive Threat Mapping: Utilizes Leaflet to render high resolution maps overlaying the localized grid cells of Sikkim.
* Risk Heatmaps: Dynamically generates visual heatmaps that instantly highlight high probability landslide clusters, allowing for rapid geographical assessment.
* Contextual Tooltips and Panels: Clicking on any grid cell reveals the specific meteorological and topographical factors (such as 3 day rainfall accumulation, slope angle, and fault line proximity) affecting that exact location.
* Localized State Management: The application runs entirely from a pre calculated JSON state, meaning load times are instantaneous and the dashboard can handle high traffic during critical emergency events without straining a live database.

## Architecture and Tech Stack

The architecture is split into three core pillars:

1. Frontend Visualization: Built with React, Vite, and React Leaflet. 
2. Backend API: A Flask based Python server hosting a trained scikit-learn RandomForestClassifier.
3. Automation Engine: A serverless cloud worker executed via GitHub Actions that bridges real time data with the ML model.

## Frontend Setup and Local Development

Navigate to the frontend directory to run the dashboard locally:

```bash
cd FRONTEND
npm install
npm run dev
```

The application will be accessible at http://localhost:5173.

## Backend Setup and Local Development

The backend serves the trained machine learning model for real time landslide risk prediction.

### Prerequisites
* Python 3.11 or higher
* Node.js v20 (for the frontend)

### Running the Backend

Navigate to the backend directory and start the Flask server:

```bash
cd BACKEND
pip install -r requirements.txt
python app.py
```

The server will start on http://localhost:5000. 

Note: This backend must be running before executing the local 12 hourly cloud updater script, which calls the `/predict/batch` endpoint to score all grid cells. If the backend is not running, the updater will fall back to the legacy sigmoid formula and log a warning.

## Machine Learning Model Details

* File: `sikkim_landslide_model.joblib`
* Algorithm: scikit-learn `RandomForestClassifier`
* Input Features (6): `rainfall_mm`, `soil_moisture`, `slope_degree`, `elevation_m`, `temperature_c`, `humidity`
* Output: Binary probability where class 1 indicates landslide susceptibility.

## API Endpoints

### GET /health
Returns the health status of the API and verifies if the model is loaded in memory.
Response format: `{"status": "ok", "model_loaded": true}`

### POST /predict
Scores a single grid cell based on provided telemetry.

Request Body:
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

Response Body:
```json
{
  "risk_probability": 0.7234,
  "risk_percentage": 72.34,
  "risk_level": "SEVERE",
  "inputs_used": { }
}
```

### POST /predict/batch
Batch prediction optimized for scoring the entire state grid simultaneously. It accepts a JSON array of feature dictionaries and returns predictions in the exact corresponding order, including calculated SHAP values for explainability.

Request Body:
```json
[
  {"rainfall_mm": 80, "soil_moisture": 60, "slope_degree": 30, "elevation_m": 2000, "temperature_c": 15, "humidity": 75},
  {"rainfall_mm": 10, "soil_moisture": 30, "slope_degree": 5, "elevation_m": 4000, "temperature_c": 8, "humidity": 50}
]
```

Response Body:
```json
[
  {"risk_probability": 0.7234, "risk_percentage": 72.34, "risk_level": "SEVERE", "shap_values": {}},
  {"risk_probability": 0.0812, "risk_percentage": 8.12, "risk_level": "LOW", "shap_values": {}}
]
```

## Automated Pipeline (Hourly Radar)

The `hourly_landslide_radar.yml` GitHub Action orchestrates the entire system:
1. It triggers every hour at the 30 minute mark (UTC).
2. It executes `12_hourly_cloud_updater.py` to fetch fresh telemetry and hit the `/predict/batch` endpoint.
3. It updates `realRiskData.json` with the new predictions and SHAP factors.
4. It builds the Vite frontend and commits the fresh data back to the repository, keeping the live site strictly up to date.
