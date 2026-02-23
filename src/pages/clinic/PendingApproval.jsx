import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function PendingApproval({ status, reason }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isRejected = status === 'rejected'

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl">🦷</span>
        </div>

        {isRejected ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-black text-stone-800 mb-2">Application Not Approved</h1>
            <p className="text-stone-500 mb-4">
              Unfortunately, your clinic application was not approved at this time.
            </p>
            {reason && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
                <p className="text-red-600 font-semibold text-sm mb-1">Reason:</p>
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
              <span className="text-3xl animate-pulse">⏳</span>
            </div>
            <h1 className="text-2xl font-black text-stone-800 mb-2">Pending Approval</h1>
            <p className="text-stone-500 mb-6 leading-relaxed">
              Your clinic registration is under review. Once our team verifies your information and processes your subscription, you'll get access to your dashboard.
            </p>
            <div className="bg-white rounded-2xl border border-amber-100 p-5 mb-6 text-left space-y-3">
              {[
                { icon: '📋', text: 'Application submitted successfully' },
                { icon: '🔍', text: 'Admin review in progress' },
                { icon: '💳', text: 'Subscription payment verification' },
                { icon: '🚀', text: 'Dashboard access granted' },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm ${i === 0 ? 'text-green-600 font-semibold' : i === 1 ? 'text-amber-600 font-semibold' : 'text-stone-400'}`}>
                  <span>{step.icon}</span>
                  <span>{step.text}</span>
                  {i === 0 && <span className="ml-auto text-green-500 text-xs font-bold">Done ✓</span>}
                  {i === 1 && <span className="ml-auto text-amber-500 text-xs font-bold">In Progress</span>}
                </div>
              ))}
            </div>
            <p className="text-stone-400 text-sm mb-6">
              You'll receive an email notification once your application is reviewed. This usually takes 1-2 business days.
            </p>
          </>
        )}

        <button
          onClick={handleSignOut}
          className="text-sm text-stone-400 hover:text-rose-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}