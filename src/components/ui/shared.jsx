import { createPortal } from 'react-dom'
import { X, AlertCircle, CheckCircle2, Info, Inbox } from 'lucide-react'

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null
  const modal = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${maxWidth}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )

  return typeof document === 'undefined' ? modal : createPortal(modal, document.body)
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

const ALERT_STYLES = {
  error:   { bg:'bg-red-50',   border:'border-red-200',   text:'text-red-700',   Icon:AlertCircle  },
  success: { bg:'bg-green-50', border:'border-green-200', text:'text-green-700', Icon:CheckCircle2 },
  info:    { bg:'bg-sky-50',   border:'border-sky-200',   text:'text-sky-700',   Icon:Info         },
  warning: { bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-700', Icon:AlertCircle  },
}

export function Alert({ type = 'error', children }) {
  const s = ALERT_STYLES[type] || ALERT_STYLES.error
  return (
    <div className={`flex items-start gap-2.5 ${s.bg} ${s.text} border ${s.border} rounded-xl px-3.5 py-3 text-sm`}>
      <s.Icon className="w-4 h-4 shrink-0 mt-0.5"/>
      <span>{children}</span>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : icon || <Inbox className="w-7 h-7 text-slate-300"/>}
      </div>
      <p className="font-semibold text-slate-700 text-sm">{title}</p>
      {description && <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`}/>
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl"/>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2"/>
          <Skeleton className="h-3 w-1/3"/>
        </div>
      </div>
      <Skeleton className="h-3 w-full"/>
      <Skeleton className="h-3 w-3/4"/>
    </div>
  )
}

export function SkeletonRows({ n = 5, cols = 4 }) {
  return Array.from({ length: n }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3"><div className={`skeleton h-3 ${j===0?'w-3/4':'w-1/2'}`}/></td>
      ))}
    </tr>
  ))
}

const STATUS_MAP = {
  pending:             { label:'Pending',     cls:'badge-warning' },
  accepted:            { label:'Confirmed',   cls:'badge-success' },
  rejected:            { label:'Declined',    cls:'badge-danger'  },
  completed:           { label:'Completed',   cls:'badge-purple'  },
  cancelled:           { label:'Cancelled',   cls:'badge-gray'    },
  rescheduled:         { label:'Rescheduled', cls:'badge-info'    },
  reschedule_accepted: { label:'Confirmed',   cls:'badge-success' },
  reschedule_declined: { label:'Declined',    cls:'badge-danger'  },
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon: Icon, iconClass='text-sky-500', bg='bg-sky-50', loading }) {
  return (
    <div className="card p-5 fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">{label}</p>
          {loading
            ? <div className="skeleton h-7 w-16 mt-1"/>
            : <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
          }
          {sub && !loading && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconClass}`}/>
          </div>
        )}
      </div>
    </div>
  )
}

export function TableWrapper({ children }) {
  return <div className="table-container"><table className="w-full text-sm">{children}</table></div>
}

export function TableHead({ cols }) {
  return (
    <thead className="table-header">
      <tr>
        {cols.map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
        ))}
      </tr>
    </thead>
  )
}
