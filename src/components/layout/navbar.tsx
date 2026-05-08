"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) setUser(authUser);
    }
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setUser(null);
      else if (session?.user) setUser(session.user);
    });
    return () => { listener.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navItems = [
    { href: "/how-it-works", label: "how it works" },
    { href: "/needs", label: "browse needs" },
    { href: "/needs/new", label: "post" },
    { href: "/pros", label: "pros" },
    { href: "/blog", label: "blog" },
    { href: "/demo/contract-flow", label: "demo" },
    ...(user ? [{ href: "/dashboard", label: "dashboard" }] : []),
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0806]/95 backdrop-blur-sm border-b border-[#2a2420]">
        <div className="flex items-center justify-between h-20 px-4 md:px-8 text-sm">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo.png"
              alt="antidosis"
              width={160}
              height={64}
              className="h-14 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDashboard = item.href === "/dashboard";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative transition-colors py-1",
                    isDashboard
                      ? "px-3 py-1.5 rounded border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10 hover:text-[#f5a623]"
                      : isActive
                        ? "text-[#f5a623] glow-gold-subtle"
                        : "text-[#7a6b5a] hover:text-[#e8d5a3]"
                  )}
                >
                  {item.label}
                  {!isDashboard && isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop auth + notifications */}
          <div className="hidden md:flex items-center gap-4">
            {user && <NotificationBell />}
            {!user ? (
              <>
                <Link href="/login" className="text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors text-sm">login</Link>
                <Button asChild size="sm">
                  <Link href="/register">register</Link>
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
                className="text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors text-sm"
              >
                logout
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-3">
            {user && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed left-0 right-0 top-20 h-[calc(100dvh-5rem)] bg-[#0a0806] z-[60] border-t border-[#2a2420]">
          <div className="flex flex-col p-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDashboard = item.href === "/dashboard";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "py-3 text-base transition-colors border-b border-[#2a2420]/50",
                    isDashboard
                      ? "text-[#f5a623] font-medium"
                      : isActive
                        ? "text-[#f5a623] glow-gold-subtle"
                        : "text-[#7a6b5a] hover:text-[#e8d5a3]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-6 flex flex-col gap-3">
              {!user ? (
                <>
                  <Link href="/login" className="py-3 text-base text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors border-b border-[#2a2420]/50">
                    login
                  </Link>
                  <Button asChild className="justify-center mt-2">
                    <Link href="/register">register</Link>
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
                  className="py-3 text-base text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors text-left"
                >
                  logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
