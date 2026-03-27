import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Shield, Heart, Star, Building2, Users } from 'lucide-react'

const VALUES = [
  { Icon:Shield,   color:'text-sky-500',   bg:'bg-sky-50',   title:'Trust & Safety',   desc:"Every clinic on our platform goes through a manual verification process by our admin team before going live." },
  { Icon:Heart,    color:'text-rose-400',  bg:'bg-rose-50',  title:'Patient First',     desc:"We built BookMyDentistPH because finding a good dentist shouldn't be hard. Patients deserve clarity, ease, and confidence." },
  { Icon:Star,     color:'text-amber-400', bg:'bg-amber-50', title:'Quality Care',      desc:"Real reviews from real patients help you make informed choices about where to get your dental care." },
  { Icon:Building2,color:'text-cyan-500',  bg:'bg-cyan-50',  title:'Clinic Growth',     desc:"We partner with clinics to help them manage appointments and grow their patient base digitally." },
]

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-3xl">🦷</span>
          </div>
          <p className="section-label mb-3">Our Story</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-4">
            About <span className="text-sky-500">BookMyDentistPH</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
            We're on a mission to make dental care in the Philippines more accessible, transparent, and stress-free — for both patients and clinics.
          </p>
        </div>

        {/* Story */}
        <div className="card p-7 sm:p-8 mb-8">
          <h2 className="font-display font-bold text-slate-900 text-xl mb-4">Why we built this</h2>
          <div className="space-y-4 text-slate-500 leading-relaxed text-sm">
            <p>Finding a dentist in the Philippines often means asking around on Facebook groups, calling clinics one by one, or just showing up and hoping there's a slot. It's frustrating, time-consuming, and it shouldn't be this way.</p>
            <p>BookMyDentistPH was built to change that. We created a platform where patients can find verified dental clinics, see their services and prices upfront, and book an appointment in minutes — not hours.</p>
            <p>For clinics, we provide a simple dashboard to manage availability, accept or reschedule appointments, track their patients, and grow their practice through real patient reviews — without needing to hire a full-time receptionist for scheduling.</p>
          </div>
        </div>

        {/* Values */}
        <h2 className="font-display font-bold text-slate-900 text-xl mb-5 text-center">What we stand for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {VALUES.map(v=>(
            <div key={v.title} className="card p-5 flex gap-4">
              <div className={`w-11 h-11 ${v.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <v.Icon className={`w-5 h-5 ${v.color}`}/>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{v.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card p-7 text-center mb-8">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-sky-500"/>
          </div>
          <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Are you a dental clinic?</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Join BookMyDentistPH to manage your appointments online and reach more patients in your city.</p>
          <Link to="/register?role=clinic" className="btn btn-primary btn-md">List Your Clinic — It's Free</Link>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
          <Link to="/contact" className="btn btn-secondary btn-md">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}