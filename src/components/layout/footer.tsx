"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmailLink } from "@/components/email-link";
import { cn } from "@/lib/utils";

const linkGroups: {
  title: string;
  links: { href?: string; email?: string; label: string }[];
}[] = [
  {
    title: "Exchange",
    links: [
      { href: "/exchange", label: "Browse needs" },
      { href: "/needs/new", label: "Post a need" },
      { href: "/exchange?band=directory", label: "People & businesses" },
      { href: "/exchange?band=relay", label: "Community Relay" },
    ],
  },
  {
    title: "Off-grid",
    links: [{ href: "/store", label: "Mesh store" }],
  },
  {
    title: "Learn",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/demo", label: "Interactive demos" },
      { href: "/examples", label: "Exchange ideas" },
      { href: "/blog", label: "Journal" },
    ],
  },
  {
    title: "Trust & support",
    links: [
      { href: "/safety", label: "Safety & trust" },
      { email: "support@antidosis.com", label: "Contact" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  const pathname = usePathname();
  const hasDashboardSidebar = pathname.startsWith("/dashboard");

  return (
    <footer
      className={cn(
        "relative z-10 border-t border-line bg-void",
        hasDashboardSidebar && "pl-20 lg:pl-64"
      )}
    >
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
            <p className="text-xs text-ash">
              &copy; {year} Martin Khoury trading as antidosis · ABN 96 557 008 393
            </p>
            <p className="text-xs text-ash">Crafted with intention on the Central Coast, NSW.</p>
            <p className="text-xs text-ash">
              Built by{" "}
              <a
                href="https://hekaweb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sun hover:text-gold transition-colors font-medium"
              >
                HEKAWEB
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
