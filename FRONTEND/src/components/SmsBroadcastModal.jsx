import React, { useState, useEffect } from 'react'
import { RadioTower, Send, X, ShieldAlert, CheckCircle2, FileCode, Smartphone, Tv, MessageSquare, Flame, Zap, Usb, RefreshCw } from 'lucide-react'
import alertDispatchService, { TARGET_CORRIDORS, generateCapXml } from '../services/alertDispatchService'
import adbSmsService from '../services/adbSmsService'

export default function SmsBroadcastModal({ onClose, activeAlert }) {
  const [selectedCorridorId, setSelectedCorridorId] = useState(TARGET_CORRIDORS[0].id)
  const [severity, setSeverity] = useState('Severe')
  const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'capXml' | 'dispatched'
  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState(null)
  const [realSmsResult, setRealSmsResult] = useState(null)
  const [langTab, setLangTab] = useState('en') // 'en' | 'ne' | 'hi'

  const [adbStatus, setAdbStatus] = useState({ connected: false, loading: true })

  const checkAdb = async () => {
    setAdbStatus({ loading: true })
    const res = await adbSmsService.checkStatus()
    setAdbStatus({ ...res, loading: false })
  }

  useEffect(() => {
    checkAdb()
    const interval = setInterval(checkAdb, 4000)
    return () => clearInterval(interval)
  }, [])

  const currentCorridor = TARGET_CORRIDORS.find(c => c.id === selectedCorridorId) || TARGET_CORRIDORS[0]

  const capPayload = alertDispatchService.createCapAlert({
    corridor: currentCorridor,
    severity,
    headline: activeAlert?.headline || `${currentCorridor.name.toUpperCase()} - SEVERE LANDSLIDE WARNING`,
    description: activeAlert?.message || `Extreme rainfall (>140mm) and SMAP saturation (>85%) have destabilized slope cuts. Immediate road transit suspension advised.`
  })

  const capXml = generateCapXml(capPayload)
  const selectedInfo = langTab === 'ne' ? capPayload.info[1] : langTab === 'hi' ? capPayload.info[2] : capPayload.info[0]

  const handleDispatch = async () => {
    setIsDispatching(true)

    // 1. Government CAP Simulation Dispatch
    const capResult = await alertDispatchService.dispatchMultiChannelAlert(capPayload)
    setDispatchResult(capResult)

    // 2. Real Physical Mobile Dispatch through Connected Phone via ADB
    const smsMessage = `[NDMA SIKKIM ALERT] ${selectedInfo.headline}. ${selectedInfo.instruction} - Dial 1070 for emergency.`
    const smsRes = await adbSmsService.sendSmsToAll(smsMessage)
    setRealSmsResult(smsRes)

    setIsDispatching(false)
    setActiveTab('dispatched')
  }

  return (
    <div
      className="gov-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gov-modal-dialog" style={{ maxWidth: '720px' }} role="dialog" aria-modal="true">
        <div className="gov-modal-header" style={{ backgroundColor: 'var(--status-critical)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RadioTower size={18} />
            <h3 style={{ color: '#fff', margin: 0 }}>
              Multi-Agency CAP / Emergency SMS Gateway
            </h3>
          </div>
          <button
            type="button"
            className="gov-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="gov-modal-body">
          {/* Target Corridor & Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="gov-form-group" style={{ margin: 0 }}>
              <label>Target Threat Corridor</label>
              <select
                className="gov-select"
                value={selectedCorridorId}
                onChange={(e) => setSelectedCorridorId(e.target.value)}
              >
                {TARGET_CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="gov-form-group" style={{ margin: 0 }}>
              <label>Warning Urgency / CAP Severity</label>
              <select
                className="gov-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Severe">Severe / Evacuation Imminent</option>
                <option value="High">High / Caution Alert</option>
                <option value="Moderate">Moderate / Advisory</option>
              </select>
            </div>
          </div>

          {/* ADB SIM Status Indicator */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: adbStatus.connected ? 'var(--status-safe-bg)' : 'var(--status-moderate-bg)',
              border: `1px solid ${adbStatus.connected ? 'var(--status-safe-border)' : 'var(--status-moderate-border)'}`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Usb size={14} style={{ color: adbStatus.connected ? 'var(--status-safe)' : 'var(--status-moderate)' }} />
              <span>
                <strong>Hardware ADB SIM Gateway:</strong>{' '}
                {adbStatus.connected ? `Connected (${adbStatus.device})` : 'Simulated Gateway Mode Active'}
              </span>
            </div>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              style={{ padding: '2px 6px', fontSize: '10px' }}
              onClick={checkAdb}
            >
              <RefreshCw size={10} /> Check
            </button>
          </div>

          {/* Language / Preview Tab Switcher */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: 'var(--border-default)', paddingBottom: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              className={`gov-btn ${langTab === 'en' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setLangTab('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`gov-btn ${langTab === 'ne' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setLangTab('ne')}
            >
              नेपाली (Nepali)
            </button>
            <button
              type="button"
              className={`gov-btn ${langTab === 'hi' ? 'gov-btn-primary' : 'gov-btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => setLangTab('hi')}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          {/* Dispatched Result vs Preview */}
          {activeTab === 'dispatched' ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--status-safe)', margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '16px', color: 'var(--gov-navy)', margin: '0 0 6px' }}>
                Emergency Alert Successfully Dispatched
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--gov-slate-700)', margin: '0 0 14px' }}>
                Common Alerting Protocol (CAP) payload dispatched to District Police Wireless, Cell Broadcast Networks &amp; Gram Panchayat Heads.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={() => setActiveTab('preview')}
                >
                  Edit / Send Another
                </button>
                <button
                  type="button"
                  className="gov-btn gov-btn-primary"
                  onClick={onClose}
                >
                  Close Gateway
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--gov-slate-50)', padding: '12px', border: 'var(--border-default)', borderRadius: '4px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--gov-slate-500)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  SMS / Cell Broadcast Message Preview:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--status-critical)', marginBottom: '4px' }}>
                  {selectedInfo.headline}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--gov-slate-800)', margin: '0 0 8px', lineHeight: 1.4 }}>
                  {selectedInfo.description}
                </p>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gov-navy)' }}>
                  Action: {selectedInfo.instruction}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="gov-btn gov-btn-danger"
                  disabled={isDispatching}
                  onClick={handleDispatch}
                  style={{ padding: '8px 20px' }}
                >
                  <Send size={14} /> {isDispatching ? 'Transmitting...' : 'Dispatch Live Broadcast'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
