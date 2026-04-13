import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { format } from 'date-fns'
import {
  Bell, Calendar, CheckCircle2, XCircle, RefreshCw,
  Star, PartyPopper, Ban, Inbox, Megaphone,
} from 'lucide-react'

// Map notification types to lucide icons + colors
const TYPE_CONFIG = {
  new_booking:          { Icon: Calendar,     color: 'text-sky-500',     bg: 'bg-sky-50'     },
  accepted:             { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  rejected:             { Icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50'     },
  rescheduled:          { Icon: RefreshCw,    color: 'text-blue-500',    bg: 'bg-blue-50'    },
  reschedule_accepted:  { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  reschedule_declined:  { Icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50'     },
  completed:            { Icon: Star,         color: 'text-violet-500',  bg: 'bg-violet-50'  },
  review_request:       { Icon: Star,         color: 'text-amber-500',   bg: 'bg-amber-50'   },
  clinic_approved:      { Icon: PartyPopper,  color: 'text-emerald-500', bg: 'bg-emerald-50' },
  clinic_rejected:      { Icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50'     },
  appointment_cancelled:{ Icon: Ban,          color: 'text-slate-500',   bg: 'bg-slate-100'  },
  announcement:         { Icon: Megaphone,    color: 'text-sky-500',     bg: 'bg-sky-50'     },
}

const DEFAULT_CONFIG = { Icon: Bell, color: 'text-sky-500', bg: 'bg-sky-50' }

function NotificationItem({ n, onRead }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = n.message?.length > 80
  const config = TYPE_CONFIG[n.type] || DEFAULT_CONFIG
  const { Icon, color, bg } = config

  return (
    <div
      onClick={() => { onRead(n.id); if (isLong) setExpanded(p => !p) }}
      className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{ background: !n.is_read ? 'rgba(224,242,254,0.45)' : 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.55)'}
      onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? 'rgba(224,242,254,0.45)' : 'transparent'}
    >
      {/* Icon bubble */}
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
          {n.title}
        </p>
        <p className={`text-xs text-slate-400 mt-0.5 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
          {n.message}
        </p>
        {isLong && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(p => !p) }}
            className="text-xs font-semibold mt-1 transition-colors"
            style={{ color: 'var(--color-brand)' }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <p className="text-xs text-slate-300 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
      </div>

      {!n.is_read && (
        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--color-brand)' }} />
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
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{
          background:     'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          border:         '1px solid rgba(255,255,255,0.8)',
          boxShadow:      '0 2px 8px rgba(14,165,233,0.08)',
        }}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 w-80 z-50 overflow-hidden animate-fade-in"
            style={{
              background:     'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(28px) saturate(1.6)',
              border:         '1px solid rgba(255,255,255,0.9)',
              borderRadius:   '1.25rem',
              boxShadow:      '0 24px 64px rgba(14,165,233,0.14), 0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.6)' }}
            >
              <h3 className="font-display font-bold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-6 h-6 text-sky-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem key={n.id} n={n} onRead={markAsRead} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}