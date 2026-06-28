import React from 'react'
import { useGame } from '../engine/GameContext'

const icons = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️'
}

export default function Notifications() {
  const { state, dispatch } = useGame()

  if (state.notifications.length === 0) return null

  return (
    <div className="notification-container">
      {state.notifications.map(n => (
        <div key={n.id} className={`notification notification-${n.type}`}>
          <span>{icons[n.type]}</span>
          <span>{n.message}</span>
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
