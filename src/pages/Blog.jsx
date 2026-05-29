import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Heart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Monitor,
  NotebookPen,
  Phone,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Stethoscope,
  Tags,
  TrendingUp,
  UserRound,
} from 'lucide-react'

const CATEGORIES = ['Dental Education', 'Clinic Technology', 'Patient Guides', 'Clinic Growth Tips']

const ARTICLE_DATA = {
  dentalEducation: {
    id: 'dental-education-guide',
    title: 'How Often Should You Visit the Dentist? A Simple Guide',
    category: 'Dental Education',
    date: '2026-05-12',
    readTime: '4 min read',
    excerpt: 'A simple guide to routine checkups, cleaning schedules, and when symptoms should be checked sooner.',
    HeroIcon: BookOpen,
    iconColor: 'text-sky-500',
    gradient: 'from-sky-500 to-cyan-500',
    intro: [
      'Visiting the dentist is something many people tend to delay until they feel pain or discomfort. However, regular dental checkups are one of the most important habits for maintaining healthy teeth and gums.',
      'So the real question is: how often should you actually visit the dentist?',
    ],
    sections: [
      {
        title: 'The General Recommendation',
        Icon: CalendarDays,
        body: [
          'Most dentists recommend visiting every 6 months for a routine checkup and cleaning.',
          'Even if your teeth feel fine, problems can develop silently without symptoms.',
        ],
        bullets: [
          'Remove plaque and tartar buildup',
          'Prevent cavities before they worsen',
          'Detect early signs of gum disease',
          'Maintain overall oral health',
        ],
      },
      {
        title: 'When You Should Visit More Often',
        Icon: ShieldCheck,
        body: [
          'Some people may need to visit the dentist more frequently than every 6 months.',
          'In these cases, your dentist may recommend visits every 3-4 months.',
        ],
        bullets: [
          'Gum disease or bleeding gums',
          'Frequent cavities',
          'Diabetes or other health conditions affecting oral health',
          'Braces or orthodontic treatment',
          'A history of poor dental hygiene',
        ],
      },
      {
        title: 'Signs You Should Not Wait for Your Next Checkup',
        Icon: AlertTriangle,
        body: [
          'Even if your next appointment is not yet due, you should visit a dentist immediately if you notice warning signs.',
          'Early treatment is always cheaper and less painful than delayed care.',
        ],
        bullets: [
          'Tooth pain or sensitivity',
          'Swollen or bleeding gums',
          'Persistent bad breath',
          'Loose teeth',
          'Pain when chewing',
          'Visible cavities or dark spots on teeth',
        ],
      },
      {
        title: 'Why Regular Dental Visits Matter',
        Icon: Heart,
        body: [
          'Many people only visit dentists when something hurts, but preventive care is far more effective.',
          'Think of dental visits as maintenance, not just treatment.',
        ],
        bullets: [
          'Avoid expensive dental procedures',
          'Maintain fresh breath and clean teeth',
          'Keep your smile healthy and confident',
          'Catch problems early before they worsen',
        ],
      },
      {
        title: 'A Common Problem Locally',
        Icon: MapPin,
        body: [
          'In the Philippines, many patients delay dental visits for practical reasons.',
          'Unfortunately, this often leads to more complicated and expensive treatments later on. Preventive care is always more affordable than emergency procedures.',
        ],
        bullets: ['Busy schedules', 'Cost concerns', 'Lack of reminders', 'Only going when pain becomes severe'],
      },
      {
        title: 'Simple Rule to Remember',
        Icon: Lightbulb,
        body: [
          'If you are unsure when to visit, remember this: "Every 6 months, or sooner if something feels wrong."',
          'Consistency matters more than perfection.',
        ],
      },
      {
        title: 'Final Thoughts',
        Icon: CheckCircle2,
        body: [
          'Dental health is not just about appearance. It affects your overall well-being, confidence, and quality of life.',
          'Regular checkups are a small habit that can prevent big problems in the future.',
          'If it has been a while since your last visit, it may be a good time to schedule your next dental checkup.',
        ],
      },
    ],
  },
  patientGuides: {
    id: 'patient-booking-guide',
    title: 'What Patients Should Prepare Before Booking Online',
    category: 'Patient Guides',
    date: '2026-05-08',
    readTime: '3 min read',
    excerpt: 'Make your appointment smoother by checking services, clinic notes, reminders, and contact details before booking.',
    HeroIcon: ClipboardList,
    iconColor: 'text-emerald-500',
    gradient: 'from-emerald-500 to-sky-500',
    numbered: true,
    intro: [
      'Booking a dental appointment online is now much easier and more convenient than before. Instead of calling and waiting, patients can simply choose a clinic, pick a schedule, and confirm their appointment in just a few steps.',
      'But before booking, it helps to prepare a few things so the process becomes smoother and faster. A little preparation can save time, avoid confusion, and help the clinic understand your needs better.',
    ],
    sections: [
      {
        title: 'Your basic personal information',
        Icon: UserRound,
        body: [
          'Before booking, make sure you have your important details ready, such as your full name, contact number, and email address if needed.',
          'This helps the clinic confirm your appointment and contact you easily in case there are changes or reminders.',
        ],
      },
      {
        title: 'The reason for your visit',
        Icon: Stethoscope,
        body: [
          'It is helpful to know why you are booking an appointment. Are you going for a regular checkup, tooth cleaning, consultation, tooth pain, or another concern?',
          'When you clearly state your reason, the clinic can prepare better and assign the right kind of service for you.',
        ],
      },
      {
        title: 'Your preferred schedule',
        Icon: CalendarDays,
        body: [
          'Before you book, check your availability first. Make sure the date and time you choose will work for you so you will not need to reschedule later.',
          'This is especially important if you are busy with work, school, or family responsibilities.',
        ],
      },
      {
        title: 'Previous dental history',
        Icon: ClipboardList,
        body: [
          'If you have visited the dentist before, it helps to remember any previous treatments, ongoing concerns, or recommendations from your last appointment.',
          'This is useful especially if you are booking for a follow-up visit or continuing a treatment.',
        ],
      },
      {
        title: 'Any special concerns or notes',
        Icon: NotebookPen,
        body: [
          'If you have tooth sensitivity, gum problems, pain, allergies, or other concerns, it is a good idea to mention them when booking.',
          'This allows the clinic to better understand your situation and prepare the right approach for your visit.',
        ],
      },
      {
        title: 'Payment method or other clinic requirements',
        Icon: Receipt,
        body: [
          'Some clinics may have specific payment methods, consultation fees, or booking requirements. It is a good idea to check these before confirming your appointment.',
          'Being prepared helps avoid surprises and makes the visit smoother for both the patient and the clinic.',
        ],
      },
      {
        title: 'Be ready with reminders and contact details',
        Icon: Phone,
        body: [
          'After booking, make sure your phone number is active and easy to reach. Some clinics send reminders or updates before the appointment.',
          'This helps make sure you do not miss your schedule.',
        ],
      },
      {
        title: 'Why preparation matters',
        Icon: Lightbulb,
        body: [
          'Booking online is meant to make life easier, but it becomes even better when patients are prepared. A few minutes of preparation can help avoid delays, missed appointments, and back-and-forth messages.',
          'It also helps the clinic serve you better and more efficiently.',
        ],
      },
      {
        title: 'Final thoughts',
        Icon: CheckCircle2,
        body: [
          'Before booking a dental appointment online, it is always smart to prepare your basic details, schedule, reason for visit, and any special concerns. This small step can make the whole experience faster, smoother, and more convenient.',
          'With the right preparation, online booking becomes a simple and stress-free way to take care of your dental needs.',
        ],
      },
    ],
  },
  clinicTechnology: {
    id: 'clinic-technology-tools',
    title: 'Digital Appointment Tools for Growing Dental Clinics',
    category: 'Clinic Technology',
    date: '2026-04-28',
    readTime: '5 min read',
    excerpt: 'How online bookings, patient records, and reminders can reduce admin work for busy clinics.',
    HeroIcon: Monitor,
    iconColor: 'text-cyan-500',
    gradient: 'from-cyan-500 to-blue-500',
    intro: [
      'Running a dental clinic today is very different from before. It is no longer just about treating patients. It is also about managing schedules, handling bookings, and making sure every patient experience feels smooth from start to finish.',
      'For many clinics, this is where things get challenging. Missed calls, double bookings, and manual scheduling can take up valuable time that should be spent on patient care.',
      'This is where digital appointment tools come in.',
    ],
    sections: [
      {
        title: 'A simpler way to manage appointments',
        Icon: CalendarCheck,
        body: [
          'Digital appointment systems help clinics organize their schedules in one place. Instead of writing appointments manually or relying on phone calls, everything becomes easier to track and manage.',
          'This makes the entire workflow more organized and less stressful for staff.',
        ],
        bullets: [
          'View daily and weekly schedules',
          'Manage patient bookings in real time',
          'Reduce scheduling conflicts',
          'Update availability instantly',
        ],
      },
      {
        title: 'Fewer missed appointments',
        Icon: Bell,
        body: [
          'One of the most common problems in dental clinics is patients forgetting their appointments.',
          'With digital tools, clinics can send reminders through notifications or messages before the scheduled visit. Even a small reminder can make a big difference.',
        ],
        bullets: ['Reduce no-shows', 'Improve attendance rates', 'Keep schedules full and efficient'],
      },
      {
        title: 'Better experience for patients',
        Icon: Smile,
        body: [
          'Patients appreciate convenience. Being able to book online, choose schedules easily, and receive confirmations makes the experience more comfortable and modern.',
          'A smoother booking process often leads to better patient satisfaction and trust.',
        ],
        bullets: [
          'Book anytime, even outside clinic hours',
          'See available slots instantly',
          'Receive confirmation right away',
        ],
      },
      {
        title: 'Helping clinics grow efficiently',
        Icon: TrendingUp,
        body: [
          'As a clinic grows, manual systems become harder to manage. More patients mean more bookings, more schedules, and more chances for errors.',
          'It becomes easier to scale operations without chaos.',
        ],
        bullets: [
          'Handle more patients without extra workload',
          'Improve organization',
          'Save staff time',
          'Focus more on patient care instead of admin work',
        ],
      },
      {
        title: 'A step toward modern dental practice',
        Icon: Settings,
        body: [
          'Switching to digital tools is not just about technology. It is about improving how clinics operate every day.',
          'It allows dental teams to work more efficiently while giving patients a better overall experience.',
          'For growing clinics, this shift is no longer optional. It is becoming the standard.',
        ],
      },
      {
        title: 'Final thoughts',
        Icon: CheckCircle2,
        body: [
          'Digital appointment tools are helping modern dental clinics become more organized, efficient, and patient-friendly.',
          'By reducing manual work and improving communication, clinics can focus more on what truly matters: providing quality dental care.',
        ],
      },
    ],
  },
  clinicGrowth: {
    id: 'clinic-growth-retention',
    title: 'Simple Ways Clinics Can Improve Patient Retention',
    category: 'Clinic Growth Tips',
    date: '2026-04-16',
    readTime: '4 min read',
    excerpt: 'Friendly follow-ups, clear service information, and reliable scheduling can help patients come back with confidence.',
    HeroIcon: TrendingUp,
    iconColor: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    numbered: true,
    intro: [
      'Getting new patients is important, but keeping them coming back is just as valuable. For dental clinics, patient retention is one of the clearest signs that people trust your service, feel comfortable with your team, and see real value in returning.',
      'The good news is that improving retention does not always require big changes. Sometimes, the simplest improvements make the biggest difference.',
    ],
    sections: [
      {
        title: 'Make booking easy',
        Icon: CalendarCheck,
        body: [
          'Patients are more likely to return when booking is simple and convenient. If it takes too many steps to schedule an appointment, some patients may delay or forget to come back.',
          'A smooth booking process helps patients feel that your clinic values their time.',
        ],
      },
      {
        title: 'Send reminders',
        Icon: Bell,
        body: [
          'One of the easiest ways to improve retention is by reminding patients about their upcoming visits.',
          'Many patients forget appointments because of busy schedules, work, school, or family responsibilities. A simple reminder can help them stay on track and reduce missed visits.',
        ],
      },
      {
        title: 'Keep communication clear',
        Icon: MessageCircle,
        body: [
          'Patients appreciate clinics that communicate well. Whether it is about schedules, treatment instructions, or follow-up visits, clear communication helps build trust.',
          'When patients feel informed, they are more likely to return and recommend your clinic to others.',
        ],
      },
      {
        title: 'Make every visit comfortable',
        Icon: Heart,
        body: [
          'A good experience goes a long way. From the front desk to the dental chair, patients remember how they were treated.',
          'Friendly staff, a clean environment, and a calm approach can make patients feel more at ease and more willing to come back.',
        ],
      },
      {
        title: 'Follow up after treatment',
        Icon: Phone,
        body: [
          'A simple follow-up message after a procedure or consultation can make patients feel cared for.',
          'It shows that the clinic is not just focused on the appointment, but also on the patient overall well-being. This small gesture can leave a lasting impression.',
        ],
      },
      {
        title: 'Stay consistent',
        Icon: ShieldCheck,
        body: [
          'Patients are more likely to return to clinics they can rely on. Consistent service, organized schedules, and predictable communication help create that sense of reliability.',
          'When patients know what to expect, they feel more confident booking again.',
        ],
      },
      {
        title: 'Use digital tools to stay organized',
        Icon: Monitor,
        body: [
          'Digital appointment tools can help clinics manage bookings, send reminders, and keep patient records more organized.',
          'This makes it easier to avoid double bookings, missed schedules, and unnecessary confusion. An organized clinic creates a better experience for patients and staff alike.',
        ],
      },
      {
        title: 'Why patient retention matters',
        Icon: TrendingUp,
        body: [
          'When patients return, it means they trust your clinic. It also helps build long-term relationships, stronger reputation, and more stable growth for the business.',
          'Instead of always starting from zero with new patients, retention helps clinics build a dependable base of loyal clients.',
        ],
      },
      {
        title: 'Final thoughts',
        Icon: CheckCircle2,
        body: [
          'Improving patient retention does not have to be complicated. By making booking easier, communicating clearly, following up properly, and using the right tools, clinics can create a better experience that encourages patients to return.',
          'In the long run, small improvements can lead to stronger trust, better service, and healthier clinic growth.',
        ],
      },
    ],
  },
}

const POSTS = Object.entries(ARTICLE_DATA).map(([key, article]) => ({ ...article, key }))

function ArticleDetail({ article, articleRef, onClose }) {
  const HeroIcon = article.HeroIcon

  return (
    <article ref={articleRef} id={article.id} className="card overflow-hidden mb-8 scroll-mt-24">
      <div className={`bg-gradient-to-br ${article.gradient} px-5 py-8 sm:px-8 sm:py-10 text-white`}>
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
          <HeroIcon className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75 mb-3">{article.category}</p>
        <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-[-0.03em] mb-4">
          {article.title}
        </h2>
        <div className="space-y-3 text-white/85 text-sm sm:text-base leading-relaxed max-w-3xl">
          {article.intro.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className={article.numbered ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-6'}>
          {article.sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <section.Icon className={`w-5 h-5 ${article.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2 mb-3">
                    {article.numbered && (
                      <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                        {index + 1}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{section.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {section.body.map(paragraph => (
                      <p key={paragraph} className="text-slate-600 text-sm leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.bullets.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-sky-500" />
              <h3 className="font-display font-bold text-slate-900 text-lg">Ready to take the next step?</h3>
            </div>
            <p className="text-slate-500 text-sm">Find a verified clinic or contact our team for more guidance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">Close Article</button>
            <Link to="/browse" className="btn btn-primary btn-md shrink-0">Browse Clinics</Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Blog() {
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const articleRef = useRef(null)

  useEffect(() => {
    document.title = 'Blog | BookMyDentistPH'
  }, [])

  useEffect(() => {
    if (!selectedArticleId) return
    window.setTimeout(() => {
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }, [selectedArticleId])

  const selectedArticle = selectedArticleId ? ARTICLE_DATA[selectedArticleId] : null

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

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8" aria-label="Blog posts">
          {POSTS.map(post => {
            const isOpen = selectedArticleId === post.key
            const HeroIcon = post.HeroIcon

            return (
              <article key={post.title} className={`card p-5 sm:p-6 flex flex-col ${isOpen ? 'ring-2 ring-sky-200' : ''}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="badge badge-info">{post.category}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                  <HeroIcon className={`w-5 h-5 ${post.iconColor}`} />
                </div>
                <h2 className="font-display font-bold text-slate-900 text-xl mb-2">{post.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400">{post.readTime}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedArticleId(post.key)}
                    className="text-sky-600 text-sm font-bold inline-flex items-center gap-1 hover:text-sky-700"
                  >
                    {isOpen ? 'Reading now' : 'Read article'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        {selectedArticle ? (
          <ArticleDetail
            article={selectedArticle}
            articleRef={articleRef}
            onClose={() => setSelectedArticleId(null)}
          />
        ) : (
          <section className="card p-6 sm:p-8 mb-8 text-center border-dashed">
            <Search className="w-8 h-8 text-sky-300 mx-auto mb-3" />
            <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Choose an article to read</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Full articles stay hidden until selected so the blog page stays clean and easy to browse.
            </p>
          </section>
        )}

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
