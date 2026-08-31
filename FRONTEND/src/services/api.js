import { mockDashboardData } from '../data/mockRiskData'

const delay = (value, milliseconds = 120) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), milliseconds))

export const api = {
  // Future: GET /api/risk/current
  getDashboardMeta: () => delay(mockDashboardData.meta),
  // Future: GET /api/risk/grid
  getRiskGrid: () => delay(mockDashboardData.riskCells),
  // Future: GET /api/weather/current
  getWeather: () => delay(mockDashboardData.weather),
  // Future: GET /api/roads/risk
  getRoadRisk: () => delay(mockDashboardData.roads),
  // Future: GET /api/alerts
  getAlerts: () => delay(mockDashboardData.alerts),
  // Future: GET /api/emergency-priority
  getEmergencyPriorities: () => delay(mockDashboardData.emergencyPriorities),
  // Future: GET /api/gis/sikkim-boundary (authoritative GeoJSON only)
  getSikkimBoundary: () => delay(mockDashboardData.sikkimBoundary),
  getDashboard: () => delay(mockDashboardData),
}

export default api
