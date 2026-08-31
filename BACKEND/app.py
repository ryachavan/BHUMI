import os

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import shap

app = Flask(__name__)
CORS(app)  # allows your website's frontend (different origin) to call this API

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sikkim_landslide_model.joblib")
model = joblib.load(MODEL_PATH)
explainer = shap.TreeExplainer(model)

FEATURES = ["rainfall_mm", "soil_moisture", "slope_degree",
            "elevation_m", "temperature_c", "humidity"]


def risk_level_from_probability(p):
    if p >= 0.7:
        return "SEVERE"
    elif p >= 0.4:
        return "HIGH"
    elif p >= 0.15:
        return "MODERATE"
    else:
        return "LOW"


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        missing = [f for f in FEATURES if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        X = pd.DataFrame([{f: float(data[f]) for f in FEATURES}])
        probability = float(model.predict_proba(X)[0][1])

        return jsonify({
            "risk_probability": round(probability, 4),
            "risk_percentage": round(probability * 100, 2),
            "risk_level": risk_level_from_probability(probability),
            "inputs_used": data,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """Batch prediction endpoint: accepts a JSON list of feature dicts,
    returns a list of predictions in the same order.

    Request body:  [{"rainfall_mm": ..., "soil_moisture": ..., ...}, ...]
    Response body: [{"risk_probability": ..., "risk_percentage": ..., "risk_level": ...}, ...]
    """
    try:
        data_list = request.get_json()

        if not isinstance(data_list, list) or len(data_list) == 0:
            return jsonify({"error": "Request body must be a non-empty JSON array"}), 400

        # Validate all rows upfront
        for i, row in enumerate(data_list):
            missing = [f for f in FEATURES if f not in row]
            if missing:
                return jsonify({"error": f"Row {i}: missing fields {missing}"}), 400

        # Build a single DataFrame for vectorized inference
        X = pd.DataFrame([{f: float(row[f]) for f in FEATURES} for row in data_list])
        probabilities = model.predict_proba(X)[:, 1]
        
        # Calculate SHAP values for the batch
        # For RandomForest, shap_values returns an array of shape (n_samples, n_features, 2)
        sv = explainer.shap_values(X)
        shap_class1 = sv[:, :, 1]

        results = []
        for i, prob in enumerate(probabilities):
            p = float(prob)
            
            # Map SHAP values to features for this row
            row_shap = shap_class1[i]
            shap_dict = {FEATURES[j]: float(row_shap[j]) for j in range(len(FEATURES))}
            
            results.append({
                "risk_probability": round(p, 4),
                "risk_percentage": round(p * 100, 2),
                "risk_level": risk_level_from_probability(p),
                "shap_values": shap_dict
            })

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
