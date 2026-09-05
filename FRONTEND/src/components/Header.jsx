import React, { useState, useEffect } from 'react'
import {
  Languages,
  MapPin,
  Users,
  Building2,
  FlaskConical,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import DynamicText from './DynamicText'

export default function Header({
  activeSection = 'official', // 'citizen' | 'official' | 'analyst'
  onSectionChange,
  selectedDistrict = 'ALL',
  onDistrictChange,
  meta = {},
}) {
  const { language, setLanguage } = useLanguage()
  const [istTime, setIstTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      setIstTime(`${dateStr} · ${timeStr} IST`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* 1. Top Government Authority Strip */}
      <div className="gov-top-strip">
        <div className="gov-top-strip__left">
          <span className="gov-emblem-badge"><DynamicText text="GOVT OF INDIA" /></span>
          <span><DynamicText text="Ministry of Development of North Eastern Region (MDoNER) &amp; NDMA" /></span>
        </div>
        <div className="gov-top-strip__right">
          <span style={{ color: '#fef08a', fontWeight: 600 }}>
            <DynamicText text="🚨 24/7 National Disaster Helpline: 112 / 1070" />
          </span>
          <div className="live-time-indicator">
            <span className="live-pulse-dot" />
            <span>{istTime || '28 Aug 2026, 12:00:00 PM IST'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Brand Header */}
      <header className="main-header">
        <div className="brand-container">
          <div className="brand-shield-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="BHUMI Logo" style={{ height: '60px', objectFit: 'contain', borderRadius: '6px', background: '#fff' }} />
          </div>
          <div className="brand-titles">
            <span className="brand-agency-label">
              <DynamicText text="NATIONAL DISASTER RISK REDUCTION PLATFORM · NER PILOT" />
            </span>
            <h1 className="brand-main-title">
              <DynamicText text="BHUMI · Boundary Hazard & Unstable terrain Monitoring Intelligence" />
            </h1>
            <p className="brand-sub-title">
              <DynamicText text="AI-Based Landslide Early Warning &amp; Risk Monitoring System" />
            </p>
          </div>
        </div>

        <div className="header-quick-controls">
          {/* District Quick Filter */}
          <div className="control-select-group">
            <MapPin size={14} style={{ color: 'var(--gov-navy)' }} />
            <span><DynamicText text="District:" /></span>
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange && onDistrictChange(e.target.value)}
              aria-label="Select Target District"
            >
              <option value="ALL"><DynamicText text="All NER Districts (Sikkim Corridor)" /></option>
              <option value="Mangan"><DynamicText text="Mangan (North Sikkim)" /></option>
              <option value="Gangtok"><DynamicText text="Gangtok (East Sikkim)" /></option>
              <option value="Namchi"><DynamicText text="Namchi (South Sikkim)" /></option>
              <option value="Gyalshing"><DynamicText text="Gyalshing (West Sikkim)" /></option>
              <option value="Pakyong"><DynamicText text="Pakyong District" /></option>
              <option value="Soreng"><DynamicText text="Soreng District" /></option>
            </select>
          </div>

          {/* Language Switcher */}
          <div className="control-select-group">
            <Languages size={14} style={{ color: 'var(--gov-navy)' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select Interface Language"
            >
              <option value="en">English (Official)</option>
              <option value="ne">नेपाली (Nepali)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </header>

      {/* 3. Section Switcher Bar (Citizen / Official / Analyst) */}
      <nav className="section-nav-container" aria-label="Portal section navigation">
        <div className="section-tabs">
          <button
            type="button"
            className={`section-tab-btn ${activeSection === 'citizen' ? 'is-active' : ''}`}
            onClick={() => onSectionChange('citizen')}
          >
            <Users size={16} /> <DynamicText text="1. Citizen Section" />
          </button>
          <button
            type="button"
            className={`section-tab-btn ${activeSection === 'official' ? 'is-active' : ''}`}
            onClick={() => onSectionChange('official')}
          >
            <Building2 size={16} /> <DynamicText text="2. Official Section" />
          </button>
          <button
            type="button"
            className={`section-tab-btn ${activeSection === 'analyst' ? 'is-active' : ''}`}
            onClick={() => onSectionChange('analyst')}
          >
            <FlaskConical size={16} /> <DynamicText text="3. Analyst / Scientist Section" />
          </button>
        </div>

        <div className="section-nav-right">
          <span className="active-section-tag">
            {activeSection === 'citizen' && <DynamicText text="PUBLIC ADVISORY & REPORTING PORTAL" />}
            {activeSection === 'official' && <DynamicText text="AUTHORITY DISASTER COMMAND DESK" />}
            {activeSection === 'analyst' && <DynamicText text="SCIENTIFIC TELEMETRY & ML STUDIO" />}
          </span>
        </div>
      </nav>
    </>
  )
}
