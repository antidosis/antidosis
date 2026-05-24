import Link from "next/link";

import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — antidosis",
  description:
    "Privacy policy for antidosis. Learn how we collect, use, store, and protect your personal information.",
};

export default function PrivacyPage() {
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

      <p className="text-[12px] text-[#7a6b5a] mb-4">$ cat /etc/antidosis/privacy-policy.md</p>
      <h1 className="text-3xl font-bold mb-2 text-[#e8d5a3]">Privacy Policy</h1>
      <p className="text-[13px] text-[#7a6b5a]/70 mb-10">
        Last updated: 17 May 2026 &middot; Applies to the antidosis website and mobile application
      </p>

      <article className="space-y-10 text-[15px] text-[#b8a078] leading-relaxed">
        {/* ── 1. Introduction ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">1. Introduction</h2>
          <p className="mb-3">
            Antidosis Pty Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the
            antidosis platform (the &quot;Service&quot;), accessible via{" "}
            <Link href="https://www.antidosis.com" className="text-[#e8d5a3] hover:underline">
              www.antidosis.com
            </Link>{" "}
            and the antidosis mobile application.
          </p>
          <p className="mb-3">
            This Privacy Policy explains how we collect, use, store, disclose, and protect your
            personal information when you use our Service. We are committed to protecting your
            privacy in accordance with the <em>Australian Privacy Principles</em> (APPs) contained
            in the <em>Privacy Act 1988</em> (Cth) and other applicable privacy laws.
          </p>
          <p>
            By using the Service, you consent to the collection, use, and disclosure of your
            personal information as described in this Privacy Policy. If you do not agree with this
            policy, please do not use the Service.
          </p>
        </section>

        {/* ── 2. Information We Collect ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">2. Information We Collect</h2>
          <p className="mb-3">
            We collect information that you provide directly to us, information generated
            automatically through your use of the Service, and information from third-party
            services.
          </p>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            2.1 Account and Authentication Information
          </h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              <strong>Email address</strong> — required for account creation and authentication
            </li>
            <li>
              <strong>Password</strong> — hashed and stored by our authentication provider
              (Supabase); we never store or access your plain-text password
            </li>
            <li>
              <strong>Full name</strong> — optional, displayed on your public profile
            </li>
            <li>
              <strong>Mobile phone number</strong> — optional, used for account verification and
              optional two-factor authentication
            </li>
            <li>
              <strong>Email verification status</strong> — whether you have confirmed your email
              address
            </li>
            <li>
              <strong>Mobile verification status</strong> — whether you have verified your mobile
              number via SMS OTP
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            2.2 Profile Information
          </h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              <strong>Bio / description</strong> — optional text you provide about yourself
            </li>
            <li>
              <strong>Profile avatar / photo</strong> — optional image uploaded by you
            </li>
            <li>
              <strong>Location</strong> — suburb name (e.g., &quot;Terrigal&quot;) and optional
              precise latitude/longitude coordinates
            </li>
            <li>
              <strong>Public phone number</strong> — optional, visible to other users on your
              profile
            </li>
            <li>
              <strong>Private phone number</strong> — optional, stored for your records only, not
              visible to other users
            </li>
            <li>
              <strong>Social links</strong> — platform name and URL (e.g., LinkedIn, Instagram); you
              control whether each is public or private
            </li>
            <li>
              <strong>Skills</strong> — names and categories of skills you list
            </li>
            <li>
              <strong>Credentials</strong> — certificates, licenses, or ID documents you upload for
              verification (e.g., title, issuer, document number, expiry date, scanned images)
            </li>
            <li>
              <strong>Directory visibility preference</strong> — whether your profile appears in the
              public Pro directory
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            2.3 Activity and Transaction Data
          </h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              <strong>Needs posted</strong> — titles, descriptions, categories, offer types, offer
              descriptions, estimated values, locations, deadlines, time estimates, required skills,
              and photos
            </li>
            <li>
              <strong>Acceptances / expressions of interest</strong> — messages you send when
              expressing interest in a need
            </li>
            <li>
              <strong>Contracts</strong> — terms, signatures, status updates, completion
              confirmations, cancellation requests and reasons, escalation records
            </li>
            <li>
              <strong>Messages</strong> — content of messages sent through need discussions,
              contract discussions, terminal channels, and direct messages
            </li>
            <li>
              <strong>Reviews and ratings</strong> — ratings (1-10), comments, and optional private
              feedback you submit about other users
            </li>
            <li>
              <strong>Reactions</strong> — emoji reactions to messages in channels and direct
              messages
            </li>
            <li>
              <strong>Blocks and friend connections</strong> — users you have blocked or friended
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            2.4 Payment Information
          </h3>
          <p className="mb-3">
            For Pro subscriptions, we use <strong>Stripe</strong> to process payments. We do not
            collect or store your credit card details, banking information, or other payment method
            details. Stripe provides us with:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Stripe customer ID</li>
            <li>Stripe subscription ID</li>
            <li>Subscription status (active, cancelled, expired)</li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            2.5 Automatically Collected Information
          </h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              <strong>IP address</strong> — collected in server logs and audit logs for security and
              fraud prevention
            </li>
            <li>
              <strong>User agent string</strong> — browser/app version and operating system
              information
            </li>
            <li>
              <strong>Request paths and timestamps</strong> — for audit logging and rate limiting
            </li>
            <li>
              <strong>Push notification tokens</strong> — device tokens required to send push
              notifications to your mobile device (stored locally on the device; not stored on our
              servers)
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">2.6 Uploaded Media</h3>
          <p className="mb-3">
            You may upload images (JPEG, PNG, WebP, GIF) and audio files (WebM, OGG, WAV, MP3) up to
            10MB per file. This includes need photos, offer photos, profile avatars, and credential
            documents. Files are scanned for valid type signatures (magic bytes) before storage.
          </p>
          <p>
            The mobile app may access your device <strong>camera</strong> to capture photos for
            profile avatars, need listings, and credential documents. Camera access is optional —
            you may also select existing photos from your device gallery.
          </p>
        </section>

        {/* ── 3. How We Use Your Information ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            3. How We Use Your Information
          </h2>
          <p className="mb-3">We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>To operate the Service</strong> — matching users with complementary needs and
              offers, enabling messaging, facilitating contract formation, and calculating
              reputation scores
            </li>
            <li>
              <strong>To authenticate and secure your account</strong> — verifying your identity,
              preventing unauthorized access, and detecting suspicious activity
            </li>
            <li>
              <strong>To communicate with you</strong> — sending transactional emails and push
              notifications about your needs, acceptances, contracts, messages, and account activity
            </li>
            <li>
              <strong>To maintain trust and safety</strong> — verifying credentials, investigating
              disputes, enforcing our Terms of Service, and preventing fraud
            </li>
            <li>
              <strong>To improve the Service</strong> — analyzing usage patterns (using aggregated,
              de-identified data) to fix bugs and enhance features
            </li>
            <li>
              <strong>To comply with legal obligations</strong> — responding to lawful requests,
              preserving records for legal proceedings, and meeting regulatory requirements
            </li>
            <li>
              <strong>To process payments</strong> — managing Pro subscriptions through Stripe
            </li>
          </ul>
        </section>

        {/* ── 4. Legal Basis for Processing ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            4. Legal Basis for Processing
          </h2>
          <p className="mb-3">
            Under the <em>Australian Privacy Principles</em>, we collect and handle your personal
            information based on the following grounds:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Consent</strong> — where you voluntarily provide information such as your bio,
              profile photo, skills, and social links
            </li>
            <li>
              <strong>Contractual necessity</strong> — information required to provide the Service,
              such as your email, need details, and contract data
            </li>
            <li>
              <strong>Legitimate interests</strong> — security measures, fraud prevention, audit
              logging, and service improvement
            </li>
            <li>
              <strong>Legal obligation</strong> — compliance with applicable laws, court orders, or
              regulatory requirements
            </li>
          </ul>
        </section>

        {/* ── 5. How We Share Your Information ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            5. How We Share Your Information
          </h2>
          <p className="mb-3">
            We do <strong>not</strong> sell, rent, or trade your personal information to third
            parties for marketing purposes.
          </p>
          <p className="mb-3">We share information only in the following circumstances:</p>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            5.1 With Other Users
          </h3>
          <p className="mb-3">
            By design, antidosis is a marketplace that connects people. The following information is
            visible to other users:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              Your <strong>public profile</strong>: full name, avatar, bio, location (suburb),
              public phone number, skills, public social links, public credentials, reviews
              received, and open needs posted
            </li>
            <li>
              <strong>Need details</strong>: everything you include in a need post (title,
              description, photos, offer details, location, required skills)
            </li>
            <li>
              <strong>Messages</strong>: content of messages you send in need discussions, contract
              discussions, terminal channels, and direct messages
            </li>
            <li>
              <strong>Contract information</strong>: terms, signatures, and status shared between
              the contract parties
            </li>
            <li>
              <strong>Reviews</strong>: ratings and comments you leave about other users (private
              feedback is not shared)
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            5.2 With Service Providers
          </h3>
          <p className="mb-3">
            We engage trusted third-party service providers to perform functions on our behalf.
            These providers have access to personal information only to the extent necessary to
            perform their services and are contractually bound to protect it:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>
              <strong>Supabase</strong> — cloud database, authentication, and file storage. Data is
              stored on Supabase&apos;s infrastructure. Supabase is SOC 2 Type II compliant.
            </li>
            <li>
              <strong>Stripe</strong> — payment processing for Pro subscriptions. Stripe handles all
              payment card data. See{" "}
              <Link
                href="https://stripe.com/au/privacy"
                className="text-[#e8d5a3] hover:underline"
                target="_blank"
              >
                Stripe&apos;s Privacy Policy
              </Link>
              .
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery (e.g., contract notifications,
              interest alerts). Resend processes your email address and message content. See{" "}
              <Link
                href="https://resend.com/legal/privacy-policy"
                className="text-[#e8d5a3] hover:underline"
                target="_blank"
              >
                Resend&apos;s Privacy Policy
              </Link>
              .
            </li>
          </ul>

          <h3 className="text-base font-medium text-[#e8d5a3]/90 mb-2 mt-4">
            5.3 For Legal and Safety Reasons
          </h3>
          <p>
            We may disclose your information if required by law, subpoena, court order, or other
            legal process, or if we believe in good faith that disclosure is necessary to protect
            our rights, property, or safety, or the rights, property, or safety of our users or the
            public.
          </p>
        </section>

        {/* ── 6. Data Storage and Security ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            6. Data Storage and Security
          </h2>
          <p className="mb-3">
            We take the security of your personal information seriously and implement appropriate
            technical and organisational measures to protect it.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Encryption in transit</strong> — all data transmitted between your device and
              our servers is protected using TLS 1.2+ (HTTPS)
            </li>
            <li>
              <strong>Encryption at rest</strong> — database and file storage are encrypted by our
              cloud provider (Supabase)
            </li>
            <li>
              <strong>Password security</strong> — passwords are hashed using bcrypt by Supabase
              Auth; we never store or access plain-text passwords
            </li>
            <li>
              <strong>Access controls</strong> — Row Level Security (RLS) on the database ensures
              users can only access their own data unless explicitly shared
            </li>
            <li>
              <strong>Rate limiting</strong> — API endpoints are rate-limited to prevent abuse and
              brute-force attacks
            </li>
            <li>
              <strong>Audit logging</strong> — security-relevant events (logins, contract signings,
              data modifications) are logged for fraud detection and investigation
            </li>
            <li>
              <strong>File validation</strong> — uploaded files are validated by content signature
              (magic bytes) before storage to prevent malicious uploads
            </li>
          </ul>
          <p className="mt-3">
            Despite these measures, no method of electronic storage or transmission over the
            Internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        {/* ── 7. Data Retention and Deletion ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            7. Data Retention and Deletion
          </h2>
          <p className="mb-3">
            We retain your personal information for as long as your account is active or as long as
            necessary to provide the Service, comply with legal obligations, resolve disputes, and
            enforce our agreements.
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              <strong>Active accounts</strong> — data is retained indefinitely while your account
              remains active
            </li>
            <li>
              <strong>Deleted needs and contracts</strong> — when you delete a need, associated
              acceptances and messages are removed. Contract records may be retained in an
              anonymised form for dispute resolution and legal compliance
            </li>
            <li>
              <strong>Account deletion</strong> — upon request, we will delete your account and
              associated personal data within 30 days. Some data may be retained longer where
              required by law or for legitimate business purposes (e.g., anonymised transaction
              records for fraud prevention)
            </li>
            <li>
              <strong>Audit logs</strong> — retained for 12 months for security and compliance
              purposes
            </li>
          </ul>
          <p>
            To request deletion of your account and personal data, contact us at{" "}
            <a href="mailto:privacy@antidosis.com" className="text-[#e8d5a3] hover:underline">
              privacy@antidosis.com
            </a>
            .
          </p>
        </section>

        {/* ── 8. Your Rights ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">8. Your Rights</h2>
          <p className="mb-3">
            Under the <em>Australian Privacy Principles</em>, you have the following rights
            regarding your personal information:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Access</strong> — you can request a copy of the personal information we hold
              about you
            </li>
            <li>
              <strong>Correction</strong> — you can update or correct your profile information at
              any time through your dashboard or by contacting us
            </li>
            <li>
              <strong>Deletion</strong> — you can request deletion of your account and personal
              data, subject to legal retention requirements
            </li>
            <li>
              <strong>Complaint</strong> — if you believe we have breached the APPs, you can lodge a
              complaint with us or with the{" "}
              <em>Office of the Australian Information Commissioner</em> (OAIC)
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@antidosis.com" className="text-[#e8d5a3] hover:underline">
              privacy@antidosis.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        {/* ── 9. Cookies and Tracking ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            9. Cookies and Tracking Technologies
          </h2>
          <p className="mb-3">
            We use essential cookies and similar technologies for the following purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>
              <strong>Authentication</strong> — maintaining your login session via Supabase Auth
              cookies
            </li>
            <li>
              <strong>Security</strong> — preventing cross-site request forgery (CSRF) attacks
            </li>
          </ul>
          <p className="mb-3">
            We <strong>do not</strong> use:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Third-party advertising cookies</li>
            <li>Social media tracking pixels</li>
            <li>Analytics tracking (Google Analytics, Mixpanel, etc.)</li>
            <li>Cross-site tracking technologies</li>
          </ul>
          <p>Your browsing activity on antidosis is not tracked across other websites.</p>
        </section>

        {/* ── 10. Push Notifications ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">10. Push Notifications</h2>
          <p className="mb-3">
            The antidosis mobile app may send push notifications to your device to alert you about:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>New expressions of interest on your needs</li>
            <li>Contract status updates and signature reminders</li>
            <li>New messages in direct conversations</li>
            <li>Account security alerts</li>
          </ul>
          <p className="mb-3">
            Push notification device tokens are managed by the Capacitor Push Notifications plugin
            and stored locally on your device. We do not store these tokens on our servers. You can
            disable push notifications at any time through your device settings.
          </p>
        </section>

        {/* ── 11. Children&apos;s Privacy ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">11. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for use by children under the age of 18. We do not knowingly
            collect personal information from children. If you are a parent or guardian and believe
            your child has provided us with personal information, please contact us immediately at{" "}
            <a href="mailto:privacy@antidosis.com" className="text-[#e8d5a3] hover:underline">
              privacy@antidosis.com
            </a>
            . If we become aware that we have collected personal information from a child without
            parental consent, we will take steps to delete that information.
          </p>
        </section>

        {/* ── 12. International Data Transfers ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            12. International Data Transfers
          </h2>
          <p>
            Our service providers (Supabase, Stripe, Resend) may store and process your information
            in countries outside of Australia, including the United States. By using the Service,
            you consent to the transfer of your information to these countries. We ensure that such
            transfers are protected by appropriate safeguards, including contractual commitments
            from our service providers to protect your data in accordance with this Privacy Policy
            and applicable laws.
          </p>
        </section>

        {/* ── 13. Changes to This Policy ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">
            13. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or Service features. We will notify you of material
            changes by posting the updated policy on this page with a revised &quot;Last
            updated&quot; date and, where appropriate, by email or in-app notification. Your
            continued use of the Service after any changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        {/* ── 14. Contact Us ── */}
        <section>
          <h2 className="text-lg font-semibold text-[#e8d5a3] mb-3">14. Contact Us</h2>
          <p className="mb-3">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our
            handling of your personal information, please contact us:
          </p>
          <div className="pl-4 border-l-2 border-[#7a6b5a]/30">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:privacy@antidosis.com" className="text-[#e8d5a3] hover:underline">
                privacy@antidosis.com
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
          <p className="mt-3 text-[13px]">
            If you are not satisfied with our response, you may lodge a complaint with the{" "}
            <Link
              href="https://www.oaic.gov.au/"
              className="text-[#e8d5a3] hover:underline"
              target="_blank"
            >
              Office of the Australian Information Commissioner
            </Link>
            .
          </p>
        </section>

        <p className="text-[13px] text-[#7a6b5a]/50 pt-6 border-t border-[#7a6b5a]/10">
          Last updated: 17 May 2026
        </p>
      </article>
    </div>
  );
}
