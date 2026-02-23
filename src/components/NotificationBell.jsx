import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const typeStyles = {
  new_booking: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  rescheduled: 'bg-amber-100 text-amber-700',
  reschedule_accepted: 'bg-green-100 text-green-700',
  reschedule_declined: 'bg-red-100 text-red-700',
}

const typeIcons = {
  new_booking: '📅',
  accepted: '✅',
  rejected: '❌',
  rescheduled: '🔄',
  reschedule_accepted: '✅',
  reschedule_declined: '❌',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { profile } = useAuth()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNotificationClick(notification) {
    markAsRead(notification.id)
    setOpen(false)
    if (profile?.role === 'customer') navigate('/dashboard/appointments')
    else if (profile?.role === 'clinic_owner') navigate('/clinic/appointments')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-amber-100 transition-colors"
      >
        <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-amber-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-50">
            <h3 className="font-semibold text-stone-700">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-amber-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors ${!n.is_read ? 'bg-amber-50/60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{typeIcons[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-stone-700 truncate">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {format(new Date(n.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}