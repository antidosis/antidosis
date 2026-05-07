import Link from "next/link";

const linkGroups = [
  {
    title: "Product",
    links: [
      { href: "/needs", label: "Browse Needs", external: false },
      { href: "/needs/new", label: "Post a Need", external: false },
      { href: "/how-it-works", label: "How It Works", external: false },
      { href: "/examples", label: "Examples", external: false },
      { href: "/demo/contract-flow", label: "Contract Demo", external: false },
    ],
  },
  {
    title: "Directory",
    links: [
      { href: "/pros", label: "Find Pros", external: false },
      { href: "/pro", label: "Go Pro", external: false },
    ],
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
    links: [
      { href: "mailto:official.antidosis@gmail.com", label: "Contact", external: true },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#2a2420] bg-[#0a0806]">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Main footer content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-4">
              <Link href="/" className="inline-block mb-5">
                <img
                  src="/images/logo.png"
                  alt="antidosis"
                  width={280}
                  height={96}
                  className="h-20 w-auto opacity-80 hover:opacity-100 transition-opacity"
                />
              </Link>
              <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-xs mb-6">
                A marketplace for reciprocal exchange. Post what you need. Offer
                what you have. Build trust through every transaction.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                <span className="text-xs text-[#7a6b5a]">Central Coast NSW trial active</span>
              </div>
            </div>

            {/* Link columns */}
            {linkGroups.map((group) => (
              <div key={group.title} className="md:col-span-2">
                <h4 className="text-xs font-medium text-[#e8d5a3] uppercase tracking-wider mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className="text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
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
        <div className="border-t border-[#2a2420] py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#7a6b5a]">
              &copy; {year} Antidosis. All rights reserved.
            </p>
            <p className="text-xs text-[#7a6b5a]">
              Crafted with intention on the Central Coast, NSW.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
