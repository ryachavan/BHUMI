// Authentication & Role-Based Access Control (RBAC) Service
// Basic role management for Admin / Analyst / Viewer views

export const PRESET_USERS = {
  admin: {
    id: 'USR-001',
    name: 'District Commander',
    title: 'State Disaster Management Authority (SDMA Lead)',
    role: 'admin',
    roleLabel: 'DISASTER COMMANDER (ADMIN)',
    permissions: [
      'VIEW_MAP',
      'TRIGGER_SIRENS',
      'DISPATCH_SDRF',
      'CLOSE_HIGHWAYS',
      'VERIFY_CITIZEN_REPORTS',
      'SYSTEM_CONFIG'
    ]
  },
  analyst: {
    id: 'USR-002',
    name: 'GIS Scientist',
    title: 'Senior GIS & Landslide Research Scientist',
    role: 'analyst',
    roleLabel: 'GIS SCIENTIST (ANALYST)',
    permissions: [
      'VIEW_MAP',
      'INSPECT_SHAP_MODELS',
      'SATELLITE_TELEMETRY_ANALYTICS',
      'EXPORT_REPORTS'
    ]
  },
  viewer: {
    id: 'USR-003',
    name: 'Citizen',
    title: 'Local Resident / Traveler',
    role: 'viewer',
    roleLabel: 'CITIZEN (PUBLIC VIEWER)',
    permissions: [
      'VIEW_MAP_PUBLIC',
      'CHECK_ROAD_STATUS',
      'SUBMIT_CITIZEN_REPORT',
      'RECEIVE_PUBLIC_ALERTS'
    ]
  }
}

export const authService = {
  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem('bhumi_auth_user')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Could not read auth from localStorage', e)
    }
    return PRESET_USERS.viewer
  },

  login: (roleKey = 'admin') => {
    const user = PRESET_USERS[roleKey] || PRESET_USERS.admin
    try {
      localStorage.setItem('bhumi_auth_user', JSON.stringify(user))
    } catch (e) {
      console.warn('Could not save auth', e)
    }
    return user
  },

  logout: () => {
    try {
      localStorage.removeItem('bhumi_auth_user')
    } catch (e) {}
    return PRESET_USERS.viewer
  },

  hasPermission: (user, permissionKey) => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permissionKey)
  }
}

export default authService
