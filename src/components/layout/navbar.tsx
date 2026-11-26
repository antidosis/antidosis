"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ChevronDown, Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { NotificationBell } from "./notification-bell";

interface NavLink {
  href: string;
  label: string;
  description: string;
}

interface NavHub {
  href: string;
  label: string;
  matches: string[];
  links: NavLink[];
}

const NAV_HUBS: NavHub[] = [
  {
    href: "/exchange",
    label: "Exchange",
    matches: ["/exchange", "/needs", "/pros", "/terminal"],
    links: [
      { href: "/exchange", label: "Needs", description: "Browse local requests and offers" },
      { href: "/needs/new", label: "Post a need", description: "Quick or detailed posting" },
      {
        href: "/exchange?band=directory",
        label: "Directory",
        description: "People, skills and local businesses",
      },
      {
        href: "/exchange?band=relay",
        label: "Relay",
        description: "Community channels and direct messages",
      },
    ],
  },
  {
    href: "/store",
    label: "Store",
    matches: ["/store"],
    links: [
      { href: "/store", label: "Mesh overview", description: "How a node keeps you connected" },
      {
        href: "/store/interest",
        label: "Express interest",
        description: "Node launch, channel access and updates",
      },
      {
        href: "/store/builders",
        label: "For mesh builders",
        description: "Build, test and supply community nodes",
      },
    ],
  },
  {
    href: "/how-it-works",
    label: "Learn",
    matches: ["/how-it-works", "/demo", "/examples", "/blog", "/safety"],
    links: [
      {
        href: "/how-it-works",
        label: "How it works",
        description: "The complete exchange and trust model",
      },
      {
        href: "/demo",
        label: "Interactive demos",
        description: "Try current flows without real data",
      },
      { href: "/examples", label: "Exchange ideas", description: "Practical ways to participate" },
      { href: "/blog", label: "Journal", description: "Guides, safety and community stories" },
      {
        href: "/safety",
        label: "Safety & trust",
        description: "Verification, contracts, guarded links and reporting",
      },
    ],
  },
];

function hubIsActive(hub: NavHub, pathname: string): boolean {
  return hub.matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openHub, setOpenHub] = useState<string | null>(null);
  const [desktopHub, setDesktopHub] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setUser(null);
      else if (session?.user) setUser({ id: session.user.id });
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // Close menus on route change — render-adjust pattern
  const [menusClosedFor, setMenusClosedFor] = useState(pathname);
  if (menusClosedFor !== pathname) {
    setMenusClosedFor(pathname);
    setMobileOpen(false);
    setOpenHub(null);
    setDesktopHub(null);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-void">
        <div className="flex h-20 items-center justify-between px-4 text-sm md:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Antidosis home">
            <img
              src="/images/logo.webp"
              alt="antidosis"
              width={138}
              height={56}
              fetchPriority="high"
              className="brand-logo opacity-80 transition-opacity group-hover:opacity-100"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {NAV_HUBS.map((hub) => {
              const active = hubIsActive(hub, pathname);
              const expanded = desktopHub === hub.href;
              return (
                <div
                  key={hub.href}
                  className="relative"
                  onMouseEnter={() => setDesktopHub(hub.href)}
                  onMouseLeave={() =>
                    setDesktopHub((current) => (current === hub.href ? null : current))
                  }
                  onFocusCapture={() => setDesktopHub(hub.href)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setDesktopHub(null);
                  }}
                >
                  <Link
                    href={hub.href}
                    aria-current={active ? "page" : undefined}
                    aria-haspopup="true"
                    className={cn(
                      "relative flex items-center gap-1.5 py-2 text-[15px] transition-colors",
                      active ? "text-sun glow-gold-subtle" : "text-ash hover:text-gold"
                    )}
                  >
                    {hub.label}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                    />
                    {active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-px bg-sun shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
                    )}
                  </Link>
                  <div
                    className={cn(
                      "absolute left-1/2 top-full w-80 -translate-x-1/2 pt-3 transition-opacity",
                      expanded
                        ? "visible pointer-events-auto opacity-100"
                        : "invisible pointer-events-none opacity-0"
                    )}
                  >
                    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
                      <div className="border-b border-line/60 bg-inset/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                        {hub.label} hub
                      </div>
                      {hub.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block border-b border-line/40 px-4 py-3 transition-colors last:border-0 hover:bg-raise focus:bg-raise"
                        >
                          <span className="block text-sm font-medium text-gold">{link.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ash">
                            {link.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            {user && <NotificationBell />}
            {user ? (
              <>
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    pathname === "/dashboard" && "shadow-[0_0_15px_rgba(245,166,35,0.3)]"
                  )}
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    supabase.auth.signOut().then(() => {
                      router.push("/");
                      router.refresh();
                    })
                  }
                  className="text-sm text-ash transition-colors hover:text-gold"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-ash transition-colors hover:text-gold">
                  Log in
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            {user && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-ash transition-colors hover:text-gold"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed left-0 right-0 top-20 z-[60] h-[calc(100dvh-5rem)] overflow-y-auto border-t border-line bg-void md:hidden">
          <nav className="flex flex-col p-5" aria-label="Mobile navigation">
            {NAV_HUBS.map((hub) => {
              const active = hubIsActive(hub, pathname);
              const expanded = openHub === hub.href;
              return (
                <div key={hub.href} className="border-b border-line/50 py-1">
                  <div className="flex items-center">
                    <Link
                      href={hub.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "min-h-12 flex-1 py-3 text-base font-medium",
                        active ? "text-sun" : "text-parchment"
                      )}
                    >
                      {hub.label}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${expanded ? "Close" : "Open"} ${hub.label} links`}
                      aria-expanded={expanded}
                      aria-controls={`mobile-${hub.label.toLowerCase()}-links`}
                      onClick={() => setOpenHub(expanded ? null : hub.href)}
                      className="flex h-11 w-11 items-center justify-center text-ash hover:text-gold"
                    >
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                      />
                    </button>
                  </div>
                  {expanded && (
                    <div
                      id={`mobile-${hub.label.toLowerCase()}-links`}
                      className="mb-3 ml-3 border-l border-line pl-4"
                    >
                      {hub.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block min-h-11 py-2.5 text-sm text-ash hover:text-gold"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {user && (
              <Link
                href="/dashboard"
                className="min-h-12 border-b border-line/50 py-3 text-base font-medium text-sun"
              >
                Dashboard
              </Link>
            )}

            <div className="flex flex-col gap-3 pt-5">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="min-h-11 border-b border-line/50 py-2.5 text-base text-ash"
                  >
                    Log in
                  </Link>
                  <Button asChild className="mt-1 justify-center">
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    supabase.auth.signOut().then(() => {
                      router.push("/");
                      router.refresh();
                    })
                  }
                  className="min-h-11 py-2.5 text-left text-base text-ash"
                >
                  Log out
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
