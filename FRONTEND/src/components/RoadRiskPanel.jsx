import React from 'react'
import { Route } from 'lucide-react'
import SeverityBadge from './SeverityBadge'

const statusClass = (status) => status.toLowerCase().replaceAll(' ', '-')

export default function RoadRiskPanel({ roads }) {
  return (
    <section className="panel road-panel">
      <div className="panel-heading">
        <div>
          <span className="section-eyebrow"><Route size={14} /> TRANSPORT NETWORK</span>
          <h2>Road Connectivity &amp; Risk</h2>
          <p>Strategic highway corridors across Sikkim with landslide vulnerability assessment</p>
        </div>
        <span className="record-count">{roads.length} STRATEGIC CORRIDORS</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Road Corridor</th>
              <th>Risk Level</th>
              <th>Affected Stretch</th>
              <th>Key Hotspot</th>
              <th>Movement Status</th>
            </tr>
          </thead>
          <tbody>
            {roads.map((road) => (
              <tr key={road.road_id}>
                <td>
                  <strong>{road.road_name}</strong>
                  <small>{road.road_id}</small>
                </td>
                <td><SeverityBadge level={road.risk_level} subtle /></td>
                <td><strong>{road.affected_segment_km} km</strong> <small style={{ color: '#888' }}>({road.total_length_km ? `${road.total_length_km}km tot` : ''})</small></td>
                <td>{road.nearby_settlement}</td>
                <td><span className={`road-status road-status--${statusClass(road.status)}`}>{road.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="panel-note">Statuses indicate potential movement risk based on ML susceptibility analysis and real-time weather triggers.</p>
    </section>
  )
}
