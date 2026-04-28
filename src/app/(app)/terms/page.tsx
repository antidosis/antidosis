import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — antidosis",
  description: "Terms of service for the antidosis marketplace.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link href="/" className="inline-flex items-center text-[13px] text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/
        </Link>
      </div>

      <p className="text-[12px] text-[#7a6b5a] mb-4">$ cat /etc/antidosis/terms.txt</p>
      <h1 className="text-3xl font-bold mb-8">terms of service</h1>

      <div className="space-y-8 text-[15px] text-[#7a6b5a] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">1. acceptance of terms</h2>
          <p>By accessing or using antidosis, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all visitors, users, and others who access or use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">2. description of service</h2>
          <p>antidosis is a marketplace for reciprocal exchange. Users post needs (services, items, or skills they require) and offer something in exchange. Other users can respond with offers, form contracts, and exchange value directly.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">3. user accounts</h2>
          <p>You must provide accurate and complete information when creating an account. You are responsible for safeguarding your password and for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">4. user conduct</h2>
          <p>You agree not to use antidosis for any unlawful purpose or to solicit others to perform unlawful acts. Prohibited activities include: fraud, harassment, discrimination, posting false or misleading information, and attempting to circumvent the platform&apos;s payment or contract systems.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">5. contracts and exchanges</h2>
          <p>antidosis provides tools to facilitate agreements between users, but we are not a party to any contract. Users are solely responsible for fulfilling their obligations under any agreement. We do not guarantee the quality, safety, or legality of any exchange.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">6. reviews and ratings</h2>
          <p>Reviews must be honest and based on actual experience. You may not manipulate ratings, post fake reviews, or retaliate against users with negative feedback. We reserve the right to remove reviews that violate these standards.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">7. pro subscriptions</h2>
          <p>Pro subscriptions are billed through Stripe. You may cancel at any time through your account settings. Refunds are handled on a case-by-case basis. Pro features include dispute resolution support and enhanced profile visibility.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">8. limitation of liability</h2>
          <p>antidosis is provided &quot;as is&quot; without warranties of any kind. We are not liable for any disputes, losses, or damages arising from user interactions, exchanges, or contracts formed through the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">9. termination</h2>
          <p>We may terminate or suspend your account immediately for any violation of these terms. Upon termination, your right to use the service ceases immediately.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">10. changes to terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
        </section>

        <p className="text-[13px] text-[#7a6b5a]/50 pt-4">Last updated: {new Date().toLocaleDateString("en-AU")}</p>
      </div>
    </div>
  );
}
