import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Gauge, RadioTower } from 'lucide-react'
import Header from './components/Header'
import CitizenSection from './components/CitizenSection'
import OfficialSection from './components/OfficialSection'
import AnalystSection from './components/AnalystSection'
import CitizenReportModal from './components/CitizenReportModal'
import SmsBroadcastModal from './components/SmsBroadcastModal'
import LoadingScreen from './components/LoadingScreen'
import { SimulationProvider } from './contexts/SimulationContext'
import api from './services/api'
import reportService from './services/reports'

export default function App() {
  const [activeSection, setActiveSection] = useState('citizen') // 'citizen' | 'official' | 'analyst'
  const [selectedDistrict, setSelectedDistrict] = useState('ALL')
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [citizenReports, setCitizenReports] = useState(() => reportService.getInitialReports())
  
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [broadcastAlertData, setBroadcastAlertData] = useState(null)

  useEffect(() => {
    // Ensure smooth initial splash display
    const splashTimer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    const fetchData = () => {
      api.getDashboard().then((dashboard) => {
        setData(dashboard)
        if (!selectedCell && dashboard.riskCells && dashboard.riskCells.length > 0) {
          setSelectedCell(dashboard.riskCells[0])
        }
      })
    }

    const fetchReports = () => {
      reportService.getReports().then((reps) => {
        if (reps && reps.length > 0) {
          setCitizenReports(reps)
        }
      })
    }

    fetchData()
    fetchReports()

    // Auto-refresh telemetry & reports
    const interval = setInterval(fetchData, 60000)
    const reportInterval = setInterval(fetchReports, 4000)

    return () => {
      clearTimeout(splashTimer)
      clearInterval(interval)
      clearInterval(reportInterval)
    }
  }, [selectedCell])

  const handleOpenBroadcastModal = (alert) => {
    setBroadcastAlertData(alert || data?.alerts?.[0])
    setBroadcastModalOpen(true)
  }

  const handleViewAlertLocation = (cellId) => {
    const cell = data?.riskCells?.find((c) => c.cell_id === cellId)
    if (cell) {
      setSelectedCell(cell)
    }
    const mapElement = document.getElementById('risk-map')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (loading || !data) {
    return <LoadingScreen />
  }

  return (
    <SimulationProvider>
    <div className="gov-app-root">
      {/* 1. Global Consistent Header with IST Clock & 3-Section Switcher */}
      <Header
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        meta={data.meta}
      />

      {/* 2. Main Body Container with Selected Section */}
      <main className="dashboard-container">
        {/* Render 1: Citizen Section */}
        {activeSection === 'citizen' && (
          <CitizenSection
            data={data}
            selectedDistrict={selectedDistrict}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}

        {/* Render 2: Official Section */}
        {activeSection === 'official' && (
          <OfficialSection
            data={data}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            citizenReports={citizenReports}
            onOpenBroadcastModal={handleOpenBroadcastModal}
            onViewAlertLocation={handleViewAlertLocation}
            selectedDistrict={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
          />
        )}

        {/* Render 3: Analyst & Scientist Section */}
        {activeSection === 'analyst' && (
          <AnalystSection
            data={data}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            selectedDistrict={selectedDistrict}
          />
        )}
      </main>

      {/* Citizen Report Modal */}
      <CitizenReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onReportSubmitted={(newRep) => {
          setCitizenReports((prev) => [newRep, ...prev])
        }}
      />

      {/* Emergency SMS Broadcast Modal */}
      {broadcastModalOpen && (
        <SmsBroadcastModal
          activeAlert={broadcastAlertData}
          onClose={() => setBroadcastModalOpen(false)}
        />
      )}
    </div>
    </SimulationProvider>
  )
}
