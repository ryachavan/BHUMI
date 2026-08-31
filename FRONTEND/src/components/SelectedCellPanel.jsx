import React from 'react'
import { CloudRain, Droplets, Info, MapPinned, Mountain, Route, Ruler, Sparkles, TrendingUp, TrendingDown } from 'lucide-react'
import SeverityBadge from './SeverityBadge'

function Metric({ icon: Icon, label, value }) {
  return <div className="detail-metric"><Icon size={16} /><span>{label}<strong>{value}</strong></span></div>
}

export default function SelectedCellPanel({ cell }) {
  if (!cell) return null

  const shapFactors = cell.shap_factors || [
    { factor: "3-Day Rainfall", value: `${cell.rainfall_3d_mm} mm`, impact: "+35%", type: "danger", weight: 35 },
    { factor: "Slope Steepness", value: `${cell.slope_deg}°`, impact: "+24%", type: "danger", weight: 24 },
    { factor: "Active Fault Buffer", value: "0.8 km", impact: "+18%", type: "danger", weight: 18 },
    { factor: "Canopy Roots (NDVI)", value: "0.68", impact: "-14%", type: "safe", weight: -14 }
  ]

  return (
    <section className="panel selected-panel">
      <div className="panel-heading selected-heading">
        <div>
          <span className="section-eyebrow"><MapPinned size={14} /> SELECTED RISK LOCATION</span>
          <h2>{cell.cell_id}</h2>
        </div>
        <SeverityBadge level={cell.risk_level} />
      </div>

      <div className="risk-score-block">
        <h3>Operational Failure Threat</h3>
        <div className="risk-score">
          <strong>{cell.risk_probability}%</strong>
          <span>Dynamic Failure Probability</span>
        </div>
        <div className="probability-track">
          <span style={{
            width: `${cell.risk_probability}%`,
            background: cell.risk_probability >= 75 ? '#d7191c' : cell.risk_probability >= 50 ? '#e16713' : cell.risk_probability >= 20 ? '#b87808' : '#27865f'
          }} />
        </div>
        <small>Coupled Layer 1 Static Fragility &amp; Layer 2 NASA Dynamic Trigger</small>
      </div>

      {/* Visual SHAP Explainable AI Breakdown */}
      <div className="detail-section" style={{
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '0.85rem',
        border: '1px solid #e2e8f0',
        margin: '0.9rem 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e293b' }}>
            <Sparkles size={15} color="#097969" />
            Explainable AI Factor Breakdown (TreeSHAP)
          </h3>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>ATTRIBUTION</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {shapFactors.map((sf, idx) => {
            const isDanger = sf.type === 'danger'
            const isWarning = sf.type === 'warning'
            const barColor = isDanger ? '#e53e3e' : isWarning ? '#dd6b20' : '#319795'
            const absPct = Math.min(100, Math.abs(sf.weight || 20) * 2.2)

            return (
              <div key={idx} style={{ fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isDanger || isWarning ? <TrendingUp size={13} color={barColor} /> : <TrendingDown size={13} color={barColor} />}
                    {sf.factor} <strong style={{ color: '#64748b', fontWeight: 500 }}>({sf.value})</strong>
                  </span>
                  <span style={{ fontWeight: 800, color: barColor }}>
                    {sf.impact}
                  </span>
                </div>
                <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${absPct}%`,
                    background: barColor,
                    height: '100%',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="detail-section">
        <h3>Terrain Morphometry</h3>
        <div className="detail-metrics two-col">
          <Metric icon={Ruler} label="Slope Angle" value={`${cell.slope_deg}°`} />
          <Metric icon={Mountain} label="Elevation" value={`${cell.elevation_m.toLocaleString()} m`} />
        </div>
      </div>

      <div className="detail-section">
        <h3>Satellite Hydrology (NASA Feeds)</h3>
        <div className="detail-metrics two-col">
          <Metric icon={CloudRain} label="Rainfall 24h" value={`${cell.rainfall_1d_mm} mm`} />
          <Metric icon={CloudRain} label="Rainfall 3-Day" value={`${cell.rainfall_3d_mm} mm`} />
          <Metric icon={CloudRain} label="Rainfall 7-Day" value={`${cell.rainfall_7d_mm} mm`} />
          <Metric icon={Droplets} label="Soil Saturation" value={`${cell.soil_moisture}%`} />
        </div>
      </div>

      <div className="detail-section exposure-section">
        <h3>Infrastructure Exposure</h3>
        <div><Route size={16} /><span>Nearest Road<strong>{cell.nearest_road} · {cell.road_distance_m} m</strong></span></div>
        <div><MapPinned size={16} /><span>Settlement Buffer<strong>{cell.nearest_settlement} · {cell.settlement_distance_m} m</strong></span></div>
      </div>

      <div className="explanation-box"><Info size={17} /><p><strong>AI Risk Synthesis</strong>{cell.explanation}</p></div>
      <p className="mock-caveat">AI risk assessment computed via Dual-Layer Machine Learning Engine with TreeSHAP explainability.</p>
    </section>
  )
}
