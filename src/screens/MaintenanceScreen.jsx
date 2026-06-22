import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MAINTENANCE_CATEGORIES, COMPLAINT_CATEGORIES } from '../data/demoData'

const STATUS_META = {
  open:        { label: 'Open',        color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fef3c7', icon: '🟡' },
  resolved:    { label: 'Resolved',    color: '#16a34a', bg: '#dcfce7', icon: '🟢' },
  acknowledged:{ label: 'Acknowledged',color: '#7c3aed', bg: '#ede9fe', icon: '🔵' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

// ── Add Record Modal ──────────────────────────────────────────
function AddRecordModal({ societyId, onClose, onSave }) {
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState('plumbing')
  const [desc, setDesc]         = useState('')
  const [vendor, setVendor]     = useState('')
  const [estimate, setEstimate] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      societyId,
      title:        title.trim(),
      category,
      description:  desc.trim(),
      vendorName:   vendor.trim() || null,
      costEstimate: estimate ? parseInt(estimate) : null,
    })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">🔧 New Maintenance Record</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Title (e.g. Lift not working — Tower B)"
            value={title} onChange={e => setTitle(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, background: 'var(--bg)' }}
          />
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, background: 'var(--bg)' }}
          >
            {MAINTENANCE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
          <textarea
            placeholder="Description (optional)"
            value={desc} onChange={e => setDesc(e.target.value)}
            rows={3}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, resize: 'none', background: 'var(--bg)' }}
          />
          <input
            placeholder="Vendor / contractor name (optional)"
            value={vendor} onChange={e => setVendor(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, background: 'var(--bg)' }}
          />
          <input
            type="number" placeholder="Cost estimate in ₹ (optional)"
            value={estimate} onChange={e => setEstimate(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, background: 'var(--bg)' }}
          />
        </div>
        <button
          onClick={handleSave} disabled={!title.trim() || saving}
          style={{ width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 12, background: title.trim() ? 'var(--primary)' : 'var(--border)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: title.trim() ? 'pointer' : 'not-allowed' }}
        >
          {saving ? 'Saving…' : 'Add Record'}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Maintenance Record Card ───────────────────────────────────
function RecordCard({ record, isAdmin, onStatusChange }) {
  const [expanded, setExpanded]   = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [newStatus, setNewStatus] = useState(record.status)
  const [vendor, setVendor]       = useState(record.vendorName || '')
  const [actualCost, setActualCost] = useState(record.actualCost || '')
  const s = STATUS_META[record.status] || STATUS_META.open
  const cat = MAINTENANCE_CATEGORIES.find(c => c.id === record.category)

  const handleUpdate = () => {
    onStatusChange(record.id, {
      status:     newStatus,
      vendorName: vendor || null,
      actualCost: actualCost ? parseInt(actualCost) : null,
    })
    setShowUpdate(false)
  }

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ fontSize: 22 }}>{cat?.icon || '🔧'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{record.title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 6, padding: '1px 7px' }}>{s.icon} {s.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat?.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {timeAgo(record.createdAt)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {record.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>{record.description}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            {record.vendorName && <span>🏢 {record.vendorName}</span>}
            {record.costEstimate && <span>📋 Est: ₹{record.costEstimate.toLocaleString('en-IN')}</span>}
            {record.actualCost && <span>💰 Actual: ₹{record.actualCost.toLocaleString('en-IN')}</span>}
            {record.resolvedAt && <span>✅ Resolved: {formatDate(record.resolvedAt)}</span>}
          </div>
          {isAdmin && record.status !== 'resolved' && (
            <>
              {!showUpdate ? (
                <button onClick={() => setShowUpdate(true)} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontWeight: 600 }}>
                  Update status
                </button>
              ) : (
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card-bg)' }}>
                    <option value="open">🔴 Open</option>
                    <option value="in_progress">🟡 In Progress</option>
                    <option value="resolved">🟢 Resolved</option>
                  </select>
                  <input placeholder="Vendor name" value={vendor} onChange={e => setVendor(e.target.value)} style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card-bg)' }} />
                  <input type="number" placeholder="Actual cost ₹" value={actualCost} onChange={e => setActualCost(e.target.value)} style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card-bg)' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleUpdate} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setShowUpdate(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Complaint Card ────────────────────────────────────────────
function ComplaintCard({ complaint, isAdmin, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote]         = useState(complaint.adminNote || '')
  const [saving, setSaving]     = useState(false)
  const s = STATUS_META[complaint.status] || STATUS_META.open
  const cat = COMPLAINT_CATEGORIES.find(c => c.id === complaint.category)

  const handleAck = async () => {
    setSaving(true)
    await onUpdate(complaint.id, { status: 'acknowledged', adminNote: note || null })
    setSaving(false)
    setExpanded(false)
  }
  const handleResolve = async () => {
    setSaving(true)
    await onUpdate(complaint.id, { status: 'resolved', adminNote: note || null })
    setSaving(false)
    setExpanded(false)
  }

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ fontSize: 22 }}>{cat?.icon || '📋'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{complaint.title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 6, padding: '1px 7px' }}>{s.icon} {s.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat?.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {timeAgo(complaint.createdAt)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {complaint.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>{complaint.description}</p>
          )}
          {complaint.adminNote && (
            <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: '#0369a1' }}>
              💬 Admin note: {complaint.adminNote}
            </div>
          )}
          {isAdmin && complaint.status !== 'resolved' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                placeholder="Add admin note (optional)…"
                value={note} onChange={e => setNote(e.target.value)} rows={2}
                style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 13, resize: 'none', background: 'var(--bg)' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                {complaint.status === 'open' && (
                  <button onClick={handleAck} disabled={saving} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Acknowledge
                  </button>
                )}
                <button onClick={handleResolve} disabled={saving} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Mark Resolved
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────
export default function MaintenanceScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('records')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd]   = useState(false)

  const society  = helpers.getMySociety()
  const isAdmin  = helpers.isSocietyAdmin()

  useEffect(() => {
    if (society?.id) {
      actions.loadMaintenance(society.id)
      actions.loadComplaints(society.id)
    }
  }, [society?.id])

  if (!society) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32 }}>🏢</div>
          <div style={{ fontWeight: 700, marginTop: 12 }}>No society linked</div>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
        </div>
      </div>
    )
  }

  const allRecords   = helpers.getSocietyMaintenance(society.id)
  const allComplaints = helpers.getSocietyComplaints(society.id)

  const records = statusFilter === 'all'
    ? allRecords
    : allRecords.filter(r => r.status === statusFilter)

  const openRecords    = allRecords.filter(r => r.status === 'open').length
  const inProgressRecs = allRecords.filter(r => r.status === 'in_progress').length
  const openComplaints = allComplaints.filter(c => c.status === 'open').length

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2444 100%)', padding: '16px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 16 }}>←</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Maintenance & Complaints</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{society.name} · {society.sector}</div>
          </div>
          {isAdmin && tab === 'records' && (
            <button onClick={() => setShowAdd(true)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 20, background: '#fff', color: '#1e3a5f', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Open Issues',      count: openRecords,    color: '#f87171' },
            { label: 'In Progress',      count: inProgressRecs, color: '#fbbf24' },
            { label: 'Open Complaints',  count: openComplaints, color: '#c084fc' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
          {[
            { id: 'records',    label: '🔧 Records' },
            { id: 'complaints', label: '📋 Complaints' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: tab === t.id ? 'var(--bg)' : 'rgba(255,255,255,0.08)',
              color: tab === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.75)',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 80px' }}>
        {tab === 'records' && (
          <>
            {/* Status filter */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { id: 'all',         label: 'All' },
                { id: 'open',        label: '🔴 Open' },
                { id: 'in_progress', label: '🟡 In Progress' },
                { id: 'resolved',    label: '🟢 Resolved' },
              ].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: statusFilter === f.id ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: statusFilter === f.id ? 'var(--primary)' : 'var(--card-bg)',
                  color: statusFilter === f.id ? '#fff' : 'var(--text-muted)',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32 }}>🔧</div>
                <div style={{ fontWeight: 700, marginTop: 12 }}>No maintenance records</div>
                {isAdmin && <button onClick={() => setShowAdd(true)} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Add first record</button>}
              </div>
            ) : (
              records.map(r => (
                <RecordCard
                  key={r.id}
                  record={r}
                  isAdmin={isAdmin}
                  onStatusChange={(id, updates) => actions.updateMaintenanceRecord(id, updates)}
                />
              ))
            )}
          </>
        )}

        {tab === 'complaints' && (
          <>
            {allComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32 }}>📋</div>
                <div style={{ fontWeight: 700, marginTop: 12 }}>No complaints filed</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Residents can file complaints from the society page.</div>
              </div>
            ) : (
              allComplaints.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  isAdmin={isAdmin}
                  onUpdate={(id, updates) => actions.updateComplaint(id, updates)}
                />
              ))
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddRecordModal
          societyId={society.id}
          onClose={() => setShowAdd(false)}
          onSave={async (record) => {
            await actions.addMaintenanceRecord({ ...record, reportedBy: state.currentUser?.id })
          }}
        />
      )}
    </div>
  )
}
