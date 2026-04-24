"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);

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

  const navItems = [
    { href: "/needs", label: "needs" },
    { href: "/needs/new", label: "post" },
    { href: "/dashboard", label: "dashboard" },
    { href: "/pro", label: "pro" },
    { href: "/pros", label: "pros" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0c]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between h-20 px-4 md:px-8 text-[13px]">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/images/logo.png" alt="antidosis" className="h-16 w-auto opacity-80 group-hover:opacity-100 transition-opacity" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors",
                pathname === item.href
                  ? "text-[#f5b800]"
                  : "text-[#7a6b4a] hover:text-[#e8c97c]"
              )}
            >
              {pathname === item.href ? "> " : "  "}{item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="text-[#7a6b4a] hover:text-[#e8c97c] transition-colors">login</Link>
              <Link href="/register" className="btn-cmd-primary text-xs">register</Link>
            </>
          ) : (
            <button
              onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
              className="text-[#7a6b4a] hover:text-[#e8c97c] transition-colors"
            >
              logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
