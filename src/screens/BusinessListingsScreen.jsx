import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BUSINESS_CATEGORIES } from '../data/demoData'
import BottomNav from '../components/BottomNav'
import PaymentModal from '../components/PaymentModal'

const PLAN_META = {
  premium:  { label: 'Premium', color: '#d97706', bg: '#fef3c7', icon: '⭐' },
  standard: { label: 'Standard', color: '#7c3aed', bg: '#ede9fe', icon: '✓' },
  basic:    { label: 'Basic', color: '#4b5563', bg: '#f3f4f6', icon: '' },
}

function StarRating({ rating }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span style={{ color: '#f59e0b', fontSize: 13 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 12 }}>
        {rating.toFixed(1)}
      </span>
    </span>
  )
}

function BusinessCard({ biz, onClick }) {
  const plan = PLAN_META[biz.plan] || PLAN_META.basic
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 12,
        cursor: 'pointer',
        border: biz.plan === 'premium' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
        position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Plan badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{biz.name}</span>
            {biz.isVerified && (
              <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>
                ✓ Verified
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            📍 {biz.locality}
          </div>
        </div>
        {biz.plan !== 'basic' && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: plan.bg, color: plan.color,
            borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginLeft: 8
          }}>
            {plan.icon} {plan.label}
          </span>
        )}
      </div>

      {biz.tagline && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontStyle: 'italic' }}>
          "{biz.tagline}"
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StarRating rating={biz.rating} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {biz.reviewCount} reviews
        </span>
      </div>

      {biz.tags && biz.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {biz.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontSize: 11, background: 'var(--bg)', color: 'var(--text-muted)',
              borderRadius: 6, padding: '2px 7px', border: '1px solid var(--border)'
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Bottom row: contact quick-actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {biz.phone && (
          <a
            href={`tel:${biz.phone}`}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8,
              background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            📞 Call
          </a>
        )}
        {biz.whatsapp && (
          <a
            href={`https://wa.me/91${biz.whatsapp}?text=Hi, I found you on LocalSetu`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8,
              background: '#25d366', color: '#fff', fontSize: 13, fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            💬 WhatsApp
          </a>
        )}
      </div>

      {/* Sponsored label */}
      <div style={{ position: 'absolute', top: 10, right: biz.plan !== 'basic' ? 78 : 10, fontSize: 10, color: 'var(--text-muted)' }}>
        Ad
      </div>
    </div>
  )
}

export default function BusinessListingsScreen() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showListModal, setShowListModal] = useState(false)
  const [listPlan, setListPlan] = useState(null)

  useEffect(() => {
    actions.loadBusinesses({ category: activeCategory })
  }, [activeCategory])

  const businesses = (state.businesses || []).filter(b => {
    const matchesCat = activeCategory === 'all' || b.category === activeCategory
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.locality || '').toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Sort: premium first, then standard, then by rating
  const sorted = [...businesses].sort((a, b) => {
    const planOrder = { premium: 0, standard: 1, basic: 2 }
    const diff = (planOrder[a.plan] ?? 2) - (planOrder[b.plan] ?? 2)
    if (diff !== 0) return diff
    return b.rating - a.rating
  })

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ background: 'var(--primary)', padding: '16px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 16 }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Local Businesses</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{`Verified businesses near ${state?.currentUser?.locality?.split(',')[0] || 'your area'}`}</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search by name or locality..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
              border: 'none', fontSize: 14, background: 'rgba(255,255,255,0.95)',
              color: 'var(--text-primary)', boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {BUSINESS_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                border: activeCategory === cat.id ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.4)',
                background: activeCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.15)',
                color: activeCategory === cat.id ? 'var(--primary)' : '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
        {/* Ad disclaimer */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
          These are paid listings. LocalSetu does not endorse or guarantee services. Always verify before hiring.
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>No businesses found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term.' : 'No verified listings in this category yet.'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              {sorted.length} listing{sorted.length !== 1 ? 's' : ''}
            </div>
            {sorted.map(biz => (
              <BusinessCard
                key={biz.id}
                biz={biz}
                onClick={() => navigate(`/business/${biz.id}`)}
              />
            ))}
          </>
        )}

        {/* List your business CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 14, padding: 18, textAlign: 'center', color: '#fff', marginTop: 12
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🏪</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>List Your Business</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
            Reach 1,000+ residents in your area. Plans from ₹299/month.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[
              { label: 'Basic', price: '₹299/mo' },
              { label: 'Standard', price: '₹599/mo' },
              { label: 'Premium', price: '₹999/mo' },
            ].map(p => (
              <div key={p.label} style={{
                background: 'rgba(255,255,255,0.18)', borderRadius: 8,
                padding: '6px 12px', fontSize: 12
              }}>
                <div style={{ fontWeight: 700 }}>{p.label}</div>
                <div>{p.price}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { plan: 'basic',    label: 'Basic',    price: 299,  months: 1 },
              { plan: 'standard', label: 'Standard', price: 599,  months: 1 },
              { plan: 'premium',  label: 'Premium',  price: 999,  months: 1 },
            ].map(p => (
              <button
                key={p.plan}
                onClick={() => { setListPlan(p); setShowListModal(true) }}
                style={{
                  padding: '8px 16px', borderRadius: 16,
                  background: '#fff', color: '#764ba2', border: 'none',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer'
                }}
              >
                {p.label} ₹{p.price}/mo →
              </button>
            ))}
          </div>
        </div>
      </div>

      {showListModal && listPlan && (
        <PaymentModal
          title="🏪 List Your Business"
          description={`${listPlan.label} plan — reach 1,000+ local residents`}
          type="business_listing"
          metadata={{ plan: listPlan.plan, plan_months: listPlan.months }}
          currentUser={state.currentUser || {}}
          options={[{
            id:          listPlan.plan,
            label:       `${listPlan.label} — 1 month`,
            price:       listPlan.price,
            months:      listPlan.months,
            description: listPlan.plan === 'premium' ? 'Top placement + ⭐ badge + contact buttons' :
                         listPlan.plan === 'standard' ? 'Priority placement + contact buttons' :
                         'Standard listing + contact buttons',
          }]}
          onSuccess={() => {}}
          onClose={() => setShowListModal(false)}
        />
      )}
      <BottomNav />
    </div>
  )
}
