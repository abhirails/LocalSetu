import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useApp } from "../context/AppContext"

const SECTOR_ORDER = [
  'Sector 7', 'Sector 10', 'Sector 12', 'Sector 20', 'Sector 35'
]

export default function SocietyListScreen() {
  const { state, helpers } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const societies = state.societies || []

  const filtered = societies.filter(s => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q) ||
      (s.landmark || '').toLowerCase().includes(q)
    )
  })

  // Group by sector
  const grouped = filtered.reduce((acc, s) => {
    const key = s.sector || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const sectorKeys = Object.keys(grouped).sort((a, b) => {
    const ia = SECTOR_ORDER.indexOf(a)
    const ib = SECTOR_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--text)', padding: 0, lineHeight: 1 }}
          >
            ←
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              Societies
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
              Kharghar • {societies.length} registered
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: 'var(--text-light)'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or sector…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px 9px 32px',
              border: '1px solid var(--border)',
              borderRadius: 10, background: 'var(--card-bg)',
              color: 'var(--text)', fontSize: 14, outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        margin: '12px 16px 0',
        padding: '10px 14px',
        background: 'rgba(var(--primary-rgb, 255,107,53), 0.07)',
        borderRadius: 10,
        fontSize: 12.5,
        color: 'var(--text-light)',
        lineHeight: 1.4
      }}>
        🏢 Society pages show official notices and events posted by your building secretary.
        Tap a society to follow its updates.
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sectorKeys.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏘️</div>
            <p style={{ margin: 0, fontSize: 14 }}>No societies found</p>
            {search && (
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                Try a different search term
              </p>
            )}
          </div>
        )}

        {sectorKeys.map(sector => (
          <div key={sector}>
            <p style={{
              margin: '0 0 8px',
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--text-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {sector}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grouped[sector].map(society => (
                <SocietyCard
                  key={society.id}
                  society={society}
                  societyPosts={state.societyPosts || []}
                  onClick={() => navigate(`/society/${society.id}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SocietyCard({ society, societyPosts, onClick }) {
  const activePosts = societyPosts.filter(
    p => p.societyId === society.id && p.status === 'active'
  )
  const noticeCount = activePosts.filter(p => p.type === 'notice').length
  const eventCount  = activePosts.filter(p => p.type === 'event').length

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      {/* Name + verified */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {society.name}
            </span>
            {society.isVerified && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: '#22c55e20', color: '#16a34a',
                padding: '2px 7px', borderRadius: 20,
                border: '1px solid #22c55e40'
              }}>
                ✓ Verified
              </span>
            )}
          </div>
          {society.landmark && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-light)' }}>
              📍 {society.landmark}
            </p>
          )}
        </div>
        <span style={{ fontSize: 16, color: 'var(--text-light)', flexShrink: 0 }}>›</span>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {society.totalFlats && (
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
            🏠 {society.totalFlats} flats
          </span>
        )}
        {noticeCount > 0 && (
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            background: 'rgba(234,179,8,0.12)', color: '#a16207',
            padding: '2px 8px', borderRadius: 20
          }}>
            {noticeCount} notice{noticeCount !== 1 ? 's' : ''}
          </span>
        )}
        {eventCount > 0 && (
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            background: 'rgba(99,102,241,0.12)', color: '#4338ca',
            padding: '2px 8px', borderRadius: 20
          }}>
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        )}
        {noticeCount === 0 && eventCount === 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>No active updates</span>
        )}
      </div>

      {/* Description snippet */}
      {society.description && (
        <p style={{
          margin: 0, fontSize: 12.5, color: 'var(--text-light)',
          lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {society.description}
        </p>
      )}
    </div>
  )
}
