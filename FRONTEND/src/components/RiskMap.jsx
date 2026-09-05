import React, { useEffect, useRef, useState } from 'react'
import { Circle, CircleMarker, GeoJSON, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { Layers, MapPin, Mountain, Route as RouteIcon } from 'lucide-react'
import RiskLegend from './RiskLegend'
import SeverityBadge from './SeverityBadge'
import { getDistrictConfig } from '../data/districtConfig'

const SEVERITY_COLORS = {
  LOW: '#15803d',
  SAFE: '#15803d',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  SEVERE: '#b91c1c',
  CRITICAL: '#b91c1c',
}

function MapFocus({ selectedCell, selectedDistrict }) {
  const map = useMap()
  const previousCellId = useRef(selectedCell?.cell_id)
  const previousDistrict = useRef(selectedDistrict)

  // Fly to selected district when district changes
  useEffect(() => {
    if (selectedDistrict && previousDistrict.current !== selectedDistrict) {
      const cfg = getDistrictConfig(selectedDistrict)
      if (cfg && cfg.center) {
        map.flyTo(cfg.center, cfg.zoom, { duration: 0.9 })
        previousDistrict.current = selectedDistrict
      }
    }
  }, [map, selectedDistrict])

  // Fly to specific cell when selected
  useEffect(() => {
    if (selectedCell && previousCellId.current !== selectedCell.cell_id) {
      map.flyTo([selectedCell.latitude, selectedCell.longitude], 12, { duration: 0.7 })
      previousCellId.current = selectedCell.cell_id
    }
  }, [map, selectedCell])

  return null
}

/** Pans/zooms the map to the simulation event's coordinates */
function SimulationFocus({ simulationMarker }) {
  const map = useMap()
  const prevMarkerRef = useRef(null)

  useEffect(() => {
    if (simulationMarker && simulationMarker.lat && simulationMarker.lon) {
      const key = `${simulationMarker.lat}-${simulationMarker.lon}`
      if (prevMarkerRef.current !== key) {
        map.flyTo([simulationMarker.lat, simulationMarker.lon], 12, { duration: 1.0 })
        prevMarkerRef.current = key
      }
    } else {
      prevMarkerRef.current = null
    }
  }, [map, simulationMarker])

  return null
}

const layerLabels = {
  riskZones: 'Risk Zones (1-km Grid)',
  roads: 'Highway & Road Network',
  settlements: 'Settlements / Habitats',
  history: 'Historical Landslide Points',
  boundary: 'Administrative Boundary',
}

export default function RiskMap({
  riskCells = [],
  roads = [],
  settlements = [],
  historicalLandslides = [],
  boundaryGeoJson,
  selectedCell,
  onSelectCell,
  selectedDistrict = 'ALL',
  simulationMarker = null,
}) {
  const districtCfg = getDistrictConfig(selectedDistrict)

  const [layers, setLayers] = useState({
    riskZones: true,
    roads: true,
    settlements: true,
    history: false,
    boundary: Boolean(boundaryGeoJson),
  })
  const [layersOpen, setLayersOpen] = useState(false)

  const toggleLayer = (key) => setLayers((curr) => ({ ...curr, [key]: !curr[key] }))

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Layer Control Button */}
      <button
        type="button"
        className="gov-btn gov-btn-secondary"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 500,
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
          backgroundColor: '#ffffff',
          fontSize: '11px',
        }}
        onClick={() => setLayersOpen(!layersOpen)}
        aria-expanded={layersOpen}
      >
        <Layers size={14} /> Map Layers ({Object.values(layers).filter(Boolean).length}/5)
      </button>

      {/* Layer Selection Box */}
      {layersOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: '12px',
            zIndex: 500,
            backgroundColor: '#ffffff',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-card)',
            padding: '12px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '220px',
            fontSize: '11px',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--gov-navy)', textTransform: 'uppercase' }}>
            Toggle Map Layers
          </strong>
          {Object.entries(layerLabels).map(([key, label]) => {
            const unavailable = key === 'boundary' && !boundaryGeoJson
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  color: unavailable ? '#94a3b8' : '#334155',
                  cursor: unavailable ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={layers[key]}
                  disabled={unavailable}
                  onChange={() => toggleLayer(key)}
                  style={{ accentColor: 'var(--gov-navy)' }}
                />
                <span>{label}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={districtCfg.center || [27.42, 88.50]}
        zoom={districtCfg.zoom || 9}
        minZoom={8}
        scrollWheelZoom
        className="leaflet-map-root"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFocus selectedCell={selectedCell} selectedDistrict={selectedDistrict} />
        {simulationMarker && <SimulationFocus simulationMarker={simulationMarker} />}

        {/* Boundary Layer */}
        {layers.boundary && boundaryGeoJson && (
          <GeoJSON
            key="sikkim-boundary"
            data={boundaryGeoJson}
            interactive={false}
            pathOptions={{
              color: '#0f2942',
              weight: 2.5,
              opacity: 0.85,
              fillColor: '#0f2942',
              fillOpacity: 0.03,
              dashArray: '6 4',
            }}
          />
        )}

        {/* Risk Grid Cells */}
        {layers.riskZones &&
          riskCells.map((cell) => {
            const color = SEVERITY_COLORS[cell.risk_level?.toUpperCase()] || SEVERITY_COLORS.LOW
            const isSelected = selectedCell?.cell_id === cell.cell_id

            return (
              <Circle
                key={cell.cell_id}
                center={[cell.latitude, cell.longitude]}
                radius={cell.radius_m || 600}
                pathOptions={{
                  color: isSelected ? '#0f172a' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.75 : 0.45,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{ click: () => onSelectCell && onSelectCell(cell) }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <strong>{cell.cell_id}</strong> · {cell.risk_probability}% {cell.risk_level}
                </Tooltip>
                <Popup>
                  <div style={{ padding: '6px', minWidth: '170px', fontSize: '12px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      ML Hazard Grid Cell
                    </span>
                    <h4 style={{ margin: '2px 0 6px', fontSize: '14px', color: 'var(--gov-navy)' }}>
                      {cell.cell_id}
                    </h4>
                    <div style={{ marginBottom: '6px' }}>
                      <SeverityBadge level={cell.risk_level} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', marginBottom: '8px' }}>
                      Predicted Risk: <strong>{cell.risk_probability}%</strong><br />
                      Slope: <strong>{cell.slope_deg}°</strong> | Rain (3d): <strong>{cell.rainfall_3d_mm} mm</strong>
                    </div>
                    <button
                      type="button"
                      className="gov-btn gov-btn-primary"
                      style={{ width: '100%', fontSize: '10px', padding: '4px 8px' }}
                      onClick={() => onSelectCell && onSelectCell(cell)}
                    >
                      Inspect Cell Telemetry
                    </button>
                  </div>
                </Popup>
              </Circle>
            )
          })}

        {/* Roads Layer */}
        {layers.roads &&
          roads.map((road) => (
            <Polyline
              key={road.road_id}
              positions={road.coordinates}
              pathOptions={{
                color: road.risk_level === 'SEVERE' ? '#b91c1c' : road.risk_level === 'HIGH' ? '#f97316' : '#334155',
                weight: 4,
                opacity: 0.85,
                dashArray: road.risk_level === 'MODERATE' ? '6 5' : undefined,
              }}
            >
              <Tooltip sticky>
                <RouteIcon size={12} /> {road.road_name} ({road.status})
              </Tooltip>
            </Polyline>
          ))}

        {/* Settlements Layer */}
        {layers.settlements &&
          settlements.map((settlement) => (
            <CircleMarker
              key={settlement.settlement_id}
              center={[settlement.latitude, settlement.longitude]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: '#0f2942',
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="right">
                <MapPin size={12} /> <strong>{settlement.name}</strong><br />
                Exposed Population: {settlement.population_exposure?.toLocaleString() || '1,200'}
              </Tooltip>
            </CircleMarker>
          ))}

        {/* Historical Landslides Layer */}
        {layers.history &&
          historicalLandslides.map((event) => (
            <CircleMarker
              key={event.event_id}
              center={[event.latitude, event.longitude]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: '#6b21a8',
                fillOpacity: 0.9,
              }}
            >
              <Tooltip>
                <Mountain size={12} /> Historical Failure ({event.event_year})<br />
                {event.source_status || 'GSI Recorded Inventory'}
              </Tooltip>
            </CircleMarker>
          ))}

        {/* Simulation Marker — pulsing SEVERE indicator with purple outline */}
        {simulationMarker && (
          <>
            {/* Outer pulsing halo */}
            <Circle
              center={[simulationMarker.lat, simulationMarker.lon]}
              radius={1200}
              pathOptions={{
                color: '#7c3aed',
                fillColor: '#7c3aed',
                fillOpacity: 0.10,
                weight: 2,
                dashArray: '8 6',
              }}
            />
            {/* Inner SEVERE circle */}
            <Circle
              center={[simulationMarker.lat, simulationMarker.lon]}
              radius={700}
              pathOptions={{
                color: '#7c3aed',
                fillColor: '#b91c1c',
                fillOpacity: 0.55,
                weight: 3,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent>
                <span style={{ fontWeight: 800, color: '#7c3aed' }}>⚠ SIMULATED SEVERE</span><br />
                <span style={{ fontSize: '11px' }}>{simulationMarker.name}</span>
              </Tooltip>
              <Popup>
                <div style={{ padding: '6px', minWidth: '200px', fontSize: '12px' }}>
                  <div style={{
                    background: '#7c3aed',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'inline-block',
                    marginBottom: '6px',
                    letterSpacing: '0.05em'
                  }}>
                    SIMULATION MODE
                  </div>
                  <h4 style={{ margin: '2px 0 6px', fontSize: '14px', color: '#7c3aed' }}>
                    ⚠ Simulated SEVERE — {simulationMarker.name}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
                    Date: <strong>{simulationMarker.date}</strong><br />
                    Coords: <strong>{simulationMarker.lat}°N, {simulationMarker.lon}°E</strong>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#6b21a8',
                    fontWeight: 700,
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '6px',
                    marginTop: '4px'
                  }}>
                    This is a HISTORICAL REPLAY — not a real alert.
                  </div>
                </div>
              </Popup>
            </Circle>
          </>
        )}
      </MapContainer>

      {/* Floating Government Hazard Legend */}
      <RiskLegend />
    </div>
  )
}
