# BHUMI — Boundary Hazard & Unstable terrain Monitoring Intelligence

AI-Based Landslide Early Warning & Risk Monitoring System for Sikkim, India.

## Overview

BHUMI is a comprehensive geo-spatial risk intelligence and multi-agency response platform that provides real-time landslide early warning, ML-powered risk prediction, and coordinated disaster management for the Sikkim corridor in Northeast India.

## Architecture

- **FRONTEND/** — React + Vite dashboard with Leaflet maps, citizen reporting, official command desk, and scientific telemetry studio
- **BACKEND/** — Flask API serving a trained RandomForest ML model for real-time landslide risk inference with SHAP explainability

## Quick Start

```bash
# Install frontend dependencies
cd FRONTEND
npm install

# Start the development server
npm run dev
```

```bash
# Start the ML backend
cd BACKEND
pip install -r requirements.txt
python app.py
```

## License

ISC
