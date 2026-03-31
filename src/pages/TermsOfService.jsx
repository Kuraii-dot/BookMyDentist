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

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="section-label mb-2">Legal</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mt-5 text-sm text-sky-700">
            Please read these Terms of Service carefully before using BookMyDentistPH. By creating an account or using our platform, you agree to be bound by these terms.
          </div>
        </div>

        <div className="card p-8">

          <Section title="1. About BookMyDentistPH">
            <p>BookMyDentistPH ("we", "us", "our") is an online booking platform that connects patients with dental clinics in the Philippines. We are registered and operating in the Republic of the Philippines.</p>
            <p>Our platform is available at <strong>bookmydentistph.com</strong> and through any associated mobile or web applications.</p>
          </Section>

          <Section title="2. Acceptance of Terms">
            <p>By accessing or using BookMyDentistPH, you confirm that you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Are at least 18 years of age, or have the consent of a parent or guardian</li>
              <li>Have read, understood, and agree to these Terms</li>
              <li>Agree to our Privacy Policy, which is incorporated into these Terms by reference</li>
            </ul>
            <p>If you do not agree to these Terms, please do not use our platform.</p>
          </Section>

          <Section title="3. Platform Role — Not a Medical Provider">
            <p><strong>BookMyDentistPH is a booking platform, not a medical provider.</strong> We do not provide dental services, medical advice, diagnoses, or treatment recommendations.</p>
            <p>All dental services are performed by independent dental clinics and practitioners. We are not responsible for the quality, safety, or outcome of any dental treatment you receive.</p>
            <p>In case of a dental emergency, please contact your dentist directly or visit the nearest hospital.</p>
          </Section>

          <Section title="4. User Accounts">
            <p>You must create an account to book appointments. You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keeping your login credentials confidential</li>
              <li>All activity that occurs under your account</li>
              <li>Providing accurate and up-to-date information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
          </Section>

          <Section title="5. Clinic Listings & Verification">
            <p>Dental clinics that list on BookMyDentistPH undergo a manual review process by our admin team before their listing goes live. However, we do not guarantee the accuracy of clinic information, credentials, or the quality of services provided.</p>
            <p>Clinics are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining accurate profiles, services, and availability</li>
              <li>Honoring confirmed appointments in a timely manner</li>
              <li>Providing services as advertised on the platform</li>
              <li>Complying with all applicable Philippine laws and regulations</li>
            </ul>
          </Section>

          <Section title="6. Booking & Appointments">
            <p>When you submit a booking request through our platform:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The request is sent to the clinic for confirmation — it is not automatically confirmed</li>
              <li>The clinic may accept, decline, or propose a new schedule</li>
              <li>You will receive an email notification once the clinic responds</li>
            </ul>
            <p>BookMyDentistPH is not liable for appointment cancellations, no-shows, or changes made by either the patient or the clinic.</p>
          </Section>

          <Section title="7. Cancellations & Rescheduling">
            <p>You may cancel upcoming appointments through your dashboard. We ask that you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cancel as early as possible out of consideration for the clinic's schedule</li>
              <li>Provide a reason for cancellation</li>
            </ul>
            <p>Clinics may also cancel or reschedule appointments due to emergencies. You will be notified and given the option to accept or decline the new schedule.</p>
          </Section>

          <Section title="8. Reviews & User Content">
            <p>Users may submit reviews for completed appointments. By submitting a review, you confirm that it is honest, based on your real experience, and does not contain:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>False or misleading information</li>
              <li>Personal attacks on clinic staff</li>
              <li>Spam, promotional content, or irrelevant information</li>
            </ul>
            <p>We reserve the right to remove reviews that violate these guidelines.</p>
          </Section>

          <Section title="9. Privacy & Data">
            <p>We collect and process personal data as described in our <Link to="/privacy" className="text-sky-600 hover:underline font-medium">Privacy Policy</Link>. By using our platform, you consent to this processing.</p>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the maximum extent permitted by Philippine law, BookMyDentistPH shall not be liable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any dental treatment outcomes or medical complications</li>
              <li>Loss of data, revenue, or business opportunity</li>
              <li>Actions or omissions of clinic partners</li>
              <li>Technical interruptions or platform downtime</li>
            </ul>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>We may update these Terms from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="12. Governing Law">
            <p>These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved under Philippine jurisdiction.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>If you have questions about these Terms, please contact us:</p>
            <ul className="list-none space-y-1">
              <li>📧 Email: <a href="mailto:hello@bookmydentistph.com" className="text-sky-600 hover:underline">hello@bookmydentistph.com</a></li>
              <li>🌐 Website: <Link to="/contact" className="text-sky-600 hover:underline">bookmydentistph.com/contact</Link></li>
            </ul>
          </Section>

        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
          <Link to="/privacy" className="btn btn-secondary btn-md">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  )
}