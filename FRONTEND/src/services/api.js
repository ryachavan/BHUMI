import { mockDashboardData } from '../data/mockRiskData'

const delay = (value, milliseconds = 120) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), milliseconds))

export const api = {
  getDashboard: () => delay(mockDashboardData),
}

export default api
