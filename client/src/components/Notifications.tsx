import React, { useRef, useEffect } from 'react'
import { useGame } from '../engine/GameContext'

const icons = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️'
}

export default function Notifications() {
  const { state, dispatch } = useGame()
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top when new notifications arrive
  useEffect(() => {
    if (containerRef.current && state.notifications.length > 0) {
      containerRef.current.scrollTop = 0
    }
  }, [state.notifications.length])

  if (state.notifications.length === 0) return null

  return (
    <div className="notification-container" ref={containerRef}>
      {state.notifications.slice(0, 10).map((n, i) => (
        <div
          key={n.id}
          className={`notification notification-${n.type}`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className="notification-icon">{icons[n.type]}</span>
          <span className="notification-msg">{n.message}</span>
          <span
            className="notification-close"
            onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: n.id })}
          >
            ✕
          </span>
        </div>
      ))}
    </div>
  )
}
