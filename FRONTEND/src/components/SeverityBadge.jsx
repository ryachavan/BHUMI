import React from 'react'

const SEVERITY_MAP = {
  LOW: { label: 'Safe / Low', className: 'safe', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  SAFE: { label: 'Safe', className: 'safe', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  MODERATE: { label: 'Moderate', className: 'moderate', color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  HIGH: { label: 'High', className: 'high', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  SEVERE: { label: 'Critical', className: 'critical', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  CRITICAL: { label: 'Critical', className: 'critical', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
}

export default function SeverityBadge({ level }) {
  const normLevel = (level || 'LOW').toUpperCase()
  const config = SEVERITY_MAP[normLevel] || SEVERITY_MAP.LOW

  return (
    <span className={`gov-badge ${config.className}`}>
      ● {config.label}
    </span>
  )
}
