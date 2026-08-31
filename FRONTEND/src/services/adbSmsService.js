// ADB SMS Service for Direct USB Phone Dispatch
import emergencyContacts from '../data/emergencyContacts.json'

export const adbSmsService = {
  checkStatus: async () => {
    try {
      const res = await fetch('/api/adbStatus')
      return await res.json()
    } catch (e) {
      return { connected: false, error: e.message }
    }
  },

  sendSmsToAll: async (message) => {
    const numbersList = emergencyContacts
      .map((c) => c.phone.replace(/\D/g, '').slice(-10))
      .filter((n) => n.length === 10)

    const cleanMsg = (message || '[NDMA SIKKIM ALERT] Severe Landslide Warning. Avoid transit. Helpline: 1070.').slice(0, 160)

    try {
      const res = await fetch('/api/sendAdbSms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: numbersList,
          message: cleanMsg
        })
      })
      const data = await res.json()
      return data
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
}

export default adbSmsService
