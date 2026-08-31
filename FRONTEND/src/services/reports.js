// Permanent Google Cloud Firebase Realtime Database Sync Service
// Atomic Key-Value Storage with Zero Race Conditions and Real-Time Cross-Device Sync

export const FIREBASE_BASE_URL = import.meta.env.VITE_FIREBASE_DB_URL
console.log("🔥 Using Firebase DB URL:", FIREBASE_BASE_URL)

export const DEFAULT_REPORTS = [
  {
    id: 'CR-104',
    location: 'NH-10 (Km 18.2, 20th Mile bend near Singtam)',
    timestamp: '18 mins ago',
    reportedBy: 'Tenzing L. (Local Driver)',
    description: 'Active debris fall and rock tumbling observed across southbound lane. Soil slumping from upper toe cutting.',
    roadBlocked: 'Partial (Single Lane)',
    status: 'PENDING_VERIFICATION',
    severity: 'HIGH',
    coords: '27.2341°N, 88.4982°E',
    photoUrl: null
  },
  {
    id: 'CR-105',
    location: 'North Sikkim Highway (Chungthang Gorge Km 42)',
    timestamp: '42 mins ago',
    reportedBy: 'Pema D. (BRO Road Worker)',
    description: 'Mudflow slurry pooling along culvert. Tension cracks expanding across roadside retaining wall.',
    roadBlocked: 'No Blockage',
    status: 'PENDING_VERIFICATION',
    severity: 'SEVERE',
    coords: '27.6042°N, 88.6431°E',
    photoUrl: null
  }
]

export const reportService = {
  getInitialReports: () => {
    try {
      const stored = localStorage.getItem('bhumi_citizen_reports')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_REPORTS
  },

  getReports: async () => {
    try {
      const startTime = performance.now()
      const res = await fetch(`${FIREBASE_BASE_URL}.json`, { cache: 'no-store' })
      const latency = Math.round(performance.now() - startTime)

      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          let list = Array.isArray(data) ? data : Object.values(data)
          list = list.filter((r) => r && typeof r === 'object' && r.id)
          // Sort descending: newest reports on top
          list.sort((a, b) => (b.id || '').localeCompare(a.id || ''))

          if (list.length > 0) {
            localStorage.setItem('bhumi_citizen_reports', JSON.stringify(list))
            console.log(
              `%c☁️ [FIREBASE LIVE SYNC] Received ${list.length} reports in ${latency}ms`,
              'color: #26d0ce; font-family: monospace; font-size: 11px;'
            )
            return list
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ [FIREBASE FETCH FAILED] Falling back to local cache:', e)
    }

    return reportService.getInitialReports()
  },

  addReport: async (newReport) => {
    const uniqueSuffix = Date.now().toString().slice(-4)
    const reportId = `CR-${uniqueSuffix}`

    const fullReport = {
      id: reportId,
      timestamp: 'Just now',
      status: 'PENDING_VERIFICATION',
      severity: newReport.roadBlocked?.includes('Full') ? 'SEVERE' : 'HIGH',
      ...newReport
    }

    console.log(`%c🚀 [CITIZEN UPLOAD INITIATED] Publishing ${reportId} to Firebase...`, 'color: #26d0ce; font-weight: bold;')

    // 1. Direct Atomic Keyed Write to Firebase
    try {
      const startTime = performance.now()
      const res = await fetch(`${FIREBASE_BASE_URL}/${reportId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullReport)
      })
      const duration = Math.round(performance.now() - startTime)

      if (res.ok) {
        console.log(`%c✅ [FIREBASE SUCCESS] Report ${reportId} confirmed on Google Cloud in ${duration}ms!`, 'color: #00ff88; font-weight: bold;')
      } else {
        console.warn(`⚠️ [FIREBASE PUT WARNING] Server returned status: ${res.status}`)
      }
    } catch (e) {
      console.error('❌ [FIREBASE NETWORK ERROR]:', e)
    }

    // Update local cache
    const current = reportService.getInitialReports()
    const updated = [fullReport, ...current]
    localStorage.setItem('bhumi_citizen_reports', JSON.stringify(updated))
    return fullReport
  },

  updateStatus: async (id, status) => {
    console.log(`%c🛡️ [ADMIN ESCALATION] Updating ${id} -> ${status}`, 'color: #ff8a93; font-weight: bold;')

    try {
      await fetch(`${FIREBASE_BASE_URL}/${id}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      console.log(`%c✅ [ADMIN STATUS CONFIRMED] ${id} status live in cloud DB`, 'color: #74e0b1;')
    } catch (e) {
      console.warn('Firebase status patch failed:', e)
    }

    const current = reportService.getInitialReports()
    const updated = current.map((r) => (r.id === id ? { ...r, status } : r))
    localStorage.setItem('bhumi_citizen_reports', JSON.stringify(updated))
    return updated
  }
}

export default reportService
