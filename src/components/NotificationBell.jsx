import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { format } from 'date-fns'

const TYPE_ICONS = {
  new_booking: '📅', accepted: '✅', rejected: '❌',
  rescheduled: '🔄', reschedule_accepted: '✅', reschedule_declined: '❌',
  completed: '🏆', review_request: '⭐',
  clinic_approved: '🎉', clinic_rejected: '❌',
  appointment_cancelled: '🚫',
}

function NotificationItem({ n, onRead }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = n.message?.length > 80

  function handleClick() {
    onRead(n.id)
    if (isLong) setExpanded(prev => !prev)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-teal-50/40' : ''}`}
    >
      <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
          {n.title}
        </p>

        {/* Message — truncated by default, expandable on click */}
        <p className={`text-xs text-slate-400 mt-0.5 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
          {n.message}
        </p>

        {/* Show more / less toggle */}
        {isLong && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(prev => !prev) }}
            className="text-xs font-medium mt-1 transition-colors"
            style={{ color: 'var(--color-brand)' }}
          >
            {expanded ? 'Show less ↑' : 'Show more ↓'}
          </button>
        )}

        <p className="text-xs text-slate-300 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
      </div>
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-teal-500" />
      )}
    </div>
  )
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-medium transition-colors" style={{color:'var(--color-brand)'}}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <p className="text-slate-400 text-sm">All caught up!</p>
                </div>
              ) : notifications.map(n => (
                <NotificationItem key={n.id} n={n} onRead={markAsRead} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}