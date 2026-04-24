import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — antidosis",
  description: "Privacy policy for the antidosis marketplace.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href="/" className="inline-flex items-center text-[13px] text-[#7a6b4a] hover:text-[#e8c97c] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/
        </Link>
      </div>

      <p className="text-[12px] text-[#7a6b4a] mb-4">$ cat /etc/antidosis/privacy.txt</p>
      <h1 className="text-3xl font-bold mb-8">privacy policy</h1>

      <div className="space-y-8 text-[15px] text-[#7a6b4a] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">1. information we collect</h2>
          <p>We collect information you provide directly: name, email, location, bio, skills, social links, and profile photos. We also collect data about your activity on the platform: needs posted, offers made, contracts formed, messages sent, and reviews given.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">2. how we use your information</h2>
          <p>We use your data to operate the marketplace: matching needs with offers, enabling messaging, calculating ratings, and sending transactional notifications. We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">3. data storage and security</h2>
          <p>Your data is stored on Supabase, a SOC 2 Type II compliant platform. Passwords are hashed and never stored in plain text. Images are stored in Supabase Storage with access controlled by authentication. We use HTTPS for all data transmission.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">4. cookies and tracking</h2>
          <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies or analytics pixels. Your browsing activity is not tracked across other websites.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">5. third-party services</h2>
          <p>We use Stripe for payment processing and Resend for transactional emails. These services have their own privacy policies and are bound by strict data protection requirements. We only share the minimum data necessary with each service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">6. your rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You can update your profile at any time through the dashboard. To delete your account and all associated data, contact us at the email below.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">7. data retention</h2>
          <p>We retain your data for as long as your account is active. If you delete your account, we remove your personal information within 30 days. Some data (such as anonymized transaction records) may be retained for legal and fraud prevention purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">8. children&apos;s privacy</h2>
          <p>antidosis is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a minor, contact us immediately.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">9. changes to this policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of significant changes via email or a notice on the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8c97c] mb-3">10. contact us</h2>
          <p>For privacy-related questions or data deletion requests, contact us at: <span className="text-[#e8c97c]">privacy@antidosis.com</span></p>
        </section>

        <p className="text-[13px] text-[#7a6b4a]/50 pt-4">Last updated: {new Date().toLocaleDateString("en-AU")}</p>
      </div>
    </div>
  );
}
