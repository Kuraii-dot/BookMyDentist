import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { CalendarCheck, LayoutDashboard, LifeBuoy, Monitor, UserPlus } from 'lucide-react'

const SUPPORT_GROUPS = [
  {
    title: 'Patient Support',
    Icon: CalendarCheck,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    items: [
      ['How to book appointments', 'Search for a clinic, open its profile, choose a service and schedule, then confirm your booking.'],
      ['How to cancel or reschedule', 'Go to your appointments page and use the available cancel or reschedule action before the appointment time.'],
      ['Account creation and login help', 'Create an account with your email, verify it, then sign in using the same credentials.'],
      ['Appointment reminders', 'Keep your contact details updated so reminders and booking updates reach you.'],
    ],
  },
  {
    title: 'Clinic Support',
    Icon: LayoutDashboard,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    items: [
      ['Clinic registration guide', 'Register as a clinic owner, complete your clinic profile, and wait for admin verification.'],
      ['Appointment management', 'Review pending requests, accept bookings, reschedule when needed, and mark visits as completed.'],
      ['Dashboard usage guide', 'Use the clinic dashboard to manage services, availability, appointment requests, and clinic details.'],
      ['Reports overview', 'Generate reports to review completed appointments, patient visits, services, and earnings.'],
    ],
  },
  {
    title: 'Technical Support',
    Icon: Monitor,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    items: [
      ['Login issues', 'Check your email and password, confirm your email verification, then try again in a modern browser.'],
      ['Password reset', 'Use the password reset option on the login page and follow the instructions sent to your email.'],
      ['System and browser requirements', 'Use an updated version of Chrome, Edge, Safari, or Firefox with JavaScript enabled.'],
    ],
  },
]

export default function HelpCentre() {
  useEffect(() => {
    document.title = 'Help Centre | BookMyDentistPH'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="w-7 h-7 text-sky-500" />
          </div>
          <p className="section-label mb-3">Support Hub</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-5xl tracking-[-0.03em] mb-4">
            Help Centre
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Find quick answers for booking, clinic management, account access, and common technical questions.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SUPPORT_GROUPS.map(group => (
            <div key={group.title} className="card p-5 sm:p-6">
              <div className={`w-11 h-11 ${group.bg} rounded-xl flex items-center justify-center mb-4`}>
                <group.Icon className={`w-5 h-5 ${group.color}`} />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-xl mb-4">{group.title}</h2>
              <div className="space-y-4">
                {group.items.map(([title, description]) => (
                  <article key={title} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="card p-6 sm:p-8 mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Still need help?</h2>
            <p className="text-slate-500 text-sm max-w-xl">
              Send us a message and include your account email, clinic name if applicable, and a short description of the issue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/faqs" className="btn btn-secondary btn-md">View FAQs</Link>
            <Link to="/contact" className="btn btn-primary btn-md">
              <UserPlus className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
