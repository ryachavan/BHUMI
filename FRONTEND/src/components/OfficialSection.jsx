import React, { useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle,
  FileCheck,
  Filter,
  MapPin,
  RadioTower,
  Route,
  ShieldAlert,
  XCircle,
  Clock,
  Eye,
  Send,
  CloudRain,
} from 'lucide-react'
import SeverityBadge from './SeverityBadge'
import RiskMap from './RiskMap'
import LandslideSimulator from './LandslideSimulator'
import reportService from '../services/reports'
import { getDistrictConfig } from '../data/districtConfig'
import { useSimulation } from '../contexts/SimulationContext'

export default function OfficialSection({
  data,
  selectedCell,
  onSelectCell,
  citizenReports = [],
  onOpenBroadcastModal,
  onViewAlertLocation,
  selectedDistrict = 'ALL',
  onDistrictChange,
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [verifiedList, setVerifiedList] = useState([])
  const [dismissedList, setDismissedList] = useState([])

  const { simulationActive, simulationEvent } = useSimulation()

  const districtCfg = getDistrictConfig(selectedDistrict)

  // Build simulation marker for the map when simulation is active
  const simulationMarker = simulationActive && simulationEvent
    ? { lat: simulationEvent.lat, lon: simulationEvent.lon, name: simulationEvent.name, date: simulationEvent.date }
    : null

  const meta = data?.meta || {}
  const summary = meta.summary || {}
  const alerts = data?.alerts || []
  const emergencyPriorities = data?.emergencyPriorities || []
  const roads = data?.roads || []
  const weather = data?.weather || {}

  // Filter risk cells based on official filters
  const filteredRiskCells = (data.riskCells || []).filter((cell) => {
    if (severityFilter !== 'ALL' && cell.risk_level !== severityFilter) return false
    return true
  })

  // Citizen reports pending verification
  const pendingReports = citizenReports.filter(
    (r) => !verifiedList.includes(r.id) && !dismissedList.includes(r.id)
  )

  const handleVerifyReport = (id) => {
    reportService.updateStatus(id, 'VERIFIED')
    setVerifiedList((prev) => [...prev, id])
  }

  const handleDismissReport = (id) => {
    reportService.updateStatus(id, 'DISMISSED')
    setDismissedList((prev) => [...prev, id])
  }

  return (
    <div className="official-view-container">
      {/* 1. Top KPI Summary Cards (District Localized) */}
      <div className="summary-kpi-row">
        <div className={`kpi-card ${districtCfg.criticalCellsCount > 0 ? 'critical' : 'safe'}`}>
          <div className="kpi-title">{districtCfg.shortName} Critical Cells (1km)</div>
          <div className="kpi-value">{districtCfg.criticalCellsCount}</div>
          <div className="kpi-subtext">Immediate Debris Threat</div>
        </div>

        <div className={`kpi-card ${districtCfg.highCellsCount > 0 ? 'high' : 'safe'}`}>
          <div className="kpi-title">{districtCfg.shortName} High Risk Zones</div>
          <div className="kpi-value">{districtCfg.highCellsCount}</div>
          <div className="kpi-subtext">Active Monitoring Trigger</div>
        </div>

        <div className={`kpi-card ${districtCfg.blockedRoadsCount > 0 ? 'critical' : districtCfg.roadsAtRiskCount > 0 ? 'moderate' : 'safe'}`}>
          <div className="kpi-title">Roads Compromised / Blocked</div>
          <div className="kpi-value">{districtCfg.roadsAtRiskCount}</div>
          <div className="kpi-subtext">{districtCfg.blockedRoadsCount > 0 ? 'Passage Blocked' : 'Normal / Regulated'}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Exposed Population Buffer</div>
          <div className="kpi-value">{districtCfg.exposedPopulation}</div>
          <div className="kpi-subtext">{districtCfg.shortName} Threat Perimeter</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">District Status / DEOC</div>
          <div className="kpi-value" style={{ fontSize: '15px', color: 'var(--gov-slate-800)', marginTop: '4px' }}>
            {districtCfg.status} RISK
          </div>
          <div className="kpi-subtext">DEOC: {districtCfg.deocNumber}</div>
        </div>
      </div>

      {/* 2. Control Toolbar (District & Severity Filters + Quick Dispatch) */}
      <div
        className="gov-card"
        style={{
          marginBottom: '16px',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--gov-slate-50)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--gov-navy)' }}>
            <Filter size={14} /> FILTER COMMAND VIEW:
          </div>

          <label style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            District Focus:
            <select
              className="gov-select"
              style={{ padding: '3px 8px', fontSize: '11px', width: 'auto', fontWeight: 700 }}
              value={selectedDistrict}
              onChange={(e) => onDistrictChange && onDistrictChange(e.target.value)}
            >
              <option value="ALL">All Districts (State Overview)</option>
              <option value="Mangan">Mangan (North Sikkim)</option>
              <option value="Gangtok">Gangtok (East Sikkim)</option>
              <option value="Namchi">Namchi (South Sikkim)</option>
              <option value="Gyalshing">Gyalshing (West Sikkim)</option>
              <option value="Pakyong">Pakyong District</option>
              <option value="Soreng">Soreng District</option>
            </select>
          </label>

          <label style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Severity Threshold:
            <select
              className="gov-select"
              style={{ padding: '3px 8px', fontSize: '11px', width: 'auto' }}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">All Severity Levels</option>
              <option value="SEVERE">Critical / Severe (Red)</option>
              <option value="HIGH">High (Orange)</option>
              <option value="MODERATE">Moderate (Yellow)</option>
              <option value="LOW">Low / Safe (Green)</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="gov-btn gov-btn-danger"
          onClick={() => onOpenBroadcastModal && onOpenBroadcastModal(alerts[0])}
        >
          <RadioTower size={14} /> Multi-Channel CAP / SMS Broadcast
        </button>
      </div>

      {/* Historical Landslide Simulator */}
      <LandslideSimulator />

      {/* 3. Main Operational GIS Risk Map */}
      <div className="gov-card" style={{ marginBottom: '16px' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">
            <MapPin size={16} /> Regional Landslide Hazard GIS Command Map — {districtCfg.name}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--gov-slate-600)' }}>
            Showing {filteredRiskCells.length} Monitored Grid Cells · Auto-focused on {districtCfg.shortName}
          </span>
        </div>
        <div className="map-container-shell" style={{ height: '520px' }}>
          <RiskMap
            riskCells={filteredRiskCells}
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

      {/* 4. Dual Operational Panels: Response Prioritisation & Active Warnings */}
      <div className="official-control-grid">
        {/* Left: Emergency Prioritization & Road Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Emergency Prioritization Panel */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <AlertTriangle size={16} /> Emergency Response Prioritization Queue ({districtCfg.shortName})
              </div>
              <span className="gov-badge critical">ACTION RANKED</span>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              <table className="telemetry-table">
                <thead>
                  <tr>
                    <th>Rank / Target Area</th>
                    <th>Vulnerability Score</th>
                    <th>Exposed Pop.</th>
                    <th>Route Status</th>
                    <th>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {emergencyPriorities.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>
                        <strong>#{idx + 1} {item.settlement_name || item.name}</strong>
                        <div style={{ fontSize: '10px', color: 'var(--gov-slate-500)' }}>
                          Sector: {selectedDistrict !== 'ALL' ? selectedDistrict : (item.district || 'Sikkim North')}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: item.composite_score > 70 ? 'var(--status-critical)' : 'var(--status-high)' }}>
                          {item.composite_score || item.risk_score || 84}/100
                        </span>
                      </td>
                      <td>{item.exposed_population || item.population || '1,420'}</td>
                      <td>
                        <span className={`gov-badge ${item.road_status === 'BLOCKED' ? 'critical' : 'moderate'}`}>
                          {item.road_status || 'RESTRICTED'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>
                          {item.recommended_action || 'Deploy SDRF standby & pre-position earthmovers'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Citizen Reports Verification Queue */}
          <div className="gov-card" id="verification-queue">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <FileCheck size={16} /> Citizen Incident Reports Verification Queue
              </div>
              <span className="gov-badge safe">{pendingReports.length} PENDING REVIEW</span>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              {pendingReports.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gov-slate-500)', fontSize: '12px' }}>
                  No pending field reports. All citizen observations have been triaged.
                </div>
              ) : (
                <table className="telemetry-table">
                  <thead>
                    <tr>
                      <th>Time / Location</th>
                      <th>Hazard Description</th>
                      <th>Road Blocked?</th>
                      <th>Reporter</th>
                      <th>Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <strong>{report.location}</strong>
                          <div style={{ fontSize: '10px', color: 'var(--gov-slate-500)' }}>
                            {report.timestamp ? new Date(report.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent'} · {report.coords}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px' }}>{report.description}</span>
                          {report.photo && (
                            <div style={{ marginTop: '4px' }}>
                              <img
                                src={report.photo}
                                alt="Evidence"
                                style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
                              />
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`gov-badge ${report.roadBlocked === 'yes' ? 'critical' : 'safe'}`}>
                            {report.roadBlocked === 'yes' ? 'BLOCKED' : 'OPEN'}
                          </span>
                        </td>
                        <td>{report.reporterName || 'Anonymous Citizen'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="gov-btn gov-btn-primary"
                              style={{ padding: '3px 8px', fontSize: '10px' }}
                              onClick={() => handleVerifyReport(report.id)}
                            >
                              <CheckCircle size={12} /> Verify &amp; Dispatch
                            </button>
                            <button
                              type="button"
                              className="gov-btn gov-btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '10px' }}
                              onClick={() => handleDismissReport(report.id)}
                            >
                              <XCircle size={12} /> Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Warnings Feed & Weather Trigger Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Warnings Panel */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <BellRing size={16} /> Active Early Warnings ({districtCfg.shortName})
              </div>
              <span className="gov-badge critical">{alerts.length} TRIGGERED</span>
            </div>
            <div className="gov-card-body" style={{ padding: 0 }}>
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--gov-slate-200)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--gov-navy)' }}>{alert.title}</strong>
                    <SeverityBadge level={alert.risk_level} />
                  </div>
                  <p style={{ margin: '0 0 8px', color: 'var(--gov-slate-700)', lineHeight: 1.4 }}>
                    {alert.detail}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--gov-slate-500)' }}>
                      Target: {alert.location_cell_id} · Channels: {alert.channels?.join(', ')}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="gov-btn gov-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                        onClick={() => onViewAlertLocation(alert.location_cell_id)}
                      >
                        <Eye size={12} /> Focus Map
                      </button>
                      <button
                        type="button"
                        className="gov-btn gov-btn-danger"
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                        onClick={() => onOpenBroadcastModal(alert)}
                      >
                        <Send size={12} /> Push SMS
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meteorological Trigger Summary */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <CloudRain size={16} /> {districtCfg.shortName} Weather &amp; Precipitation Status
              </div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--gov-slate-50)', padding: '8px 10px', border: 'var(--border-default)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase' }}>24h Max Rainfall</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy)' }}>
                    {districtCfg.rainfall24hMm} mm
                  </div>
                </div>
                <div style={{ background: 'var(--gov-slate-50)', padding: '8px 10px', border: 'var(--border-default)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gov-slate-500)', textTransform: 'uppercase' }}>3-Day Cumulative Rain</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy)' }}>
                    {districtCfg.rainfall3dMm} mm
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--gov-slate-700)', lineHeight: 1.4 }}>
                <strong>Hydrological State:</strong> Soil saturation index in {districtCfg.shortName} estimated at <strong>{districtCfg.soilSaturationPct}%</strong>. Infiltration rate threshold is <strong>{districtCfg.soilSaturationPct > 60 ? 'EXCEEDED (HIGH THREAT)' : 'STABLE'}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
