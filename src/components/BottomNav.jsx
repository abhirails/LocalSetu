import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/home', icon: '🏠', label: 'Home' },
  { path: '/right-now', icon: '⚡', label: 'Right Now' },
  { path: '/create', icon: '+', label: 'Post', isPost: true },
  { path: '/help', icon: '🤝', label: 'Help' },
  { path: '/profile', icon: '👤', label: 'Profile' }
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path
        if (item.isPost) {
          return (
            <button
              key={item.path}
              className="nav-item nav-item-post"
              onClick={() => navigate(item.path)}
              aria-label="Create post"
            >
              <span className="nav-item-post-icon" aria-hidden="true">+</span>
            </button>
          )
        }
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
