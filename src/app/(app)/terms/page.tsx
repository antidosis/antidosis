import Link from "next/link";

import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — antidosis",
  description:
    "Terms of service for antidosis. Read the rules, responsibilities, and legal agreements governing use of our platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pb-20">
      <div className="py-6">
        <Link
          href="/"
          className="inline-flex items-center text-[13px] text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/
        </Link>
      </div>

      <p className="text-[12px] text-[#7a6b5a] mb-4">$ cat /etc/antidosis/terms-of-service.md</p>
      <h1 className="text-3xl font-bold mb-2 text-[#e8d5a3]">Terms of Service</h1>
      <p className="text-[13px] text-[#7a6b5a]/70 mb-10">
        Last updated: 17 May 2026 &middot; Please read these terms carefully before using antidosis
      </p>

      <article className="space-y-10 text-[15px] text-[#b8a078] leading-relaxed">
        {/* ── 1. Agreement to Terms ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">1. Agreement to Terms</h2>
          <p className="mb-3">
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement
            between you and <strong>Antidosis Pty Ltd</strong> (&quot;we&quot;, &quot;us&quot;,
            &quot;our&quot;, or &quot;antidosis&quot;) governing your access to and use of the
            antidosis platform, including our website at{" "}
            <Link href="https://www.antidosis.com" className="text-[#e8d5a3] hover:underline">
              www.antidosis.com
            </Link>{" "}
            and the antidosis mobile application (collectively, the &quot;Service&quot;).
          </p>
          <p className="mb-3">
            By creating an account, accessing, or using the Service, you agree to be bound by these
            Terms and our{" "}
            <Link href="/privacy" className="text-[#e8d5a3] hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree to these Terms, you must not access or use the Service.
          </p>
          <p>
            We may modify these Terms at any time. We will notify you of material changes by posting
            the updated Terms on this page with a revised &quot;Last updated&quot; date and, where
            appropriate, by email or in-app notification. Your continued use of the Service after
            changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        {/* ── 2. Description of Service ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">2. Description of Service</h2>
          <p className="mb-3">
            Antidosis is a community marketplace for reciprocal exchange. The Service enables users
            to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              Post &quot;needs&quot; — descriptions of services, items, or assistance they require
            </li>
            <li>
              Specify &quot;offers&quot; — what they are willing to provide in exchange (services,
              items, or monetary value)
            </li>
            <li>
              Express interest in other users&apos; needs and communicate through the platform
            </li>
            <li>Form binding exchange contracts with other users using our contract tools</li>
            <li>Build reputation through a review and rating system</li>
            <li>Participate in community terminal channels and direct messaging</li>
          </ul>
          <p>
            <strong>Important:</strong> Antidosis is a platform that connects users. We do not
            provide the services, items, or exchanges listed on the platform, nor do we guarantee
            the quality, safety, legality, or availability of any exchange. We are not a party to
            any contract or agreement formed between users through the Service.
          </p>
        </section>

        {/* ── 3. Eligibility ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">3. Eligibility</h2>
          <p className="mb-3">
            You must be at least <strong>18 years of age</strong> to create an account and use the
            Service. By registering, you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You are at least 18 years old</li>
            <li>You have the legal capacity to enter into binding contracts</li>
            <li>
              You will comply with these Terms and all applicable local, state, national, and
              international laws
            </li>
            <li>
              You have not previously been banned from the Service or similar platforms for
              violations of terms of service
            </li>
          </ul>
          <p className="mt-3">
            During our trial period, the Service is focused on the{" "}
            <strong>Central Coast, NSW, Australia</strong> region. Users outside this region may
            have limited functionality.
          </p>
        </section>

        {/* ── 4. User Accounts ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            4. User Accounts and Security
          </h2>
          <p className="mb-3">
            To use most features of the Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              Provide accurate, current, and complete information during registration and keep it
              updated
            </li>
            <li>
              Maintain the security of your account credentials and not share them with any third
              party
            </li>
            <li>Notify us immediately of any unauthorized access to or use of your account</li>
            <li>Accept responsibility for all activities that occur under your account</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate your account if any information provided
            during registration or thereafter proves to be inaccurate, false, or misleading.
          </p>
        </section>

        {/* ── 5. User Conduct ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            5. User Conduct and Prohibited Activities
          </h2>
          <p className="mb-3">
            You agree not to use the Service for any unlawful purpose or in any way that could
            damage, disable, overburden, or impair the Service. Specifically, you must not:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              Post false, misleading, fraudulent, or deceptive content, including fake needs,
              offers, or credentials
            </li>
            <li>
              Harass, bully, intimidate, threaten, or discriminate against any user or group of
              users
            </li>
            <li>
              Solicit or engage in illegal activities, including the sale of illegal goods or
              services
            </li>
            <li>
              Circumvent or attempt to circumvent the platform&apos;s payment, contract, or review
              systems
            </li>
            <li>
              Impersonate any person or entity, or falsely state or otherwise misrepresent your
              affiliation with a person or entity
            </li>
            <li>
              Upload viruses, malware, or other harmful code, or attempt to gain unauthorized access
              to the Service or its systems
            </li>
            <li>
              Scrape, crawl, spider, or use any automated means to access the Service without our
              express written permission
            </li>
            <li>Collect or harvest personal information of other users without their consent</li>
            <li>
              Post content that infringes intellectual property rights, including copyright,
              trademark, or trade secret rights
            </li>
            <li>
              Manipulate reviews, ratings, or reputation scores, including posting fake reviews or
              coercing others to post positive reviews
            </li>
            <li>Use the Service to transmit unsolicited commercial messages (spam)</li>
          </ul>
          <p>
            We reserve the right to investigate and take appropriate legal action against anyone who
            violates these provisions, including removing content, suspending or terminating
            accounts, and reporting violations to law enforcement authorities.
          </p>
        </section>

        {/* ── 6. Needs, Offers, and Acceptances ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            6. Needs, Offers, and Acceptances
          </h2>
          <p className="mb-3">
            When you post a need on the Service, you create a public listing that other users can
            view and respond to. When you express interest in another user&apos;s need, you are
            initiating a potential exchange relationship.
          </p>
          <p className="mb-3">
            <strong>You acknowledge and agree that:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Posting a need or expressing interest does not create a binding contract. A binding
              contract is only formed when both parties actively agree to terms using the contract
              formation tools provided by the Service
            </li>
            <li>
              You are solely responsible for the accuracy and legality of the content you post
            </li>
            <li>
              We do not verify, endorse, or guarantee the accuracy of any need, offer, or user
              profile information
            </li>
            <li>
              You are responsible for assessing the suitability, reliability, and trustworthiness of
              other users before entering into any agreement
            </li>
          </ul>
        </section>

        {/* ── 7. Contracts ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            7. Contracts and Binding Agreements
          </h2>
          <p className="mb-3">
            The Service provides tools to facilitate the creation of binding exchange contracts
            between users. These contracts may include terms of exchange, deadlines, completion
            methods, and digital signatures.
          </p>
          <p className="mb-3">
            <strong>Critical disclaimers:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              <strong>We are not a party to any contract</strong> formed between users. Contracts
              are solely between the participating users
            </li>
            <li>
              We do not guarantee that any party will fulfil their obligations under a contract
            </li>
            <li>
              We do not guarantee the quality, safety, legality, or deliverability of any service,
              item, or monetary exchange
            </li>
            <li>
              We do not provide legal advice. The contract tools are provided for convenience and do
              not constitute legal documents unless the parties independently choose to treat them
              as such under applicable law
            </li>
            <li>
              Users are solely responsible for ensuring that their exchanges comply with all
              applicable laws, including taxation, licensing, and consumer protection laws
            </li>
          </ul>
          <p className="mb-3">
            <strong>Cancellation and disputes:</strong> The Service provides mechanisms for contract
            cancellation, including mutual agreement, requested cancellation with response, and
            escalation to admin review. However, we are under no obligation to intervene in disputes
            between users. Pro members may receive enhanced dispute resolution support at our sole
            discretion.
          </p>
        </section>

        {/* ── 8. Reviews and Ratings ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">8. Reviews and Ratings</h2>
          <p className="mb-3">
            The Service includes a review system where users can rate and comment on their
            experience with other users following a completed exchange or acceptance.
          </p>
          <p className="mb-3">
            <strong>By submitting a review, you agree that:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Your review is based on your genuine, firsthand experience with the other user</li>
            <li>You will not submit false, defamatory, or misleading reviews</li>
            <li>
              You will not manipulate ratings or attempt to artificially inflate or deflate another
              user&apos;s reputation score
            </li>
            <li>
              You will not retaliate against another user with negative feedback for reasons
              unrelated to the exchange
            </li>
          </ul>
          <p>
            We reserve the right to remove reviews that violate these standards or our general
            content policies, without notice and at our sole discretion.
          </p>
        </section>

        {/* ── 9. Pro Membership ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">9. Pro Membership (Free)</h2>
          <p className="mb-3">
            Antidosis offers an optional &quot;Pro&quot; membership tier with enhanced features
            (badge, directory listing, priority support). Pro is <strong>free</strong>: there are no
            fees, subscriptions, recurring billing, or payment details collected for it.
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              <strong>Eligibility</strong> — Pro is granted to users who complete identity
              verification (a government-issued ID reviewed by our team) and mobile-number
              verification
            </li>
            <li>
              <strong>Revocation</strong> — we may revoke Pro status, without refund liability (as
              no payment is taken), if verification documents are found to be false or misleading,
              or for abuse of the Service
            </li>
            <li>
              <strong>No charge, ever</strong> — because Pro is free, no cancellation, refund, or
              price-change terms apply to it
            </li>
            <li>
              <strong>Future paid features</strong> — if Antidosis introduces paid features in
              future, these Terms will be updated and reasonable notice provided before any charge
              applies
            </li>
          </ul>
        </section>

        {/* ── 10. Intellectual Property ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">10. Intellectual Property</h2>
          <p className="mb-3">
            <strong>Our content:</strong> The Service and its original content (excluding
            user-generated content), features, and functionality are and will remain the exclusive
            property of Antidosis Pty Ltd and its licensors. The Service is protected by copyright,
            trademark, and other laws of Australia and foreign countries.
          </p>
          <p className="mb-3">
            <strong>Your content:</strong> You retain ownership of any content you post, upload, or
            submit to the Service (&quot;User Content&quot;). By posting User Content, you grant us
            a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to
            use, reproduce, distribute, prepare derivative works of, display, and perform your User
            Content in connection with the Service.
          </p>
          <p>
            <strong>Feedback:</strong> If you provide us with feedback, suggestions, or ideas about
            the Service, you grant us a perpetual, irrevocable, royalty-free, worldwide license to
            use and incorporate that feedback into the Service without any obligation to compensate
            you.
          </p>
        </section>

        {/* ── 11. Content Moderation ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            11. Content Moderation and Removal
          </h2>
          <p className="mb-3">
            We are not obligated to monitor the Service for inappropriate content. However, we
            reserve the right, in our sole discretion, to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              Review, monitor, or remove any User Content at any time, for any reason, without
              notice
            </li>
            <li>Suspend or terminate the account of any user who violates these Terms</li>
            <li>Report illegal activity or content to appropriate law enforcement authorities</li>
            <li>Cooperate with law enforcement and comply with legal process</li>
          </ul>
          <p>We have no liability to you for removing or refusing to post any User Content.</p>
        </section>

        {/* ── 12. Termination ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">12. Termination</h2>
          <p className="mb-3">
            <strong>By you:</strong> You may terminate your account at any time by contacting us at{" "}
            <a href="mailto:support@antidosis.com" className="text-[#e8d5a3] hover:underline">
              support@antidosis.com
            </a>
            . Upon termination, your right to use the Service ceases immediately.
          </p>
          <p className="mb-3">
            <strong>By us:</strong> We may suspend or terminate your account immediately, without
            prior notice or liability, for any reason, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Violation of these Terms</li>
            <li>Fraudulent, deceptive, or illegal activity</li>
            <li>Creation of risk or legal exposure for us or other users</li>
            <li>Extended periods of inactivity</li>
          </ul>
          <p>
            Upon termination, all provisions of these Terms which by their nature should survive
            termination shall survive, including intellectual property provisions, warranty
            disclaimers, indemnity, and limitations of liability.
          </p>
        </section>

        {/* ── 13. Disclaimers ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            13. Disclaimers and Limitation of Liability
          </h2>
          <p className="mb-3">
            <strong>The Service is provided &quot;as is&quot; and &quot;as available&quot;</strong>{" "}
            without warranties of any kind, either express or implied, including, but not limited
            to, implied warranties of merchantability, fitness for a particular purpose, or
            non-infringement.
          </p>
          <p className="mb-3">Specifically, we do not warrant that:</p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
            <li>The results obtained from using the Service will be accurate or reliable</li>
            <li>Any user will fulfil their obligations under any contract or agreement</li>
            <li>Any exchange of goods, services, or value will be safe, legal, or satisfactory</li>
            <li>Defects in the Service will be corrected</li>
          </ul>
          <p className="mb-3">
            <strong>To the maximum extent permitted by law:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              We are not liable for any disputes, losses, damages, or injuries arising from user
              interactions, exchanges, or contracts formed through the platform
            </li>
            <li>
              We are not liable for any indirect, incidental, special, consequential, or punitive
              damages, including loss of profits, data, or goodwill
            </li>
            <li>
              Our total liability to you for any claims arising from or relating to the Service is
              limited to the amount you paid us (if any) in the 12 months preceding the claim, or
              AUD $100, whichever is greater
            </li>
          </ul>
          <p>
            Some jurisdictions do not allow the exclusion or limitation of certain damages, so the
            above limitations may not apply to you.
          </p>
        </section>

        {/* ── 14. Indemnification ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">14. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Antidosis Pty Ltd, its directors,
            officers, employees, agents, and affiliates from and against any and all claims,
            liabilities, damages, losses, costs, and expenses (including reasonable legal fees)
            arising out of or in any way connected with: (a) your access to or use of the Service;
            (b) your User Content; (c) your violation of these Terms; (d) your violation of any
            third-party right, including intellectual property or privacy rights; or (e) any dispute
            between you and another user.
          </p>
        </section>

        {/* ── 15. Dispute Resolution ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">15. Dispute Resolution</h2>
          <p className="mb-3">
            <strong>Informal resolution:</strong> Before filing any formal legal proceeding, you
            agree to contact us at{" "}
            <a href="mailto:support@antidosis.com" className="text-[#e8d5a3] hover:underline">
              support@antidosis.com
            </a>{" "}
            and attempt to resolve the dispute informally for at least 30 days.
          </p>
          <p className="mb-3">
            <strong>Governing law:</strong> These Terms are governed by and construed in accordance
            with the laws of <strong>New South Wales, Australia</strong>, without regard to its
            conflict of law provisions.
          </p>
          <p>
            <strong>Jurisdiction:</strong> Any legal action or proceeding arising out of or relating
            to these Terms shall be brought exclusively in the courts of New South Wales, Australia.
            You consent to the personal jurisdiction of such courts.
          </p>
        </section>

        {/* ── 16. Severability ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">16. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid, illegal, or unenforceable by a
            court of competent jurisdiction, such provision shall be severed from these Terms and
            the remaining provisions shall continue in full force and effect.
          </p>
        </section>

        {/* ── 17. Entire Agreement ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">17. Entire Agreement</h2>
          <p>
            These Terms, together with our{" "}
            <Link href="/privacy" className="text-[#e8d5a3] hover:underline">
              Privacy Policy
            </Link>
            , constitute the entire agreement between you and Antidosis Pty Ltd regarding the
            Service and supersede all prior agreements, understandings, and communications, whether
            written or oral.
          </p>
        </section>

        {/* ── 18. Contact ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">18. Contact Us</h2>
          <p className="mb-3">If you have any questions about these Terms, please contact us:</p>
          <div className="pl-4 border-l-2 border-[#7a6b5a]/30">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@antidosis.com" className="text-[#e8d5a3] hover:underline">
                support@antidosis.com
              </a>
            </p>
            <p>
              <strong>Entity:</strong> Antidosis Pty Ltd
            </p>
            <p>
              <strong>Website:</strong>{" "}
              <Link href="https://www.antidosis.com" className="text-[#e8d5a3] hover:underline">
                www.antidosis.com
              </Link>
            </p>
          </div>
        </section>

        <p className="text-[13px] text-[#7a6b5a]/50 pt-6 border-t border-[#7a6b5a]/10">
          Last updated: 17 May 2026
        </p>
      </article>
    </div>
  );
}
