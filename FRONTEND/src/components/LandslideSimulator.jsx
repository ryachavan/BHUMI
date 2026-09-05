import React, { useState } from 'react'
import { AlertTriangle, History, Play, Square, VolumeX, X } from 'lucide-react'
import { useSimulation } from '../contexts/SimulationContext'
import historicalEvents from '../data/historicalEvents'

export default function LandslideSimulator() {
  const {
    simulationActive,
    simulationEvent,
    alertDismissed,
    startSimulation,
    acknowledgeAlert,
    stopSimulation,
  } = useSimulation()

  const [selectedEventId, setSelectedEventId] = useState(historicalEvents[0]?.id || 1)

  const handleRunSimulation = () => {
    const event = historicalEvents.find((e) => e.id === selectedEventId)
    if (event) startSimulation(event)
  }

  return (
    <div
      className={`gov-card sim-container ${simulationActive ? 'sim-active-border' : ''}`}
      style={{ marginBottom: '16px' }}
    >
      {/* Selector Row */}
      <div className="gov-card-header" style={{ background: simulationActive ? '#f5f3ff' : undefined }}>
        <div className="gov-card-title" style={{ gap: '8px' }}>
          <History size={16} style={{ color: '#7c3aed' }} />
          <span>Historical Landslide Simulation</span>
          <span className="sim-badge">SIMULATION MODE</span>
        </div>

        {simulationActive ? (
          <button
            type="button"
            className="gov-btn sim-btn-exit"
            onClick={stopSimulation}
          >
            <Square size={13} /> Exit Simulation
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="gov-select"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', fontWeight: 600, maxWidth: '340px' }}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
            >
              {historicalEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} — {evt.date}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="gov-btn sim-btn-run"
              onClick={handleRunSimulation}
            >
              <Play size={13} /> Run Simulation
            </button>
          </div>
        )}
      </div>

      {/* Active Simulation Alert Banner */}
      {simulationActive && !alertDismissed && (
        <div className="sim-alert-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
            <div className="sim-alert-icon">
              <AlertTriangle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span className="sim-badge">SIMULATION MODE</span>
                <span className="sim-badge-alert">⚠ SIMULATED ALERT</span>
              </div>
              <div className="sim-alert-title">
                SIMULATED ALERT — HISTORICAL REPLAY: {simulationEvent?.name}, {simulationEvent?.date}
              </div>
              <div className="sim-alert-desc">
                {simulationEvent?.description}
              </div>
              <div className="sim-alert-coords">
                Coordinates: {simulationEvent?.lat}°N, {simulationEvent?.lon}°E · Risk Override: SEVERE (Simulated)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className="gov-btn sim-btn-acknowledge"
              onClick={acknowledgeAlert}
            >
              <VolumeX size={14} /> Acknowledge &amp; Stop Alert
            </button>
            <button
              type="button"
              className="gov-btn sim-btn-exit"
              onClick={stopSimulation}
              style={{ fontSize: '11px' }}
            >
              <X size={13} /> Exit Simulation
            </button>
          </div>
        </div>
      )}

      {/* Post-acknowledge: simulation still active but audio stopped */}
      {simulationActive && alertDismissed && (
        <div className="sim-acknowledged-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sim-badge">SIMULATION MODE</span>
            <span style={{ fontSize: '12px', color: '#5b21b6', fontWeight: 600 }}>
              Replaying: {simulationEvent?.name} ({simulationEvent?.date}) — Alert acknowledged. Map still showing simulated SEVERE marker.
            </span>
          </div>
          <button
            type="button"
            className="gov-btn sim-btn-exit"
            onClick={stopSimulation}
          >
            <Square size={13} /> Exit Simulation
          </button>
        </div>
      )}
    </div>
  )
}
