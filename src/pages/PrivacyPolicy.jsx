import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const LAST_UPDATED = 'March 31, 2026'

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-slate-900 text-lg mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="section-label mb-2">Legal</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-5 text-sm text-emerald-700">
            Your privacy matters to us. This policy explains what data we collect, why we collect it, and how we protect it. We will never sell your personal information.
          </div>
        </div>

        <div className="card p-8">

          <Section title="1. Who We Are">
            <p>BookMyDentistPH ("we", "us", "our") operates the dental appointment booking platform at <strong>bookmydentistph.com</strong>. We are the data controller for personal information collected through our platform.</p>
            <p>For privacy-related concerns, contact us at: <a href="mailto:hello@bookmydentistph.com" className="text-sky-600 hover:underline">hello@bookmydentistph.com</a></p>
          </Section>

          <Section title="2. What Information We Collect">
            <p><strong>Information you provide directly:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full name and email address (when creating an account)</li>
              <li>Mobile phone number (optional, for SMS notifications)</li>
              <li>Profile photo (optional)</li>
              <li>Clinic information (for clinic owners: clinic name, address, phone, description, images)</li>
              <li>Appointment notes you provide when booking</li>
              <li>Reviews you submit for completed appointments</li>
            </ul>
            <p><strong>Information collected automatically:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Appointment history (dates, times, services, statuses)</li>
              <li>Device type and browser information</li>
              <li>Pages visited and interactions within the platform</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account</li>
              <li>Process appointment bookings and send confirmation notifications</li>
              <li>Send email and SMS alerts about your appointments (confirmations, reminders, cancellations)</li>
              <li>Enable clinics to manage their appointments and patient records</li>
              <li>Display public reviews to help patients make informed choices</li>
              <li>Improve the platform and fix technical issues</li>
              <li>Comply with Philippine laws and regulations</li>
            </ul>
            <p>We will never use your information for purposes beyond what is listed here without your explicit consent.</p>
          </Section>

          <Section title="4. How We Share Your Information">
            <p><strong>We do not sell your personal information.</strong> We share your information only in the following limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>With clinics:</strong> When you book an appointment, the clinic receives your name, contact details, and appointment information to serve you</li>
              <li><strong>With service providers:</strong> We use Supabase (database & authentication) and Resend (email delivery) to operate the platform. These providers process data on our behalf and are bound by confidentiality agreements</li>
              <li><strong>Legal compliance:</strong> If required by Philippine law, court order, or government authority</li>
            </ul>
          </Section>

          <Section title="5. Data Storage & Security">
            <p>Your data is stored on Supabase infrastructure, which uses industry-standard encryption at rest and in transit (TLS/SSL). We implement row-level security (RLS) policies to ensure you can only access your own data.</p>
            <p>While we take reasonable precautions, no system is 100% secure. In the event of a data breach affecting your rights, we will notify you as required by applicable law.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>Under the Philippine Data Privacy Act of 2012 (Republic Act 10173), you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> — Request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — Update inaccurate or incomplete information (via your Profile settings)</li>
              <li><strong>Deletion</strong> — Request deletion of your account and associated data</li>
              <li><strong>Portability</strong> — Request your data in a machine-readable format</li>
              <li><strong>Object</strong> — Object to certain types of processing</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:hello@bookmydentistph.com" className="text-sky-600 hover:underline">hello@bookmydentistph.com</a>. We will respond within 15 business days.</p>
          </Section>

          <Section title="7. Cookies & Local Storage">
            <p>We use browser local storage and session storage to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keep you signed in across page refreshes</li>
              <li>Remember your onboarding preferences</li>
            </ul>
            <p>We do not use third-party advertising cookies. You can clear your browser storage at any time through your browser settings.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>Our platform is intended for users 18 years and older. We do not knowingly collect personal information from children under 18. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</p>
          </Section>

          <Section title="9. Third-Party Links">
            <p>Our platform may contain links to external websites (such as clinic websites). We are not responsible for the privacy practices of third-party sites. We encourage you to review their privacy policies before sharing personal information.</p>
          </Section>

          <Section title="10. Retention">
            <p>We retain your personal data for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>
            <p>Anonymized, aggregated data (e.g. total bookings per month) may be retained indefinitely for analytics purposes.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email. The "last updated" date at the top of this page reflects the most recent revision.</p>
          </Section>

          <Section title="12. Contact & Complaints">
            <p>For privacy questions or to exercise your rights:</p>
            <ul className="list-none space-y-1">
              <li>📧 Email: <a href="mailto:hello@bookmydentistph.com" className="text-sky-600 hover:underline">hello@bookmydentistph.com</a></li>
              <li>🌐 Website: <Link to="/contact" className="text-sky-600 hover:underline">bookmydentistph.com/contact</Link></li>
            </ul>
            <p className="mt-2">You also have the right to lodge a complaint with the <strong>National Privacy Commission of the Philippines</strong> at <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">privacy.gov.ph</a> if you believe your data rights have been violated.</p>
          </Section>

        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
          <Link to="/terms" className="btn btn-secondary btn-md">Terms of Service →</Link>
        </div>
      </div>
    </div>
  )
}