// ============================================================
// LocalSetu — useCurrentLocation hook
// Watches GPS position, reverse-geocodes to locality name.
// Only re-geocodes when user moves > 300 metres.
// Uses low-accuracy mode (network-based) to avoid battery drain.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { reverseGeocode, distanceMeters } from '../lib/geocode'

const REGEOCODE_THRESHOLD_M = 300 // re-geocode if moved > 300m
const WATCH_OPTIONS = {
  enableHighAccuracy: false,  // network-based (fast, low battery)
  timeout: 15000,
  maximumAge: 60000           // accept cached position up to 1 min old
}

export function useCurrentLocation() {
  const [locality, setLocality]   = useState(null)
  const [coords, setCoords]       = useState(null)
  const [status, setStatus]       = useState('idle') // idle | loading | granted | denied | error
  const [error, setError]         = useState(null)

  const lastCoordsRef = useRef(null)
  const watchIdRef    = useRef(null)

  const geocodePosition = useCallback(async (lat, lng) => {
    // Skip if we haven't moved significantly
    if (lastCoordsRef.current) {
      const moved = distanceMeters(
        lastCoordsRef.current.lat, lastCoordsRef.current.lng, lat, lng
      )
      if (moved < REGEOCODE_THRESHOLD_M) {
        setCoords({ lat, lng })
        return
      }
    }

    lastCoordsRef.current = { lat, lng }
    setCoords({ lat, lng })

    try {
      const name = await reverseGeocode(lat, lng)
      setLocality(name)
      setStatus('granted')
      setError(null)
    } catch (e) {
      // Keep old locality, just log
      console.warn('LocalSetu: geocode error', e)
    }
  }, [])

  const startWatching = useCallback(() => {
    if (!navigator?.geolocation) {
      setStatus('error')
      setError('Location not supported in this browser.')
      return
    }

    setStatus('loading')
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        geocodePosition(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        if (err.code === 1) {
          setStatus('denied')
          setError('Location permission denied. Enable it in browser settings.')
        } else {
          setStatus('error')
          setError('Could not detect location.')
        }
      },
      WATCH_OPTIONS
    )
  }, [geocodePosition])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const requestLocation = useCallback(() => {
    stopWatching()
    startWatching()
  }, [startWatching, stopWatching])

  // Start watching on mount, stop on unmount
  useEffect(() => {
    startWatching()
    return stopWatching
  }, [startWatching, stopWatching])

  return { locality, coords, status, error, requestLocation }
}
