import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQ_GROUPS = [
  {
    title: 'Patients',
    items: [
      ['How do I book an appointment?', 'Search for a clinic, choose a service, select an available date and time, then confirm your booking.'],
      ['Can I cancel or reschedule?', 'Yes. Open your appointments page and use the cancel or reschedule option if it is still available.'],
      ['Is my personal data private?', 'Yes. BookMyDentistPH only uses your information to manage your account, bookings, reminders, and support requests.'],
      ['Will I receive notifications?', 'Yes. You may receive booking updates, reminders, and clinic responses based on your saved contact details.'],
    ],
  },
  {
    title: 'Clinics',
    items: [
      ['How does clinic registration work?', 'Create a clinic owner account, complete your clinic profile, then wait for admin verification before going live.'],
      ['Is there a pricing or subscription fee?', 'Pricing details may change as the platform grows. Contact us for the latest clinic partnership information.'],
      ['Can staff access the dashboard?', 'Staff access depends on the current account setup. For now, clinic owners should manage dashboard access carefully.'],
      ['What reports are available?', 'Clinics can generate reports for completed appointments, patient visit history, procedures, and earnings.'],
    ],
  },
]

function FAQItem({ question, answer, open, onToggle }) {
  return (
    <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-800 text-sm">{question}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-slate-500 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FAQs() {
  const [openId, setOpenId] = useState('Patients-0')

  useEffect(() => {
    document.title = 'FAQs | BookMyDentistPH'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <section className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-sky-500" />
          </div>
          <p className="section-label mb-3">Common Questions</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-5xl tracking-[-0.03em] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Short answers for patients and clinics using BookMyDentistPH.
          </p>
        </section>

        <section className="space-y-6">
          {FAQ_GROUPS.map(group => (
            <div key={group.title} className="card p-5 sm:p-6">
              <h2 className="font-display font-bold text-slate-900 text-xl mb-4">{group.title}</h2>
              <div className="space-y-3">
                {group.items.map(([question, answer], index) => {
                  const id = `${group.title}-${index}`
                  return (
                    <FAQItem
                      key={id}
                      question={question}
                      answer={answer}
                      open={openId === id}
                      onToggle={() => setOpenId(openId === id ? '' : id)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="text-center mt-8">
          <p className="text-slate-500 text-sm mb-4">Could not find what you need?</p>
          <Link to="/help-centre" className="btn btn-primary btn-md">Visit Help Centre</Link>
        </section>
      </main>
    </div>
  )
}
