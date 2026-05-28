import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ArrowRight, BookOpen, CalendarDays, Tags } from 'lucide-react'

const CATEGORIES = ['Dental Education', 'Clinic Technology', 'Patient Guides', 'Clinic Growth Tips']

const POSTS = [
  {
    title: 'How often should you visit the dentist?',
    category: 'Dental Education',
    date: '2026-05-12',
    readTime: '4 min read',
    excerpt: 'A simple guide to routine checkups, cleaning schedules, and when symptoms should be checked sooner.',
  },
  {
    title: 'What patients should prepare before booking online',
    category: 'Patient Guides',
    date: '2026-05-08',
    readTime: '3 min read',
    excerpt: 'Make your appointment smoother by checking services, clinic notes, reminders, and contact details before booking.',
  },
  {
    title: 'Digital appointment tools for growing dental clinics',
    category: 'Clinic Technology',
    date: '2026-04-28',
    readTime: '5 min read',
    excerpt: 'How online bookings, patient records, and reminders can reduce admin work for busy clinics.',
  },
  {
    title: 'Simple ways clinics can improve patient retention',
    category: 'Clinic Growth Tips',
    date: '2026-04-16',
    readTime: '4 min read',
    excerpt: 'Friendly follow-ups, clear service information, and reliable scheduling can help patients come back with confidence.',
  },
]

export default function Blog() {
  useEffect(() => {
    document.title = 'Blog | BookMyDentistPH'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="text-center mb-10">
          <p className="section-label mb-3">Dental Insights</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-5xl tracking-[-0.03em] mb-4">
            BookMyDentistPH Blog
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Practical dental care tips, clinic operations guides, and product updates for patients and dental teams.
          </p>
        </section>

        <section className="card p-4 sm:p-5 mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <span key={category} className="badge badge-teal">
                <Tags className="w-3 h-3" />
                {category}
              </span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-label="Blog posts">
          {POSTS.map(post => (
            <article key={post.title} className="card p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="badge badge-info">{post.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-sky-500" />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-xl mb-2">{post.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">{post.readTime}</span>
                <button className="text-sky-600 text-sm font-bold inline-flex items-center gap-1 hover:text-sky-700">
                  Coming soon <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="card p-6 sm:p-8 text-center mt-8">
          <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Have a topic request?</h2>
          <p className="text-slate-500 text-sm mb-5 max-w-lg mx-auto">
            Tell us what dental care or clinic management topics would help you most.
          </p>
          <Link to="/contact" className="btn btn-primary btn-md">Contact Us</Link>
        </section>
      </main>
    </div>
  )
}
