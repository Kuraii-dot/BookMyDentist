import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { XCircle, Clock, CheckCircle2, Search, CreditCard, Rocket, LogOut, AlertCircle } from 'lucide-react'

export default function PendingApproval({ status, reason }) {
  const { signOut } = useAuth()
  const navigate    = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isRejected = status === 'rejected'

  const STEPS = [
    { Icon: CheckCircle2, label: 'Application submitted successfully', done: true,    active: false },
    { Icon: Search,       label: 'Admin review in progress',           done: false,   active: true  },
    { Icon: CreditCard,   label: 'Subscription payment verification',  done: false,   active: false },
    { Icon: Rocket,       label: 'Dashboard access granted',           done: false,   active: false },
  ]

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Top logo icon */}
        <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
          </svg>
        </div>

        {isRejected ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-stone-800 mb-2">Application Not Approved</h1>
            <p className="text-stone-500 mb-4">
              Unfortunately, your clinic application was not approved at this time.
            </p>
            {reason && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-600 font-semibold text-sm">Reason</p>
                </div>
                <p className="text-red-500 text-sm">{reason}</p>
              </div>
            )}
            <p className="text-stone-400 text-sm mb-6">
              If you believe this is a mistake or have resolved the issue, please contact us.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-stone-800 mb-2">Pending Approval</h1>
            <p className="text-stone-500 mb-6 leading-relaxed">
              Your clinic registration is under review. Once our team verifies your information,
              you'll get access to your dashboard.
            </p>
            <div className="bg-white rounded-2xl border border-amber-100 p-5 mb-6 text-left space-y-3">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${
                  s.done   ? 'text-green-600 font-semibold' :
                  s.active ? 'text-amber-600 font-semibold' :
                  'text-stone-400'
                }`}>
                  <s.Icon className={`w-4 h-4 shrink-0 ${
                    s.done   ? 'text-green-500' :
                    s.active ? 'text-amber-500' :
                    'text-stone-300'
                  }`} />
                  <span className="flex-1">{s.label}</span>
                  {s.done   && <span className="text-green-500 text-xs font-bold">Done</span>}
                  {s.active && <span className="text-amber-500 text-xs font-bold">In Progress</span>}
                </div>
              ))}
            </div>
            <p className="text-stone-400 text-sm mb-6">
              You'll receive an email notification once your application is reviewed. This usually takes 1–2 business days.
            </p>
          </>
        )}

        <button onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-rose-500 transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  )
}