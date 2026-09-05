#!/usr/bin/env python3
"""
cloud_updater.py
Automated Serverless Cloud ML Inference Worker for Landslide Early Warning.
Fully integrated with config.json and real SHAP explanations from the backend.
"""

import os
import sys
import json
import time
import argparse
import urllib.request
from datetime import datetime, timezone
import numpy as np

# Load centralized configuration
script_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(script_dir, "config.json")
try:
    with open(config_path, "r") as f:
        CONFIG = json.load(f)
except Exception as e:
    print(f"Error loading config.json: {e}")
    sys.exit(1)

def fetch_realtime_sikkim_telemetry():
    """Fetches real-time live satellite weather, soil moisture, temperature & humidity."""
    print("[LIVE] Ingesting LIVE real-time satellite telemetry from Open-Meteo Global API...")
    coords = CONFIG["telemetry_coords"]
    
    precip_list = []
    sm_list = []
    temp_list = []
    humidity_list = []
    
    for c in coords:
        try:
            url = (f"https://api.open-meteo.com/v1/forecast?latitude={c['lat']}&longitude={c['lon']}"
                   f"&current=precipitation,temperature_2m,relative_humidity_2m"
                   f"&hourly=precipitation,soil_moisture_0_to_7cm"
                   f"&timezone=Asia%2FKolkata")
            req = urllib.request.Request(url, headers={'User-Agent': 'SikkimLandslideEarlyWarning/1.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                d = json.loads(resp.read().decode())
                current_p = float(d.get('current', {}).get('precipitation', 0.0))
                # 24h accumulated forecast rain
                hourly_p = d.get('hourly', {}).get('precipitation', [0.0]*24)[:24]
                tot_24h = sum(float(x) for x in hourly_p)
                # Soil moisture saturation percentage
                sm_val = float(d.get('hourly', {}).get('soil_moisture_0_to_7cm', [0.35])[0]) * 100.0
                # Temperature (°C) and relative humidity (%)
                temp_val = float(d.get('current', {}).get('temperature_2m', 18.0))
                hum_val = float(d.get('current', {}).get('relative_humidity_2m', 70.0))
                
                precip_list.append(max(current_p * 24.0, tot_24h))
                sm_list.append(sm_val)
                temp_list.append(temp_val)
                humidity_list.append(hum_val)
                print(f"  • {c['district']:15s} | 24h Rain: {tot_24h:.1f} mm | Soil: {sm_val:.1f}% | Temp: {temp_val:.1f}°C | Hum: {hum_val:.0f}%")
        except Exception as e:
            print(f"  Warning fetching {c['district']}: {e}")
            precip_list.append(5.0)
            sm_list.append(45.0)
            temp_list.append(18.0)
            humidity_list.append(70.0)
            
    mean_24h = float(np.mean(precip_list)) if precip_list else 5.0
    mean_sm = float(np.mean(sm_list)) if sm_list else 45.0
    mean_temp = float(np.mean(temp_list)) if temp_list else 18.0
    mean_humidity = float(np.mean(humidity_list)) if humidity_list else 70.0
    print(f"[OK] Real-time Sikkim averages: 24h Rain = {mean_24h:.1f} mm, Soil Moisture = {mean_sm:.1f}%, Temp = {mean_temp:.1f}°C, Humidity = {mean_humidity:.0f}%\n")
    return mean_24h, mean_sm, mean_temp, mean_humidity


def _compute_sigmoid_fallback(slope, elev, fault_dist, r3d, r1d, sm):
    """Legacy sigmoid risk formula (F18) — used as fallback when ML backend is unreachable."""
    static_fragility = min(0.95, (slope / 45.0) * 0.65 + (5.0 / (fault_dist + 1.0)) * 0.35)
    rain_factor = (r3d / 120.0) * 0.55 + (r1d / 80.0) * 0.30 + (sm / 100.0) * 0.15
    p_dyn = static_fragility * (1.0 / (1.0 + np.exp(-4.5 * (rain_factor - 0.35))))
    p_dyn = max(0.01, min(0.99, p_dyn))
    prob_pct = int(round(p_dyn * 100))
    if p_dyn >= 0.75:
        sev_level = "SEVERE"
    elif p_dyn >= 0.50:
        sev_level = "HIGH"
    elif p_dyn >= 0.20:
        sev_level = "MODERATE"
    else:
        sev_level = "LOW"
    return prob_pct, sev_level


def _call_ml_backend_batch(feature_rows):
    """POST all grid-cell features to the ML backend's /predict/batch endpoint.
    Returns a list of dicts (risk_percentage, risk_level, shap_values), or None on failure."""
    try:
        payload = json.dumps(feature_rows).encode('utf-8')
        req = urllib.request.Request(
            f"{CONFIG['backend_url']}/predict/batch",
            data=payload,
            headers={'Content-Type': 'application/json', 'User-Agent': 'SikkimLEWS-Updater/1.0'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            results = json.loads(resp.read().decode())
        return results
    except Exception as e:
        print(f"[WARNING] ML backend batch call failed: {e}")
        print(f"   Falling back to legacy sigmoid formula for all cells.")
        return None

def run_hourly_update(mode="live"):
    start_time = time.time()
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p IST")
    print(f"=== [LEWS CLOUD WORKER] Starting Automated Hourly Run at {now_str} (Mode: {mode.upper()}) ===")
    
    repo_root = os.path.abspath(os.path.join(script_dir, ".."))
    target_dir = os.path.join(script_dir, CONFIG["output_dir"])
    os.makedirs(target_dir, exist_ok=True)
    
    source_json = os.path.join(target_dir, "realRiskData.json")
    if not os.path.exists(source_json):
        print(f"Error: {source_json} not found.")
        return False
        
    with open(source_json, "r") as f:
        master_data = json.load(f)
        
    risk_cells = master_data.get("riskCells", [])
    print(f"Loaded {len(risk_cells)} pre-cached grid cells from spatial cache.")
    
    # 1. Telemetry Ingestion based on Mode
    if mode == "live":
        live_24h, live_sm, live_temp, live_humidity = fetch_realtime_sikkim_telemetry()
        # Scale factor based on live rain (relative to severe threshold of 100mm)
        rain_scale = max(0.08, min(1.2, live_24h / 80.0))
        mean_sm = live_sm
        mean_temp = live_temp
        mean_humidity = live_humidity
        telemetry_source = CONFIG["simulation_modes"]["live"]["telemetry_source"]
    else:
        sim_conf = CONFIG["simulation_modes"].get(mode, CONFIG["simulation_modes"]["dry"])
        rain_scale = sim_conf["rain_scale"]
        mean_sm = sim_conf["mean_sm"]
        mean_temp = sim_conf["mean_temp"]
        mean_humidity = sim_conf["mean_humidity"]
        telemetry_source = sim_conf["telemetry_source"]
        
    print(f"Effective Ingestion Scale: {rain_scale:.2f} ({telemetry_source})")
    
    # 2. ML Model Inference via backend API (with sigmoid fallback)
    infer_start = time.time()
    updated_cells = []
    
    # Pre-compute per-cell derived weather values and ML feature vectors
    cell_weather = []
    ml_feature_rows = []
    
    for cell in risk_cells:
        slope = float(cell.get("slope_deg", 25))
        elev = float(cell.get("elevation_m", 1500))
        fault_dist = 0.8 if "NH-10" in cell.get("nearest_road", "") else 4.5
        
        base_r3d = 160.0 if slope > 30 else 60.0
        r3d = base_r3d * rain_scale
        r1d = r3d * 0.65
        sm = min(95.0, mean_sm * (0.8 + 0.4 * (slope / 45.0)))
        
        # Per-cell temperature: elevation-based lapse rate (~6.5°C/km from reference at 1500m)
        temp_c = mean_temp - (elev - 1500.0) * 0.0065
        # Per-cell humidity: slight increase with slope (more moisture trapping on steeper terrain)
        humidity = min(100.0, mean_humidity * (0.9 + 0.2 * (slope / 45.0)))
        
        cell_weather.append((r3d, r1d, sm, temp_c, humidity, slope, elev, fault_dist))
        ml_feature_rows.append({
            "rainfall_mm": round(r3d, 2),
            "soil_moisture": round(sm, 2),
            "slope_degree": round(slope, 2),
            "elevation_m": round(elev, 2),
            "temperature_c": round(temp_c, 2),
            "humidity": round(humidity, 2)
        })
    
    # Attempt batch prediction via ML backend
    ml_predictions = _call_ml_backend_batch(ml_feature_rows)
    using_model = ml_predictions is not None
    risk_source = "model" if using_model else "fallback_sigmoid"
    
    if using_model:
        print(f"[OK] ML backend returned {len(ml_predictions)} predictions successfully.")
    else:
        print(f"[WARNING] Using fallback sigmoid formula for all {len(risk_cells)} cells.")
    
    for i, cell in enumerate(risk_cells):
        r3d, r1d, sm, temp_c, humidity, slope, elev, fault_dist = cell_weather[i]
        
        factors = []
        if using_model:
            prob_pct = int(round(ml_predictions[i]['risk_percentage']))
            sev_level = ml_predictions[i]['risk_level']
            shap_dict = ml_predictions[i].get('shap_values', {})
            
            # Map real SHAP values to the factor format expected by the frontend
            # We map positive SHAP (increases risk) to 'danger' or 'warning', negative to 'safe'
            for feature_key, shap_val in shap_dict.items():
                label = CONFIG["shap_labels"].get(feature_key, feature_key)
                # the model uses 'shap_val' in log-odds scale, convert to rough impact percentage for display
                # Note: This is an approximation for UI display purposes
                impact_pct = int(shap_val * 20) 
                
                ftype = "safe"
                if impact_pct > 15:
                    ftype = "danger"
                elif impact_pct > 0:
                    ftype = "warning"
                    
                sign = "+" if impact_pct > 0 else ""
                
                factors.append({
                    "factor": label,
                    "value": str(ml_feature_rows[i][feature_key]), # Actual value
                    "impact": f"{sign}{impact_pct}%",
                    "type": ftype,
                    "weight": impact_pct
                })
        else:
            prob_pct, sev_level = _compute_sigmoid_fallback(slope, elev, fault_dist, r3d, r1d, sm)
            
            # Old fallback SHAP generation if model is down
            if r3d >= 70:
                factors.append({"factor": "3-Day Rainfall Surge", "value": f"{r3d:.0f} mm", "impact": "+36%", "type": "danger", "weight": 36})
            elif r3d >= 35:
                factors.append({"factor": "Moderate Rain Intensity", "value": f"{r3d:.0f} mm", "impact": "+16%", "type": "warning", "weight": 16})
            else:
                factors.append({"factor": "Low Rainfall Total", "value": f"{r3d:.0f} mm", "impact": "-22%", "type": "safe", "weight": -22})
                
            if slope >= 30:
                factors.append({"factor": "Steep Slope Angle", "value": f"{slope:.0f}°", "impact": "+24%", "type": "danger", "weight": 24})
            else:
                factors.append({"factor": "Low Relief Slope", "value": f"{slope:.0f}°", "impact": "-25%", "type": "safe", "weight": -25})
                
            if fault_dist <= 2.0:
                factors.append({"factor": "Active Fault Line", "value": f"{fault_dist:.1f} km", "impact": "+18%", "type": "danger", "weight": 18})
            else:
                factors.append({"factor": "Stable Bedrock Buffer", "value": f"{fault_dist:.1f} km", "impact": "-12%", "type": "safe", "weight": -12})
                
            factors.append({"factor": "Canopy Root Mesh", "value": "NDVI 0.65", "impact": "-14%", "type": "safe", "weight": -14})
        
        # Sort factors by absolute weight/impact and take top 4
        factors.sort(key=lambda x: abs(x['weight']), reverse=True)
        factors = factors[:4]
        
        top_danger = [f['factor'] for f in factors if f['type'] == 'danger']
        top_safe = [f['factor'] for f in factors if f['type'] == 'safe']
        
        # Dynamic explanation based on real factors
        if sev_level in ['SEVERE', 'HIGH']:
            drivers = ", ".join(top_danger[:2]) if top_danger else "combinations of features"
            exp = f"High Threat ({prob_pct}%): Driven primarily by {drivers}."
        elif sev_level == 'MODERATE':
            exp = f"Moderate Watch ({prob_pct}%): Elevated conditions, but buffered by {top_safe[0] if top_safe else 'stable ground'}."
        else:
            exp = f"Low / Safe ({prob_pct}%): Low risk conditions, buffered by {top_safe[0] if top_safe else 'terrain'}."
            
        cell_copy = dict(cell)
        cell_copy["risk_probability"] = prob_pct
        cell_copy["risk_level"] = sev_level
        cell_copy["risk_source"] = risk_source
        cell_copy["rainfall_1d_mm"] = int(round(r1d))
        cell_copy["rainfall_3d_mm"] = int(round(r3d))
        cell_copy["soil_moisture"] = int(round(sm))
        cell_copy["explanation"] = exp
        cell_copy["shap_factors"] = factors
        updated_cells.append(cell_copy)
        
    infer_duration = (time.time() - infer_start) * 1000.0
    print(f"ML Inference ({risk_source}) finished in {infer_duration:.2f} ms.")
    
    # 3. Update Meta & Output Files
    master_data["riskCells"] = updated_cells
    master_data["meta"]["last_updated"] = f"{now_str} ({telemetry_source})"
    master_data["meta"]["summary"] = {
        "weather_trigger": f"Satellite Rain ({int(140*rain_scale)} mm 3d) & SMAP Saturation ({int(mean_sm)}%)"
    }
    
    master_data["weather"]["rainfall_1d_mm"] = int(round(90 * rain_scale))
    master_data["weather"]["rainfall_3d_mm"] = int(round(140 * rain_scale))
    master_data["weather"]["soil_moisture_percent"] = int(round(mean_sm))
    master_data["weather"]["next_24h_risk"] = "SEVERE" if rain_scale > 0.7 else "HIGH" if rain_scale > 0.4 else "LOW"
    
    with open(source_json, "w") as f:
        json.dump(master_data, f, indent=2)
        
    # Generate mockRiskData.js dynamically from config
    out_js = os.path.join(script_dir, CONFIG["mock_js_path"])
    with open(out_js, "w") as f:
        f.write("import realRiskData from './realRiskData.json'\n\n")
        f.write("export const severityConfig = {\n")
        for sev, c in CONFIG["severity_colors"].items():
            f.write(f"  {sev}: {{ color: '{c['color']}', fill: '{c['fill']}', label: '{c['label']}' }},\n")
        f.write("}\n\n")
        f.write("export const mockDashboardData = realRiskData\n")
        f.write("export default mockDashboardData\n")
        
    total_elapsed = time.time() - start_time
    print(f"=== [LEWS CLOUD WORKER] Completed in {total_elapsed:.2f}s ===\n")
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Hourly Cloud ML Updater")
    parser.add_argument("--mode", default="live", choices=["live", "storm", "dry"], help="Telemetry mode")
    args = parser.parse_args()
    
    run_hourly_update(mode=args.mode)
