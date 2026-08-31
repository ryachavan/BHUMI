import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const SimulationContext = createContext(null)

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}

/**
 * Web Audio API — two-tone beep pattern (880 Hz, 200ms on / 200ms off, repeats every 1.5s).
 * Not a copy of any specific real alert sound. Starts only on user gesture.
 */
function createAlertAudio() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  let intervalId = null
  let timeoutIds = []

  const playBeepPair = () => {
    // First beep
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'square'
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain1.gain.setValueAtTime(0.18, audioCtx.currentTime)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start(audioCtx.currentTime)
    osc1.stop(audioCtx.currentTime + 0.2)

    // Second beep after 400ms gap
    const t = setTimeout(() => {
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(660, audioCtx.currentTime)
      gain2.gain.setValueAtTime(0.18, audioCtx.currentTime)
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start(audioCtx.currentTime)
      osc2.stop(audioCtx.currentTime + 0.2)
    }, 400)
    timeoutIds.push(t)
  }

  const start = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    playBeepPair()
    intervalId = setInterval(playBeepPair, 1500)
  }

  const stop = () => {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    timeoutIds.forEach(clearTimeout)
    timeoutIds = []
    audioCtx.close().catch(() => {})
  }

  return { start, stop }
}

const AUTO_STOP_MS = 30000
const TITLE_FLASH_INTERVAL = 800

export function SimulationProvider({ children }) {
  const [simulationActive, setSimulationActive] = useState(false)
  const [simulationEvent, setSimulationEvent] = useState(null)
  const [alertDismissed, setAlertDismissed] = useState(false)

  const audioRef = useRef(null)
  const autoStopTimerRef = useRef(null)
  const titleFlashRef = useRef(null)
  const originalTitleRef = useRef(document.title)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.stop()
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)
      if (titleFlashRef.current) clearInterval(titleFlashRef.current)
      document.title = originalTitleRef.current
    }
  }, [])

  const stopAudioAndTitle = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.stop()
      audioRef.current = null
    }
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current)
      titleFlashRef.current = null
    }
    document.title = originalTitleRef.current
  }, [])

  const startSimulation = useCallback((event) => {
    // Reset any existing simulation
    stopAudioAndTitle()
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)

    setSimulationEvent(event)
    setSimulationActive(true)
    setAlertDismissed(false)

    // Start audio (triggered by user click — satisfies autoplay policy)
    const audio = createAlertAudio()
    audio.start()
    audioRef.current = audio

    // Tab title flash
    originalTitleRef.current = document.title
    let flash = false
    titleFlashRef.current = setInterval(() => {
      document.title = flash ? '⚠ SIMULATION ACTIVE' : originalTitleRef.current
      flash = !flash
    }, TITLE_FLASH_INTERVAL)

    // 30s auto-stop
    autoStopTimerRef.current = setTimeout(() => {
      stopAudioAndTitle()
      setAlertDismissed(true)
    }, AUTO_STOP_MS)
  }, [stopAudioAndTitle])

  const acknowledgeAlert = useCallback(() => {
    stopAudioAndTitle()
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)
    setAlertDismissed(true)
  }, [stopAudioAndTitle])

  const stopSimulation = useCallback(() => {
    stopAudioAndTitle()
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)
    setSimulationActive(false)
    setSimulationEvent(null)
    setAlertDismissed(false)
  }, [stopAudioAndTitle])

  const value = {
    simulationActive,
    simulationEvent,
    alertDismissed,
    startSimulation,
    acknowledgeAlert,
    stopSimulation,
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

export default SimulationContext
