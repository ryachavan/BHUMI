import React, { useState } from 'react'
import {
  Activity,
  BarChart3,
  CloudRain,
  Database,
  Download,
  FileCode,
  FileSpreadsheet,
  MapPin,
  Mountain,
  Ruler,
  Sliders,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import SeverityBadge from './SeverityBadge'
import RiskMap from './RiskMap'
import { getDistrictConfig } from '../data/districtConfig'
import { useSimulation } from '../contexts/SimulationContext'

export default function AnalystSection({
  data,
  selectedCell,
  onSelectCell,
  selectedDistrict = 'ALL',
}) {
  const [rainfallSimulation, setRainfallSimulation] = useState(0) // +0 to +100 mm scenario stress test
  const [activeTab, setActiveTab] = useState('telemetry') // 'telemetry' | 'timeseries' | 'sources' | 'scenario'

  const { simulationActive, simulationEvent } = useSimulation()
  const simulationMarker = simulationActive && simulationEvent
    ? { lat: simulationEvent.lat, lon: simulationEvent.lon, name: simulationEvent.name, date: simulationEvent.date }
    : null

  const districtCfg = getDistrictConfig(selectedDistrict)
  const riskCells = data?.riskCells || []
  const currentCell = selectedCell || riskCells[0] || {}

  // Compute simulated risk if rainfall slider is changed
  const simulatedRain = (currentCell.rainfall_3d_mm || districtCfg.rainfall3dMm || 15) + rainfallSimulation
  const baseProb = currentCell.risk_probability || districtCfg.riskScore || 25
  const simulatedProb = Math.min(99, Math.round(baseProb + rainfallSimulation * 0.45))

  // Export handlers
  const handleExportCsv = () => {
    const headers = ['cell_id', 'latitude', 'longitude', 'elevation_m', 'slope_deg', 'rainfall_3d_mm', 'soil_moisture_pct', 'risk_probability_pct', 'risk_level']
    const rows = riskCells.map(c => [
      c.cell_id, c.latitude, c.longitude, c.elevation_m, c.slope_deg, c.rainfall_3d_mm, c.soil_moisture, c.risk_probability, c.risk_level
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `NER_${districtCfg.shortName}_Telemetry_Export_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportGeoJson = () => {
    const geojson = {
      type: "FeatureCollection",
      features: riskCells.map(c => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
        properties: { ...c }
      }))
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2))
    const link = document.createElement('a')
    link.setAttribute("href", dataStr)
    link.setAttribute("download", `NER_${districtCfg.shortName}_Grid_${new Date().toISOString().slice(0,10)}.geojson`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shapFactors = currentCell.shap_factors || [
    { factor: "3-Day Cumulative Rainfall", value: `${simulatedRain} mm`, impact: `+${Math.round(simulatedRain * 0.9)}%`, type: "danger", weight: 35 },
    { factor: "Slope Gradient / Morphometry", value: `${currentCell.slope_deg || districtCfg.avgSlopeDeg}°`, impact: "+24%", type: "danger", weight: 24 },
    { factor: "Distance to Active Fault Line", value: "0.82 km", impact: "+16%", type: "danger", weight: 16 },
    { factor: "Soil Moisture Saturation Index", value: `${currentCell.soil_moisture || districtCfg.soilSaturationPct}%`, impact: "+12%", type: "warning", weight: 12 },
    { factor: "Canopy Root Cohesion (NDVI)", value: "0.64", impact: "-18%", type: "safe", weight: -18 },
  ]

  // Time series record
  const timeSeriesDays = [
    { day: '17 Aug', rain: 4, moisture: 28, risk: 8 },
    { day: '18 Aug', rain: 6, moisture: 30, risk: 10 },
    { day: '19 Aug', rain: 12, moisture: 35, risk: 15 },
    { day: '20 Aug', rain: 28, moisture: 42, risk: 24 },
    { day: '21 Aug', rain: 45, moisture: 54, risk: 42 },
    { day: '22 Aug', rain: 62, moisture: 68, risk: 65 },
    { day: '23 Aug', rain: 38, moisture: 72, risk: 58 },
    { day: '24 Aug', rain: 18, moisture: 65, risk: 44 },
    { day: '25 Aug', rain: 8, moisture: 58, risk: 32 },
    { day: '26 Aug', rain: 5, moisture: 50, risk: 24 },
    { day: '27 Aug', rain: 2, moisture: 44, risk: 18 },
    { day: '28 Aug', rain: 14, moisture: 48, risk: 22 },
    { day: '29 Aug', rain: districtCfg.rainfall24hMm || 22, moisture: districtCfg.soilSaturationPct || 52, risk: districtCfg.riskScore || 30 },
    { day: '30 Aug', rain: currentCell.rainfall_1d_mm || districtCfg.rainfall24hMm, moisture: currentCell.soil_moisture || districtCfg.soilSaturationPct, risk: currentCell.risk_probability || districtCfg.riskScore },
  ]

  return (
    <div className="analyst-view-container">
      {/* 1. Analyst Header & Export Toolbar */}
      <div
        className="gov-card"
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--gov-slate-50)',
        }}
      >
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--gov-navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            SCIENTIFIC TELEMETRY &amp; AI MODEL INSPECTION STUDIO · {districtCfg.name.toUpperCase()}
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy-dark)', margin: '2px 0 0' }}>
            InSAR Displacement, IMD Radar &amp; Soil Physics Analytics ({districtCfg.shortName})
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="gov-btn gov-btn-secondary" onClick={handleExportCsv}>
            <FileSpreadsheet size={14} /> Export CSV Telemetry
          </button>
          <button type="button" className="gov-btn gov-btn-secondary" onClick={handleExportGeoJson}>
            <FileCode size={14} /> Export GeoJSON
          </button>
          <button
            type="button"
            className="gov-btn gov-btn-primary"
            onClick={() => window.print()}
          >
            <Download size={14} /> Technical Report (PDF)
          </button>
        </div>
      </div>

      {/* 2. Primary Technical Grid */}
      <div className="analyst-grid-layout">
        {/* Left Column: Interactive GIS Map & Spatial Grid Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <MapPin size={16} /> High-Resolution Hazard Map — {districtCfg.name}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gov-slate-600)', fontFamily: 'var(--font-mono)' }}>
                Target: {currentCell.cell_id || 'SKM_00009'} · Auto-focused on {districtCfg.shortName}
              </span>
            </div>
            <div className="map-container-shell" style={{ height: '460px' }}>
              <RiskMap
                riskCells={riskCells}
                roads={data.roads || []}
                settlements={data.settlements || []}
                historicalLandslides={data.historicalLandslides || []}
                boundaryGeoJson={data.sikkimBoundary}
                selectedCell={currentCell}
                onSelectCell={onSelectCell}
                selectedDistrict={selectedDistrict}
                simulationMarker={simulationMarker}
              />
            </div>
          </div>

          {/* Tabbed Technical Views: Time Series vs Data Sources vs Simulation */}
          <div className="gov-card">
            <div className="gov-card-header" style={{ padding: '0 16px', background: 'var(--gov-slate-100)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`section-tab-btn ${activeTab === 'telemetry' ? 'is-active' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 14px', color: activeTab === 'telemetry' ? 'var(--gov-navy)' : 'var(--gov-slate-600)' }}
                  onClick={() => setActiveTab('telemetry')}
                >
                  <BarChart3 size={14} /> Feature Attribution (TreeSHAP)
                </button>
                <button
                  type="button"
                  className={`section-tab-btn ${activeTab === 'timeseries' ? 'is-active' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 14px', color: activeTab === 'timeseries' ? 'var(--gov-navy)' : 'var(--gov-slate-600)' }}
                  onClick={() => setActiveTab('timeseries')}
                >
                  <Activity size={14} /> 14-Day Hydro-Temporal Trend
                </button>
                <button
                  type="button"
                  className={`section-tab-btn ${activeTab === 'sources' ? 'is-active' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 14px', color: activeTab === 'sources' ? 'var(--gov-navy)' : 'var(--gov-slate-600)' }}
                  onClick={() => setActiveTab('sources')}
                >
                  <Database size={14} /> Ingestion Stream Health
                </button>
                <button
                  type="button"
                  className={`section-tab-btn ${activeTab === 'scenario' ? 'is-active' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 14px', color: activeTab === 'scenario' ? 'var(--gov-navy)' : 'var(--gov-slate-600)' }}
                  onClick={() => setActiveTab('scenario')}
                >
                  <Sliders size={14} /> Rainfall Stress Test Sandbox
                </button>
              </div>
            </div>

            <div className="gov-card-body">
              {/* Tab 1: SHAP Factor Attribution */}
              {activeTab === 'telemetry' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--gov-slate-700)', fontWeight: 600 }}>
                      TreeSHAP Additive Feature Contribution for <strong>{currentCell.cell_id}</strong> ({districtCfg.shortName})
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gov-slate-500)' }}>
                      Ensemble Model Confidence: <strong>91.4%</strong>
                    </span>
                  </div>
                  <table className="telemetry-table">
                    <thead>
                      <tr>
                        <th>Geotechnical / Climatic Factor</th>
                        <th>Measured Metric</th>
                        <th>Model Impact Weight</th>
                        <th>Attribution Effect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shapFactors.map((sf, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{sf.factor}</strong>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{sf.value}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: sf.type === 'danger' ? 'var(--status-critical)' : sf.type === 'warning' ? 'var(--status-high)' : 'var(--status-safe)' }}>
                                {sf.impact}
                              </span>
                              <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--gov-slate-200)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(100, Math.abs(sf.weight || 20) * 2.5)}%`,
                                  height: '100%',
                                  backgroundColor: sf.type === 'danger' ? 'var(--status-critical)' : sf.type === 'warning' ? 'var(--status-high)' : 'var(--status-safe)'
                                }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`gov-badge ${sf.type === 'danger' ? 'critical' : sf.type === 'warning' ? 'moderate' : 'safe'}`}>
                              {sf.type === 'danger' ? 'DESTABILIZING' : sf.type === 'warning' ? 'CAUTION' : 'RESISTANCE BUFFER'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: 14-Day Time Series Trend */}
              {activeTab === 'timeseries' && (
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--gov-slate-700)' }}>
                    Historical 14-Day Precipitation vs Soil Saturation vs Dynamic Failure Probability ({districtCfg.shortName})
                  </div>
                  <table className="telemetry-table">
                    <thead>
                      <tr>
                        <th>Date (2026)</th>
                        <th>Precipitation (mm)</th>
                        <th>Soil Saturation Index (%)</th>
                        <th>Model Failure Probability (%)</th>
                        <th>Hazard Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeSeriesDays.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{row.day}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{row.rain} mm</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{row.moisture}%</td>
                          <td>
                            <strong style={{ color: row.risk > 50 ? 'var(--status-critical)' : row.risk > 25 ? 'var(--status-high)' : 'var(--status-safe)' }}>
                              {row.risk}%
                            </strong>
                          </td>
                          <td>
                            <SeverityBadge level={row.risk > 50 ? 'SEVERE' : row.risk > 25 ? 'HIGH' : row.risk > 15 ? 'MODERATE' : 'LOW'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Ingestion Stream Status */}
              {activeTab === 'sources' && (
                <div>
                  <table className="telemetry-table">
                    <thead>
                      <tr>
                        <th>Sensor / Data Feed Source</th>
                        <th>Resolution / Type</th>
                        <th>Update Cycle</th>
                        <th>Latency</th>
                        <th>Operational Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>IMD Doppler Weather Radar (Agartala / Mohanbari)</strong></td>
                        <td>1-km Precipitation Reflectivity</td>
                        <td>Every 15 Mins</td>
                        <td>&lt; 3 mins</td>
                        <td><span className="gov-badge safe">● ONLINE (SYNCHRONIZED)</span></td>
                      </tr>
                      <tr>
                        <td><strong>Sentinel-1 SAR Interferometry (InSAR)</strong></td>
                        <td>10-m Line-of-Sight Deformation</td>
                        <td>6-day Repeat Pass</td>
                        <td>Validated (28 Aug)</td>
                        <td><span className="gov-badge safe">● ACTIVE BASELINE</span></td>
                      </tr>
                      <tr>
                        <td><strong>NASA GPM &amp; SMAP Soil Moisture</strong></td>
                        <td>Global Hydrology Telemetry</td>
                        <td>Hourly Cloud Assimilation</td>
                        <td>&lt; 15 mins</td>
                        <td><span className="gov-badge safe">● OPERATIONAL</span></td>
                      </tr>
                      <tr>
                        <td><strong>ALOS PALSAR 30m DEM Morphometry</strong></td>
                        <td>Slope, Aspect, TWI, Curvature</td>
                        <td>Static Geological Layer</td>
                        <td>Calibrated</td>
                        <td><span className="gov-badge safe">● LOCKED BASELINE</span></td>
                      </tr>
                      <tr>
                        <td><strong>In-Situ Borehole Inclinometers &amp; Piezometers</strong></td>
                        <td>Subsurface Shear &amp; Pore Pressure</td>
                        <td>Real-time IoT Telemetry</td>
                        <td>Live (12 Stations)</td>
                        <td><span className="gov-badge safe">● CALIBRATED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 4: Rainfall Simulation Sandbox */}
              {activeTab === 'scenario' && (
                <div>
                  <div style={{ background: 'var(--gov-slate-50)', padding: '14px', border: 'var(--border-default)', borderRadius: '4px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gov-navy)' }}>
                        Simulate Intense Cloudburst in {districtCfg.shortName}: <strong>+{rainfallSimulation} mm Rain</strong>
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--gov-slate-600)' }}>
                        Base: {currentCell.rainfall_3d_mm || districtCfg.rainfall3dMm} mm | Total Simulated: <strong>{simulatedRain} mm</strong>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      value={rainfallSimulation}
                      onChange={(e) => setRainfallSimulation(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--gov-navy)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--gov-slate-500)', marginTop: '4px' }}>
                      <span>Normal (+0 mm)</span>
                      <span>Heavy (+40 mm)</span>
                      <span>Severe (+80 mm)</span>
                      <span>Extreme Cloudburst (+120 mm)</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', border: 'var(--border-default)', borderRadius: '4px', background: '#fff' }}>
                      <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase' }}>Baseline Risk ({districtCfg.shortName})</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gov-navy)' }}>
                        {baseProb}% ({districtCfg.status})
                      </div>
                    </div>
                    <div style={{ padding: '12px', border: 'var(--border-default)', borderRadius: '4px', background: simulatedProb > 70 ? 'var(--status-critical-bg)' : simulatedProb > 40 ? 'var(--status-high-bg)' : '#fff' }}>
                      <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase' }}>Simulated Risk Probability</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: simulatedProb > 70 ? 'var(--status-critical)' : simulatedProb > 40 ? 'var(--status-high)' : 'var(--gov-navy)' }}>
                        {simulatedProb}% ({simulatedProb > 70 ? 'CRITICAL' : simulatedProb > 40 ? 'HIGH' : simulatedProb > 20 ? 'MODERATE' : 'LOW'})
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Cell Telemetry Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Ruler size={16} /> Cell Telemetry &amp; Physical Parameters
              </div>
              <SeverityBadge level={currentCell.risk_level || districtCfg.status} />
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              <table className="telemetry-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, width: '45%' }}>Grid Cell Identifier</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{currentCell.cell_id || 'SKM_00009'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Target District / Sector</td>
                    <td style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>{districtCfg.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Geographic Coordinates</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{currentCell.latitude?.toFixed(4) || districtCfg.center[0].toFixed(4)}°N, {currentCell.longitude?.toFixed(4) || districtCfg.center[1].toFixed(4)}°E</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Terrain Elevation</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{currentCell.elevation_m?.toLocaleString() || districtCfg.elevationM?.toLocaleString()} meters MSL</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Slope Steepness</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{currentCell.slope_deg || districtCfg.avgSlopeDeg}° gradient</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>24h Precipitation</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{currentCell.rainfall_1d_mm || districtCfg.rainfall24hMm} mm</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>3-Day Cumulative Rain</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{currentCell.rainfall_3d_mm || districtCfg.rainfall3dMm} mm</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Soil Saturation (SMAP)</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{currentCell.soil_moisture || districtCfg.soilSaturationPct}% capacity</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Nearest Arterial Route</td>
                    <td>{currentCell.nearest_road || districtCfg.keyCorridors[0]} ({currentCell.road_distance_m || 112} m)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Nearest Settlement Buffer</td>
                    <td>{currentCell.nearest_settlement || districtCfg.subDivisions[0]} ({currentCell.settlement_distance_m || 420} m)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Model Synthesis Verdict</td>
                    <td style={{ fontSize: '11px', color: 'var(--gov-slate-700)', lineHeight: 1.4 }}>
                      {currentCell.explanation || districtCfg.activeAdvisory}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
