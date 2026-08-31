import React from 'react'

export default function LoadingScreen({ statusText = "Initializing System" }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Prominent Centered Logo */}
        <div style={{ marginBottom: '28px' }}>
          <img
            src="/logo.png"
            alt="BHUMI Logo"
            style={{
              height: '140px',
              maxWidth: '280px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Title & Subtitle */}
        <h1 style={{
          color: '#0B1C2C',
          fontSize: '32px',
          fontWeight: '800',
          margin: '0 0 6px 0',
          letterSpacing: '-0.01em',
          lineHeight: '1.2'
        }}>
          BHUMI
        </h1>

        <p style={{
          color: '#3A4A5A',
          fontSize: '15px',
          fontWeight: '600',
          margin: '0 0 40px 0',
          letterSpacing: '0.01em',
          lineHeight: '1.4'
        }}>
           Boundary Hazard & Unstable terrain Monitoring Intelligence
        </p>

        {/* Simple & Elegant Loading Indicator */}
        <div style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px'
        }}>
          {/* Subtle Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#E4E7EC',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div className="gov-loading-progress-bar" />
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {statusText}
          </span>
        </div>

        {/* Subtle Government Footer Note */}
        <div style={{
          marginTop: '64px',
          paddingTop: '16px',
          borderTop: '1px solid #F1F5F9',
          fontSize: '11px',
          color: '#94A3B8',
          fontWeight: '500',
          letterSpacing: '0.02em',
          width: '100%',
          maxWidth: '400px'
        }}>
          National Disaster Risk Infrastructure &bull; MDoNER &amp; NDMA Sikkim Pilot
        </div>
      </div>
    </div>
  )
}
