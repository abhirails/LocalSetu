import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cx, ui } from '../lib/ui'

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
    <nav className={ui.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path
        if (item.isPost) {
          return (
            <button
              key={item.path}
              className={ui.navItemPost}
              onClick={() => navigate(item.path)}
              aria-label="Create post"
            >
              <span className={ui.navItemPostIcon} aria-hidden="true">+</span>
            </button>
          )
        }
        return (
          <button
            key={item.path}
            className={cx(ui.navItem, isActive && ui.navItemActive)}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className={cx(ui.navItemIcon, isActive && ui.navItemIconActive)}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
