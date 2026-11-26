"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowUpRight, Copy, Eye, Loader2, Lock, Mail, Phone } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { displayHostname } from "@/lib/security/link-policy";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface RevealedLink {
  platform: string;
  url: string;
}

interface RevealGroup {
  phone: string | null;
  email?: string | null;
  links: RevealedLink[];
}

interface RevealResponse {
  listing: RevealGroup | null;
  personal: RevealGroup | null;
}

interface ContactRevealProps {
  profileId: string;
  /** Which contact group this surface shows: directory listing or personal profile. */
  scope: "listing" | "personal";
  /** Availability flags from the public payload — controls which rows render pre-reveal. */
  flags: { phone: boolean; email?: boolean; website?: boolean; socials: string[] };
  className?: string;
}

/**
 * Contact details are never in the page payload. Logged-in members tap once
 * to reveal — the API rate-limits, audit-logs and answers with the shared
 * values. Logged-out visitors are sent to login and returned here after.
 */
export function ContactReveal({ profileId, scope, flags, className }: ContactRevealProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState<RevealResponse | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthState(data.user ? "in" : "out");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setAuthState("out");
      else if (session?.user) setAuthState("in");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const group = revealed ? (scope === "listing" ? revealed.listing : revealed.personal) : null;
  const website = group?.links.find((link) => link.platform.toLowerCase() === "website") ?? null;
  const socials = group?.links.filter((link) => link.platform.toLowerCase() !== "website") ?? [];

  async function reveal() {
    setRevealing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`/api/v1/profiles/${profileId}/reveal-contact`, {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (response.status === 401) {
        setAuthState("out");
        return;
      }
      if (response.status === 429) {
        toast("Too many reveals — please try again a little later", "error");
        return;
      }
      if (!response.ok) {
        toast("Couldn't reveal contact details — please try again", "error");
        return;
      }
      setRevealed((await response.json()) as RevealResponse);
    } catch {
      toast("Couldn't reveal contact details — please try again", "error");
    } finally {
      setRevealing(false);
    }
  }

  function copy(value: string, label: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => toast(`${label} copied`, "success"))
      .catch(() => toast(`Couldn't copy the ${label.toLowerCase()}`, "error"));
  }

  const rows: { key: string; node: React.ReactNode }[] = [];

  if (!revealed) {
    if (flags.phone) rows.push({ key: "phone", node: <MaskedRow icon={Phone} label="Phone" /> });
    if (flags.email) rows.push({ key: "email", node: <MaskedRow icon={Mail} label="Email" /> });
    if (flags.website)
      rows.push({ key: "website", node: <MaskedRow icon={ArrowUpRight} label="Website" /> });
    for (const platform of flags.socials) {
      rows.push({ key: `social-${platform}`, node: <MaskedRow icon={Eye} label={platform} /> });
    }
  } else if (group) {
    const phone = group.phone;
    const email = group.email ?? null;
    if (phone) {
      rows.push({
        key: "phone",
        node: (
          <RevealedRow
            icon={Phone}
            value={phone}
            href={`tel:${phone}`}
            onCopy={() => copy(phone, "Phone number")}
          />
        ),
      });
    }
    if (email) {
      rows.push({
        key: "email",
        node: (
          <RevealedRow
            icon={Mail}
            value={email}
            href={`mailto:${email}`}
            onCopy={() => copy(email, "Email")}
          />
        ),
      });
    }
    if (website) {
      rows.push({
        key: "website",
        node: (
          <RevealedRow
            icon={ArrowUpRight}
            value={displayHostname(website.url)}
            href={website.url}
            external
            onCopy={() => copy(website.url, "Website")}
          />
        ),
      });
    }
    for (const link of socials) {
      rows.push({
        key: `social-${link.platform}`,
        node: (
          <RevealedRow
            icon={Eye}
            value={`${link.platform} — ${displayHostname(link.url)}`}
            href={link.url}
            external
            onCopy={() => copy(link.url, link.platform)}
          />
        ),
      });
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row) => (
        <div key={row.key}>{row.node}</div>
      ))}

      {!revealed &&
        (authState === "out" ? (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 rounded-md border border-sun/40 bg-sun/10 px-4 py-2 text-sm font-medium text-sun transition-colors hover:bg-sun/20"
          >
            <Lock className="h-3.5 w-3.5" /> Log in to reveal contact details
          </Link>
        ) : (
          <button
            type="button"
            onClick={reveal}
            disabled={revealing || authState === "loading"}
            className="inline-flex items-center gap-2 rounded-md border border-sun/40 bg-sun/10 px-4 py-2 text-sm font-medium text-sun transition-colors hover:bg-sun/20 disabled:opacity-60"
          >
            {revealing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Tap to reveal contact details
          </button>
        ))}
    </div>
  );
}

function MaskedRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <p className="flex items-center gap-2.5 text-sm text-ash">
      <Icon className="h-4 w-4 shrink-0 text-sun/60" />
      <span className="font-medium text-parchment">{label}</span>
      <span className="font-mono text-xs tracking-widest text-ash/70">••••••••</span>
    </p>
  );
}

function RevealedRow({
  icon: Icon,
  value,
  href,
  external,
  onCopy,
}: {
  icon: React.ElementType;
  value: string;
  href: string;
  external?: boolean;
  onCopy: () => void;
}) {
  return (
    <p className="flex items-center gap-2.5 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-sun" />
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        className="min-w-0 truncate text-parchment underline-offset-4 transition-colors hover:text-gold hover:underline"
      >
        {value}
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${value}`}
        className="shrink-0 rounded p-1 text-ash transition-colors hover:text-gold"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </p>
  );
}
