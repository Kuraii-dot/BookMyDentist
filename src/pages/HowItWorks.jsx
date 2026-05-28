import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  BarChart2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Search,
  Settings,
  Stethoscope,
  UserPlus,
} from 'lucide-react'

const PATIENT_STEPS = [
  ['Search clinic', 'Find verified dental clinics by location, service, or clinic name.', Search],
  ['Select service', 'Review available procedures, estimated prices, and clinic details.', Stethoscope],
  ['Choose schedule', 'Pick a date and time that works for your visit.', CalendarCheck],
  ['Book appointment', 'Confirm the request with your account and contact details.', CheckCircle2],
  ['Receive reminders', 'Get booking updates and reminders before your appointment.', ClipboardList],
]

const CLINIC_STEPS = [
  ['Register clinic', 'Create a clinic owner account and submit your clinic information.', UserPlus],
  ['Set services and schedules', 'Add procedures, prices, availability, and booking rules.', Settings],
  ['Receive bookings', 'Review incoming appointment requests from patients.', ClipboardList],
  ['Manage appointments', 'Accept, decline, reschedule, complete, or cancel appointments.', CalendarCheck],
  ['Generate reports', 'Review completed visits, procedures, patient history, and earnings.', BarChart2],
]

function StepFlow({ title, description, steps, cta, ctaTo }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="mb-6">
        <p className="section-label mb-2">{title}</p>
        <h2 className="font-display font-bold text-slate-900 text-2xl mb-2">{description}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {steps.map(([label, copy, Icon], index) => (
          <article key={label} className="relative rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-sky-500" />
            </div>
            <span className="absolute top-4 right-4 text-xs font-bold text-slate-300">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-semibold text-slate-900 text-sm mb-2">{label}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <Link to={ctaTo} className="btn btn-primary btn-md">{cta}</Link>
      </div>
    </section>
  )
}

export default function HowItWorks() {
  useEffect(() => {
    document.title = 'How It Works | BookMyDentistPH'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-10">
          <p className="section-label mb-3">Simple Online Booking</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-5xl tracking-[-0.03em] mb-4">
            How BookMyDentistPH Works
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            A clear booking flow for patients and a simple appointment management system for dental clinics.
          </p>
        </section>

        <div className="space-y-6">
          <StepFlow
            title="For Patients"
            description="Book dental care in five steps"
            steps={PATIENT_STEPS}
            cta="Find a Clinic"
            ctaTo="/browse"
          />
          <StepFlow
            title="For Clinics"
            description="Manage online appointments from one dashboard"
            steps={CLINIC_STEPS}
            cta="List Your Clinic"
            ctaTo="/register?role=clinic"
          />
        </div>

        <section className="card p-6 sm:p-8 mt-8 text-center">
          <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Need more guidance?</h2>
          <p className="text-slate-500 text-sm mb-5 max-w-lg mx-auto">
            Visit the Help Centre for patient support, clinic setup notes, and technical troubleshooting.
          </p>
          <Link to="/help-centre" className="btn btn-secondary btn-md">Open Help Centre</Link>
        </section>
      </main>
    </div>
  )
}
