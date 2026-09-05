import React from 'react'

export default function RiskLegend() {
  const legendItems = [
    { label: 'Safe / Low (<25%)', color: '#15803d' },
    { label: 'Moderate (25-50%)', color: '#eab308' },
    { label: 'High (50-75%)', color: '#f97316' },
    { label: 'Critical (>75%)', color: '#b91c1c' },
  ]

  return (
    <div className="map-floating-legend" aria-label="Risk severity legend">
      <div className="legend-title">Hazard Severity (NDMA)</div>
      {legendItems.map((item, idx) => (
        <div key={idx} className="legend-item">
          <span className="legend-color-box" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '6px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
        1-km ML Composite Grid
      </div>
    </div>
  )
}
