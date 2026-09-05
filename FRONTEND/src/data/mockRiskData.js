import realRiskData from './realRiskData.json'

export const severityConfig = {
  LOW: { color: '#27865f', fill: '#d8f3e5', label: 'Low' },
  MODERATE: { color: '#eab308', fill: '#fef08a', label: 'Moderate' },
  HIGH: { color: '#f97316', fill: '#ffe3cf', label: 'High' },
  SEVERE: { color: '#c7353f', fill: '#ffe0e2', label: 'Severe' },
}

export const mockDashboardData = realRiskData
export default mockDashboardData
