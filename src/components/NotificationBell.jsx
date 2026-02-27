import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { format } from 'date-fns'

const TYPE_ICONS = {
  new_booking:'📅', accepted:'✅', rejected:'❌',
  rescheduled:'🔄', reschedule_accepted:'✅', reschedule_declined:'❌',
  completed:'🏆', review_request:'⭐',
  clinic_approved:'🎉', clinic_rejected:'❌',
  appointment_cancelled:'🚫',
}

function NotificationItem({ n, onRead }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = n.message?.length > 80

  return (
    <div onClick={() => { onRead(n.id); if (isLong) setExpanded(p => !p) }}
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors ${!n.is_read ? '' : ''}`}
      style={{background: !n.is_read ? 'rgba(224,242,254,0.45)' : 'transparent'}}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
      onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? 'rgba(224,242,254,0.45)' : 'transparent'}>
      <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>{n.title}</p>
        <p className={`text-xs text-slate-400 mt-0.5 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>{n.message}</p>
        {isLong && (
          <button onClick={e => { e.stopPropagation(); setExpanded(p=>!p) }}
            className="text-xs font-semibold mt-1 transition-colors" style={{color:'var(--color-brand)'}}>
            {expanded ? 'Show less ↑' : 'Show more ↓'}
          </button>
        )}
        <p className="text-xs text-slate-300 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
      </div>
      {!n.is_read && <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{backgroundColor:'var(--color-brand)'}}/>}
    </div>
  )
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{background:'rgba(255,255,255,0.55)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.8)',boxShadow:'0 2px 8px rgba(14,165,233,0.08)'}}>
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-11 w-80 z-50 overflow-hidden animate-fade-in"
            style={{background:'rgba(255,255,255,0.82)',backdropFilter:'blur(28px) saturate(1.6)',border:'1px solid rgba(255,255,255,0.9)',borderRadius:'1.25rem',boxShadow:'0 24px 64px rgba(14,165,233,0.14), 0 8px 24px rgba(0,0,0,0.08)'}}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{borderBottom:'1px solid rgba(255,255,255,0.6)'}}>
              <h3 className="font-display font-bold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-semibold transition-colors hover:opacity-70" style={{color:'var(--color-brand)'}}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto" style={{scrollbarWidth:'thin'}}>
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{background:'rgba(224,242,254,0.6)'}}>
                    <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                </div>
              ) : notifications.map(n => (
                <NotificationItem key={n.id} n={n} onRead={markAsRead}/>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}