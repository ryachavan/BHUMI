import React, { useState, useEffect } from 'react'
import { Camera, CheckCircle2, MapPin, X, Navigation } from 'lucide-react'
import reportService from '../services/reports'

export default function CitizenReportModal({ open, onClose, onReportSubmitted }) {
  const [submitted, setSubmitted] = useState(false)
  const [lastReportId, setLastReportId] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState('')
  const [description, setDescription] = useState('')
  const [roadBlocked, setRoadBlocked] = useState('no')
  const [reporterName, setReporterName] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitted(false)
      setLocation('')
      setCoords('')
      setDescription('')
      setRoadBlocked('no')
      setReporterName('')
      setPhotoPreview(null)
    }
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  // 1. Live GPS Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4)
        const lon = pos.coords.longitude.toFixed(4)
        const gpsStr = `${lat}°N, ${lon}°E`
        setCoords(gpsStr)
        if (!location) {
          setLocation(`Live GPS: ${gpsStr} (Sikkim Corridor)`)
        }
        setLocating(false)
      },
      (err) => {
        console.warn('GPS lookup error:', err)
        setCoords('27.3389°N, 88.6065°E')
        if (!location) setLocation('Gangtok - Singtam Corridor (NH-10)')
        setLocating(false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // 2. Photo capture & compression
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxDim = 600
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.65)
          setPhotoPreview(compressed)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  // 3. Persistent Submit Handler
  const submitReport = async (e) => {
    e.preventDefault()
    const reportData = {
      location: location || 'NH-10 Corridor, Sikkim',
      coords: coords || '27.3389°N, 88.6065°E',
      reportedBy: reporterName ? `${reporterName} (Citizen)` : 'Citizen Field Report',
      description,
      roadBlocked: roadBlocked === 'yes' ? 'yes' : 'no',
      photoUrl: photoPreview,
    }

    const saved = await reportService.addReport(reportData)
    setLastReportId(saved?.id || 'CR-NEW')
    if (onReportSubmitted) onReportSubmitted(saved)
    setSubmitted(true)
  }

  return (
    <div
      className="gov-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gov-modal-dialog" role="dialog" aria-modal="true">
        <div className="gov-modal-header">
          <h3>Ground Landslide &amp; Road Obstruction Report</h3>
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
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--status-safe)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--gov-navy)', margin: '0 0 6px' }}>
                Incident Report {lastReportId} Recorded
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--gov-slate-700)', lineHeight: 1.5, margin: '0 0 16px' }}>
                Your ground observation has been logged into the central disaster database and queued for District Disaster Operation Center (DEOC) verification.
              </p>
              <div style={{ background: 'var(--status-safe-bg)', border: '1px solid var(--status-safe-border)', padding: '10px', borderRadius: '4px', fontSize: '12px', color: 'var(--status-safe)', fontWeight: 600, marginBottom: '16px' }}>
                STATUS: PENDING FIELD VERIFICATION · SDMA / BRO alerted
              </div>
              <button
                type="button"
                className="gov-btn gov-btn-primary"
                style={{ padding: '8px 24px' }}
                onClick={onClose}
              >
                Return to Portal
              </button>
            </div>
          ) : (
            <form onSubmit={submitReport}>
              <p style={{ fontSize: '12px', color: 'var(--gov-slate-600)', margin: '0 0 14px', lineHeight: 1.4 }}>
                Provide exact location details and photo evidence of hillside fissures, debris flow, or blocked road corridors. Do not endanger your personal safety.
              </p>

              <div className="gov-form-group">
                <label>Reporter Name / Contact Number (Optional)</label>
                <input
                  type="text"
                  className="gov-input"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Tenzing Lepcha (Mangan Ward 4)"
                />
              </div>

              <div className="gov-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>Incident Location / Landmark *</label>
                  <button
                    type="button"
                    className="gov-btn gov-btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '10px' }}
                    onClick={handleDetectLocation}
                  >
                    <Navigation size={12} /> {locating ? 'Detecting GPS...' : 'Auto-Detect GPS'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="gov-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. NH-10 near Rangpo bridge / Singtam bypass"
                />
                {coords && (
                  <div style={{ fontSize: '11px', color: 'var(--gov-navy)', fontWeight: 600, marginTop: '3px' }}>
                    📍 GPS Coordinates: {coords}
                  </div>
                )}
              </div>

              <div className="gov-form-group">
                <label>Observed Road Traffic Status *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', border: 'var(--border-default)', padding: '6px 8px', borderRadius: '4px', background: roadBlocked === 'no' ? 'var(--gov-slate-100)' : '#fff' }}>
                    <input
                      type="radio"
                      name="roadBlocked"
                      value="no"
                      checked={roadBlocked === 'no'}
                      onChange={() => setRoadBlocked('no')}
                    />
                    Road Open
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', border: 'var(--border-default)', padding: '6px 8px', borderRadius: '4px', background: roadBlocked === 'partial' ? 'var(--status-moderate-bg)' : '#fff' }}>
                    <input
                      type="radio"
                      name="roadBlocked"
                      value="partial"
                      checked={roadBlocked === 'partial'}
                      onChange={() => setRoadBlocked('partial')}
                    />
                    Single Lane
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', border: 'var(--border-default)', padding: '6px 8px', borderRadius: '4px', background: roadBlocked === 'yes' ? 'var(--status-critical-bg)' : '#fff' }}>
                    <input
                      type="radio"
                      name="roadBlocked"
                      value="yes"
                      checked={roadBlocked === 'yes'}
                      onChange={() => setRoadBlocked('yes')}
                    />
                    Fully Blocked
                  </label>
                </div>
              </div>

              <div className="gov-form-group">
                <label>Description of Ground Movement / Cracks *</label>
                <textarea
                  required
                  className="gov-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe slope movement, crack width, falling boulders, or water seepage..."
                />
              </div>

              <div className="gov-form-group">
                <label>Attach Photo Evidence (Mobile Camera / Gallery)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label
                    className="gov-btn gov-btn-secondary"
                    style={{ padding: '8px 14px', cursor: 'pointer' }}
                  >
                    <Camera size={15} /> Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoCapture}
                    />
                  </label>
                  {photoPreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={photoPreview}
                        alt="Evidence Preview"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ccc' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--status-safe)', fontWeight: 700 }}>✓ Attached</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="gov-btn gov-btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn gov-btn-primary"
                  style={{ padding: '8px 20px' }}
                >
                  Submit Official Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
