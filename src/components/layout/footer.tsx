import Image from "next/image";
import Link from "next/link";

import { EmailLink } from "@/components/email-link";

const linkGroups: {
  title: string;
  links: { href?: string; email?: string; label: string; external?: boolean }[];
}[] = [
  {
    title: "Product",
    links: [
      { href: "/needs", label: "Browse Needs", external: false },
      { href: "/needs/new", label: "Post a Need", external: false },
      { href: "/how-it-works", label: "How It Works", external: false },
      { href: "/examples", label: "Examples", external: false },
      { href: "/demo", label: "Demo", external: false },
      { href: "/blog", label: "Blog", external: false },
    ],
  },
  {
    title: "Directory",
    links: [{ href: "/pros", label: "Directory", external: false }],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service", external: false },
      { href: "/privacy", label: "Privacy Policy", external: false },
    ],
  },
  {
    title: "Support",
    links: [{ email: "official.antidosis@gmail.com", label: "Contact" }],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-void">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Main footer content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-4">
              <Link href="/" className="inline-block mb-5">
                <Image
                  src="/images/logo.png"
                  alt="antidosis"
                  width={197}
                  height={80}
                  className="brand-logo opacity-80 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-sm text-ash leading-relaxed max-w-xs mb-6">
                A marketplace for reciprocal exchange. Post what you need. Offer what you have.
                Build trust through every transaction.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                <span className="text-xs text-ash">Central Coast NSW trial active</span>
              </div>
            </div>

            {/* Link columns */}
            {linkGroups.map((group) => (
              <div key={group.title} className="md:col-span-2">
                <h2 className="text-xs font-medium text-gold uppercase tracking-wider mb-4">
                  {group.title}
                </h2>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.email ? (
                        <EmailLink
                          email={link.email}
                          className="text-sm text-ash hover:text-gold transition-colors"
                        >
                          {link.label}
                        </EmailLink>
                      ) : link.external ? (
                        <a
                          href={link.href}
                          className="text-sm text-ash hover:text-gold transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href ?? "/"}
                          className="text-sm text-ash hover:text-gold transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-line py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ash">&copy; {year} Antidosis. All rights reserved.</p>
            <p className="text-xs text-ash">Crafted with intention on the Central Coast, NSW.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
