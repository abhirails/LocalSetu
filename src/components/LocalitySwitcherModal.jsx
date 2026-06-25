// ============================================================
// LocalSetu — LocalitySwitcherModal
// Bottom sheet for switching between Home / GPS / Saved localities.
// Users can pin up to 2 extra localities and switch the active feed.
// ============================================================

import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

import { ALL_LOCALITIES as ALL_LOCALITY_DATA } from '../data/locationData'
// Flat list of locality name strings for the switcher
const LOCALITY_NAMES = ALL_LOCALITY_DATA.map(l => l.name || l.label || l)

export default function LocalitySwitcherModal({ onClose }) {
  const { state, actions } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const cu = state.currentUser
  const homeLocality = cu?.locality || 'your area'
  const activeLocality = state.activeLocality   // null = Home
  const savedLocalities = state.savedLocalities || []
  const liveLocality = state.liveLocality

  const isActive = (loc) => {
    if (loc === '__home__') return activeLocality === null
    if (loc === '__gps__') return activeLocality === '__gps__'
    return activeLocality === loc
  }

  const handleSelect = (loc) => {
    if (loc === '__home__') {
      actions.setActiveLocality(null)
    } else {
      actions.setActiveLocality(loc)
    }
    onClose()
  }

  const handleAdd = (loc) => {
    actions.addSavedLocality(loc)
    setShowAdd(false)
    setSearchQ('')
  }

  const filteredLocalities = LOCALITY_NAMES.filter(l =>
    l.toLowerCase().includes(searchQ.toLowerCase()) &&
    l !== homeLocality &&
    !savedLocalities.includes(l)
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <div className="modal-title" style={{ marginBottom: 4 }}>Your Localities</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, marginTop: 0 }}>
          Switch feed to show posts from a different area.
        </p>

        {/* Home locality */}
        <LocalityRow
          icon="🏠"
          label={homeLocality}
          sublabel="Home (permanent)"
          active={isActive('__home__')}
          onSelect={() => handleSelect('__home__')}
        />

        {/* GPS locality */}
        {liveLocality && liveLocality !== homeLocality && (
          <LocalityRow
            icon="📍"
            label={liveLocality}
            sublabel="Current GPS location"
            active={isActive('__gps__')}
            onSelect={() => handleSelect('__gps__')}
          />
        )}
        {!liveLocality && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 6, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1.5px dashed var(--border-light)' }}>
            <span style={{ fontSize: 22 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>GPS not detected yet</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enable location in browser to use this</div>
            </div>
          </div>
        )}

        {/* Saved localities */}
        {savedLocalities.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
              Pinned Localities
            </div>
            {savedLocalities.map(loc => (
              <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <LocalityRow
                    icon="📌"
                    label={loc}
                    sublabel="Pinned locality"
                    active={isActive(loc)}
                    onSelect={() => handleSelect(loc)}
                  />
                </div>
                <button
                  onClick={() => actions.removeSavedLocality(loc)}
                  style={{ fontSize: 18, color: 'var(--text-muted)', padding: '4px 8px', flexShrink: 0 }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new locality */}
        {savedLocalities.length < 2 && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '10px', marginTop: 8, border: '1.5px dashed var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontSize: 13, fontWeight: 700, background: 'var(--primary-light)' }}
          >
            + Add locality ({2 - savedLocalities.length} slot{2 - savedLocalities.length !== 1 ? 's' : ''} left)
          </button>
        )}

        {savedLocalities.length >= 2 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, padding: '8px' }}>
            Max 2 pinned localities. Remove one to add another.
          </div>
        )}

        {/* Locality picker */}
        {showAdd && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
              Pin a locality
            </div>
            <input
              className="form-input"
              placeholder="Search locality..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              autoFocus
              style={{ marginBottom: 8 }}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {filteredLocalities.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                  No localities found
                </div>
              )}
              {filteredLocalities.map(loc => (
                <button
                  key={loc}
                  onClick={() => handleAdd(loc)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 14, borderRadius: 'var(--radius-sm)', marginBottom: 4, background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowAdd(false); setSearchQ('') }}
              style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', width: '100%', padding: 8 }}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Your exact GPS coordinates are never stored or shown. Only the locality name is used.
        </div>
      </div>
    </div>
  )
}

function LocalityRow({ icon, label, sublabel, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 6,
        borderRadius: 'var(--radius-sm)',
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
        background: active ? 'var(--primary-light)' : 'var(--card)',
        transition: 'all 0.15s',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--text-primary)' }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sublabel}</div>
      </div>
      {active && (
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>✓</span>
        </div>
      )}
    </button>
  )
}
