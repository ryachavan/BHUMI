import React from 'react'
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  Info,
  MapPin,
  Phone,
  Route,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import SeverityBadge from './SeverityBadge'
import RiskMap from './RiskMap'
import LandslideSimulator from './LandslideSimulator'
import { getDistrictConfig } from '../data/districtConfig'
import DynamicText from './DynamicText'
import { useSimulation } from '../contexts/SimulationContext'

export default function CitizenSection({
  data,
  selectedDistrict = 'ALL',
  onOpenReportModal,
  onSelectCell,
  selectedCell,
}) {

  const districtCfg = getDistrictConfig(selectedDistrict)
  const alerts = data?.alerts || []

  const { simulationActive, simulationEvent } = useSimulation()

  // Build simulation marker for the map when simulation is active
  const simulationMarker = simulationActive && simulationEvent
    ? { lat: simulationEvent.lat, lon: simulationEvent.lon, name: simulationEvent.name, date: simulationEvent.date }
    : null

  // Derive localized status styling
  const statusKey = (districtCfg.status || 'LOW').toLowerCase()
  const isCritical = statusKey === 'critical' || statusKey === 'severe'
  const isHigh = statusKey === 'high'
  const isModerate = statusKey === 'moderate'
  const isSafe = statusKey === 'low' || statusKey === 'safe'

  const localBadgeClass = isCritical ? 'critical' : isHigh ? 'high' : isModerate ? 'moderate' : 'safe'

  // Filter public alerts
  const citizenAlerts = alerts.slice(0, 3)

  return (
    <div className="citizen-view-container">
      {/* 1. Large Clear Localized Risk Status Banner */}
      <div className={`citizen-alert-banner ${localBadgeClass}`}>
        <div className="banner-header-row">
          <div>
            <div className="banner-location-heading">
              {districtCfg.name} — <DynamicText text="Hazard Status" />: {districtCfg.status}
            </div>
            <div className="banner-plain-text">
              <DynamicText text={districtCfg.activeAdvisory} />
            </div>
          </div>
          <div className={`banner-status-badge ${localBadgeClass}`}>
            {isSafe && <ShieldCheck size={16} />}
            {isModerate && <Info size={16} />}
            {isHigh && <AlertTriangle size={16} />}
            {isCritical && <ShieldAlert size={16} />}
            {districtCfg.status} <DynamicText text="RISK" /> ({districtCfg.riskScore}/100)
          </div>
        </div>

        {/* Action Guidance Strip */}
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600',
        }}>
          <strong><DynamicText text="Recommended Citizen Action:" /></strong>
          <span><DynamicText text={districtCfg.citizenAdvice} /></span>
        </div>
      </div>

      {/* 2. District Quick Intelligence Overview */}
      <div
        className="gov-card"
        style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--gov-slate-50)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          borderLeft: `4px solid ${isCritical ? 'var(--status-critical)' : isHigh ? 'var(--status-high)' : isModerate ? 'var(--status-moderate)' : 'var(--status-safe)'}`
        }}
      >
        <div>
          <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            <DynamicText text="Mean Elevation" />
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gov-navy)' }}>
            {districtCfg.elevationM?.toLocaleString()} m MSL
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            <DynamicText text="Terrain Slope Gradient" />
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gov-navy)' }}>
            {districtCfg.avgSlopeDeg}° <DynamicText text="(Steep Hillside)" />
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            <DynamicText text="3-Day Cumulative Rain" />
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gov-navy)' }}>
            {districtCfg.rainfall3dMm} mm
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            <DynamicText text="Soil Saturation (SMAP)" />
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gov-navy)' }}>
            {districtCfg.soilSaturationPct}% <DynamicText text="Capacity" />
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            <DynamicText text="Direct DEOC Control Line" />
          </span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gov-navy)', fontFamily: 'var(--font-mono)' }}>
            {districtCfg.deocNumber}
          </div>
        </div>
      </div>

      {/* Historical Landslide Simulator */}
      <LandslideSimulator />

      {/* 3. Primary Citizen Grid Layout */}
      <div className="citizen-grid-layout">
        {/* Left Column: Local Map & Direct Reporting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Simple Map Card */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <MapPin size={16} /> <DynamicText text="Local Area Risk & Road Accessibility Map" /> ({districtCfg.shortName})
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gov-slate-600)' }}>
                <DynamicText text="Auto-focused on" /> {districtCfg.name}
              </span>
            </div>
            <div className="map-container-shell" style={{ height: '420px' }}>
              <RiskMap
                riskCells={data.riskCells || []}
                roads={data.roads || []}
                settlements={data.settlements || []}
                historicalLandslides={data.historicalLandslides || []}
                boundaryGeoJson={data.sikkimBoundary}
                selectedCell={selectedCell}
                onSelectCell={onSelectCell}
                selectedDistrict={selectedDistrict}
                simulationMarker={simulationMarker}
              />
            </div>
          </div>

          {/* Quick Incident Reporting Banner */}
          <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-navy)' }}>
            <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy)', margin: '0 0 4px' }}>
                  <DynamicText text={`Witnessed a slope failure, rockfall, or road crack in ${districtCfg.shortName}?`} />
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--gov-slate-600)' }}>
                  <DynamicText text="Submit immediate geo-tagged ground photos to alert District Disaster Operations Center & BRO Road Clearance teams." />
                </p>
              </div>
              <button
                type="button"
                className="citizen-report-trigger-btn"
                style={{ width: 'auto', minWidth: '200px' }}
                onClick={onOpenReportModal}
              >
                <Camera size={16} /> <DynamicText text="Report Ground Hazard" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Safety Guidelines, Helplines, Recent Advisories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Important Helplines Card */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Phone size={16} /> {districtCfg.shortName} <DynamicText text="Emergency Helplines" />
              </div>
              <span className="gov-badge safe"><DynamicText text="24/7 ACTIVE" /></span>
            </div>
            <div className="gov-card-body">
              <div className="helplines-grid">
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="District DEOC" /></span>
                  <span className="helpline-number">{districtCfg.deocNumber}</span>
                </div>
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="District Police" /></span>
                  <span className="helpline-number">{districtCfg.policeControl}</span>
                </div>
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="State Control Room" /></span>
                  <span className="helpline-number">1070 / 1077</span>
                </div>
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="National Emergency" /></span>
                  <span className="helpline-number">112</span>
                </div>
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="Ambulance" /></span>
                  <span className="helpline-number">{districtCfg.ambulanceNumber}</span>
                </div>
                <div className="helpline-pill">
                  <span className="helpline-label"><DynamicText text="Fire & Rescue" /></span>
                  <span className="helpline-number">101</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Highway Corridors Status */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Route size={16} /> {districtCfg.shortName} <DynamicText text="Highway Corridors" />
              </div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px' }}>
              <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {districtCfg.keyCorridors.map((corridor, idx) => (
                  <li key={idx} style={{ color: 'var(--gov-slate-800)', fontWeight: 600 }}>
                    <DynamicText text={corridor} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Instructions Card */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <CheckCircle2 size={16} /> <DynamicText text="Monsoon Safety Checklist" />
              </div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12.5px', color: 'var(--gov-slate-800)' }}>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>
                  <DynamicText text="Watch hillside drainage: Rapidly flowing muddy water indicates active soil erosion upstream." />
                </li>
                <li>
                  <DynamicText text="Listen for unusual sounds: Cracking trees or knocking boulders indicate moving ground." />
                </li>
                <li>
                  <DynamicText text="Stay off riverbanks: Debris flows can cause sudden river damming followed by flash surges." />
                </li>
                <li>
                  <DynamicText text="Emergency Bag: Keep torch, battery, water bottle, ID documents, and essential medicines accessible." />
                </li>
              </ul>
            </div>
          </div>

          {/* Recent Public Advisories */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <Bell size={16} /> <DynamicText text="District Public Advisories" />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--gov-slate-500)', fontWeight: 600 }}>
                {citizenAlerts.length} <DynamicText text="Official Bulletins" />
              </span>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              {citizenAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--gov-slate-200)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--gov-navy)' }}>
                      <DynamicText text={alert.title} />
                    </strong>
                    <SeverityBadge level={alert.risk_level} />
                  </div>
                  <p style={{ margin: 0, color: 'var(--gov-slate-700)', lineHeight: 1.4 }}>
                    <DynamicText text={alert.detail} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
