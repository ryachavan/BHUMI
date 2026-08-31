import React, { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, MapPin, AlertTriangle, Eye, Clock, Image as ImageIcon, Camera } from 'lucide-react'
import reportService, { DEFAULT_REPORTS } from '../services/reports'

export default function ReportVerificationPanel({ reports, onStatusChange }) {
  const [reportList, setReportList] = useState(() => (Array.isArray(reports) ? reports : reportService.getInitialReports()))
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    if (Array.isArray(reports)) {
      setReportList(reports)
    }
  }, [reports])

  const handleAction = async (id, newStatus) => {
    const updated = await reportService.updateStatus(id, newStatus)
    if (Array.isArray(updated)) {
      setReportList(updated)
      if (onStatusChange) onStatusChange(updated)
    }
  }

  const safeList = Array.isArray(reportList) ? reportList : DEFAULT_REPORTS
  const pendingCount = safeList.filter((r) => r && r.status === 'PENDING_VERIFICATION').length

  return (
    <section className="panel" style={{ borderLeft: '4px solid #c7353f' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} style={{ color: '#c7353f' }} />
          <h2>Citizen Incident Verification Queue (Admin Authority)</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.72rem',
            background: 'rgba(38, 208, 206, 0.15)',
            border: '1px solid #26d0ce',
            color: '#26d0ce',
            padding: '3px 8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 600
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#26d0ce', display: 'inline-block' }} />
            Firebase Realtime Cloud Sync Active
          </span>
          <span className="badge" style={{ background: '#c7353f', color: '#fff' }}>
            {pendingCount} Pending Verification
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#cad5e2', margin: '0.35rem 0 1rem 0' }}>
        Review crowd-sourced ground observations submitted via mobile devices &amp; citizen reporting. Verified reports update the operational risk map and dispatch real-time alerts to Border Roads Organisation (BRO) and SDRF.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {safeList.map((report) => {
          if (!report) return null
          const isPending = report.status === 'PENDING_VERIFICATION'
          const isVerified = report.status === 'VERIFIED'
          const isDismissed = report.status === 'DISMISSED'

          return (
            <div
              key={report.id}
              style={{
                background: isVerified ? 'rgba(39, 134, 95, 0.12)' : isDismissed ? 'rgba(255,255,255,0.02)' : 'rgba(199, 53, 63, 0.08)',
                border: `1.5px solid ${isVerified ? '#27865f' : isDismissed ? 'rgba(255,255,255,0.1)' : 'rgba(199, 53, 63, 0.3)'}`,
                borderRadius: '8px',
                padding: '0.9rem 1.1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#fff' }}>
                      {report.id} · {report.location}
                    </strong>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: report.severity === 'SEVERE' ? '#c7353f' : '#e16713',
                      color: '#fff'
                    }}>
                      {report.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{report.timestamp}</span>
                    <span>• Reporter: <strong>{report.reportedBy}</strong></span>
                    <span>• GPS: <code>{report.coords}</code></span>
                  </div>
                </div>

                {/* Status Indicator Badge */}
                <div>
                  {isVerified && (
                    <span style={{ fontSize: '0.75rem', color: '#74e0b1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(39, 134, 95, 0.25)', padding: '3px 8px', borderRadius: '4px' }}>
                      <CheckCircle2 size={15} /> Verified by SDMA (Alert Broadcasted)
                    </span>
                  )}
                  {isDismissed && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px' }}>
                      <XCircle size={15} /> Dismissed (False Alarm)
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Photo Thumbnail Layout */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '0.6rem' }}>
                {report.photoUrl && (
                  <img
                    src={report.photoUrl}
                    alt="Citizen Evidence"
                    onClick={() => setSelectedPhoto(report.photoUrl)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1.5px solid #26d0ce',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Click to expand camera photo"
                  />
                )}
                <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: 0, fontStyle: 'italic', flex: 1, lineHeight: 1.4 }}>
                  "{report.description}"
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                  <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Traffic Impact: <strong>{report.roadBlocked}</strong>
                </span>

                {isPending && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleAction(report.id, 'DISMISSED')}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#cad5e2',
                        fontSize: '0.75rem',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(report.id, 'VERIFIED')}
                      style={{
                        background: '#27865f',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '5px 14px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <CheckCircle2 size={14} /> Verify &amp; Alert BRO
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Expanded Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={selectedPhoto}
            alt="Expanded Evidence"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', border: '2px solid #26d0ce' }}
          />
        </div>
      )}
    </section>
  )
}
