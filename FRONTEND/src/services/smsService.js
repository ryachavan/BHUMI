// Live Real-World SMS Dispatch Engine Powered by Direct Phone SIM / Local Android Gateway
// Reads target numbers directly from emergencyContacts.json

import emergencyContacts from '../data/emergencyContacts.json'

export const DEFAULT_SIM_CONFIG = {
  gatewayUrl: '', // Optional local phone gateway URL (e.g. http://192.168.1.15:8080)
  mode: 'direct' // 'direct' (native SIM intent) | 'gateway' (local phone background)
}

export const smsService = {
  getContacts: () => {
    return emergencyContacts
  },

  getStoredConfig: () => {
    try {
      const stored = localStorage.getItem('bhumi_sim_config')
      if (stored) return JSON.parse(stored)
    } catch (e) {}
    return DEFAULT_SIM_CONFIG
  },

  saveConfig: (config) => {
    localStorage.setItem('bhumi_sim_config', JSON.stringify(config))
  },

  // 1. Direct Native SIM Dispatch (Opens Messages app with pre-filled numbers and alert text)
  triggerDirectSimBroadcast: (message) => {
    const numbersList = emergencyContacts
      .map((c) => c.phone.replace(/\D/g, '').slice(-10))
      .filter((n) => n.length === 10)

    if (numbersList.length === 0) return { success: false, error: 'No phone numbers in emergencyContacts.json' }

    const cleanMsg = (message || '[NDMA SIKKIM ALERT] Severe Landslide Warning. Avoid transit. Helpline: 1070.').slice(0, 160)
    const numbersCsv = numbersList.join(';') // ';' for iOS/Android multi-recipient or ','
    const encodedBody = encodeURIComponent(cleanMsg)

    // Standard cross-platform mobile SMS intent URI
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const smsUri = isIOS
      ? `sms:/open?addresses=${numbersList.join(',')}&body=${encodedBody}`
      : `sms:${numbersList.join(',')}?body=${encodedBody}`

    // Trigger device native SMS intent
    window.open(smsUri, '_self')

    return {
      success: true,
      provider: 'Native Phone SIM (Direct Carrier Network)',
      deliveredTo: numbersList,
      messageId: `SIM-${Date.now()}`
    }
  },

  // 2. Local Android Phone Gateway Dispatch (Automated background via local phone HTTP)
  sendViaLocalGateway: async ({ message, gatewayUrl }) => {
    const numbersList = emergencyContacts
      .map((c) => c.phone.replace(/\D/g, '').slice(-10))
      .filter((n) => n.length === 10)

    if (!gatewayUrl) {
      return { success: false, error: 'Local Phone Gateway URL is required (e.g. http://192.168.1.15:8080)' }
    }

    const cleanMsg = (message || '[NDMA SIKKIM ALERT] Severe Landslide Warning. Avoid transit. Helpline: 1070.').slice(0, 160)

    try {
      const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: numbersList,
          message: cleanMsg
        })
      })

      if (res.ok) {
        return {
          success: true,
          provider: 'Local Android SIM Gateway',
          deliveredTo: numbersList,
          messageId: `GATEWAY-${Date.now()}`
        }
      } else {
        return { success: false, error: `Local Gateway returned HTTP ${res.status}` }
      }
    } catch (e) {
      return { success: false, error: `Could not reach Local Phone Gateway: ${e.message}` }
    }
  }
}

export default smsService
