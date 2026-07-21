import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Handshake,
  ShieldCheck,
  Star,
  Eye,
  Lock,
  ArrowRight,
  Flame,
  FileText,
  Briefcase,
} from "lucide-react";
import { Skeleton, SkeletonCard } from "@mobile/components/ui";
import { useProfile, useNotifications, useMyNeeds, useMyAcceptances } from "@mobile/hooks/useApi";
import { useHaptics } from "@mobile/hooks/useNative";
import { BootSequence } from "@mobile/components/BootSequence";
import { ParticleField } from "@mobile/components/ParticleField";
import { TickerBanner } from "@mobile/components/TickerBanner";
import { Button, Vessel, TerminalCursor, Divider } from "@mobile/components/ui";

/* ═══════════════════════════════════════════════════════════════
   HOME SCREEN — The Antidosis Experience
   Hero → Ticker → How It Works → Trust Pillars → Dashboard
   ═══════════════════════════════════════════════════════════════ */

export function HomeScreen() {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const [bootDone, setBootDone] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: notifData } = useNotifications(true);
  const { data: myNeeds } = useMyNeeds();
  const { data: myAcceptances } = useMyAcceptances();

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  // Scroll reveal — stable ref callback, immediate viewport check
  const revealRefs = useRef<Set<HTMLElement>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const addRevealRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    revealRefs.current.add(el);
    if (observerRef.current) {
      observerRef.current.observe(el);
      // If already in viewport, reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("animate-slide-up");
        el.classList.remove("opacity-0", "translate-y-6");
        observerRef.current.unobserve(el);
        revealRefs.current.delete(el);
      }
    }
    return () => {
      revealRefs.current.delete(el);
      observerRef.current?.unobserve(el);
    };
  }, []);

  useEffect(() => {
    if (!bootDone) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            entry.target.classList.remove("opacity-0", "translate-y-6");
            observer.unobserve(entry.target);
            revealRefs.current.delete(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    observerRef.current = observer;
    revealRefs.current.forEach((el) => observer.observe(el));

    // Safety fallback: reveal everything after 2s no matter what
    const safetyTimer = setTimeout(() => {
      revealRefs.current.forEach((el) => {
        el.classList.add("animate-slide-up");
        el.classList.remove("opacity-0", "translate-y-6");
        observer.unobserve(el);
      });
      revealRefs.current.clear();
    }, 2000);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
      observerRef.current = null;
    };
  }, [bootDone]);

  const firstName = profile?.fullName?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "Trader";

  if (profileLoading || !bootDone) {
    return (
      <>
        <BootSequence onComplete={() => setBootDone(true)} />
        <div className="min-h-full pb-6 px-4 pt-8 safe-top space-y-4">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-full pb-6 safe-top">
      {/* ═══════════════════════════════════════════════════════
         HERO SECTION
         ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pt-8 pb-10">
        <ParticleField />

        <div className="relative z-10 app-container">
          {/* Terminal prompt */}
          <p className="font-mono text-xs text-[var(--leather)] mb-4">$ cat /etc/antidosis/motd</p>

          {/* Heading */}
          <h1 className="heading-display text-4xl text-[var(--gold)] mb-2">
            exchange <span className="text-[var(--sun)]">everything.</span>
            <TerminalCursor color="sun" size="lg" className="ml-1" />
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[var(--leather)] max-w-[280px] md:max-w-md leading-relaxed mb-6">
            A decentralised exchange network for goods, skills, and trust.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                tap("light");
                navigate("/needs");
              }}
            >
              Browse Needs
              <ArrowRight size={14} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                tap("light");
                navigate("/needs/new");
              }}
            >
              Post Need
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         TICKER BANNER
         ═══════════════════════════════════════════════════════ */}
      <TickerBanner />

      {/* ═══════════════════════════════════════════════════════
         HOW IT WORKS
         ═══════════════════════════════════════════════════════ */}
      <section ref={addRevealRef} className="px-4 pt-8 pb-4 opacity-0 translate-y-6">
        <p className="font-mono text-xs text-[var(--leather)] mb-4">$ cat docs/quickstart.md</p>
        <h2 className="heading-display text-xl text-[var(--gold)] mb-6">How It Works</h2>

        <div className="space-y-3">
          <StepCard
            number="01"
            icon={<ClipboardList size={20} className="text-[var(--sun)]" />}
            title="Post a Need"
            description="Describe what you need — a skill, an item, or help. Set your terms."
            accent="sun"
          />
          <StepCard
            number="02"
            icon={<Search size={20} className="text-[var(--mercury)]" />}
            title="Find a Match"
            description="The community sees your need. Verified peers express interest."
            accent="mercury"
          />
          <StepCard
            number="03"
            icon={<Handshake size={20} className="text-[var(--quintessence)]" />}
            title="Exchange"
            description="Form a binding contract. Exchange value. Build reputation."
            accent="quintessence"
          />
        </div>
      </section>

      <Divider className="mx-4 my-6" />

      {/* ═══════════════════════════════════════════════════════
         TRUST PILLARS
         ═══════════════════════════════════════════════════════ */}
      <section ref={addRevealRef} className="px-4 pb-4 opacity-0 translate-y-6">
        <h2 className="heading-display text-xl text-[var(--gold)] mb-5">Why Antidosis?</h2>

        <div className="grid grid-cols-2 gap-3">
          <PillarCard
            icon={<ShieldCheck size={18} />}
            title="Verified"
            description="Identity & skill verified"
            color="emerald"
          />
          <PillarCard
            icon={<Star size={18} />}
            title="Rated"
            description="Reputation you can trust"
            color="sun"
          />
          <PillarCard
            icon={<Eye size={18} />}
            title="Transparent"
            description="Open contracts & terms"
            color="mercury"
          />
          <PillarCard
            icon={<Lock size={18} />}
            title="Protected"
            description="Binding exchange agreements"
            color="quintessence"
          />
        </div>
      </section>

      <Divider className="mx-4 my-6" />

      {/* ═══════════════════════════════════════════════════════
         DASHBOARD — Stats
         ═══════════════════════════════════════════════════════ */}
      <section ref={addRevealRef} className="px-4 pb-4 opacity-0 translate-y-6">
        <p className="font-mono text-xs text-[var(--leather)] mb-4">$ whoami</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Vessel variant="lit" className="p-3 text-center">
            <Star size={14} className="text-[var(--sun)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {profile?.ratingAvg ? profile.ratingAvg.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] text-[var(--leather)] uppercase tracking-wider">Rating</p>
          </Vessel>
          <Vessel variant="lit" className="p-3 text-center">
            <Briefcase size={14} className="text-[var(--mercury)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {String(profile?.jobsCompleted ?? 0)}
            </p>
            <p className="text-[10px] text-[var(--leather)] uppercase tracking-wider">Jobs</p>
          </Vessel>
          <Vessel variant="lit" className="p-3 text-center">
            <ClipboardList size={14} className="text-[var(--quintessence)] mx-auto mb-1" />
            <p className="text-lg font-bold text-[var(--gold)] font-sans">
              {String(myNeeds?.length ?? 0)}
            </p>
            <p className="text-[10px] text-[var(--leather)] uppercase tracking-wider">Needs</p>
          </Vessel>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         NOTIFICATIONS
         ═══════════════════════════════════════════════════════ */}
      {notifications.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs text-[var(--leather)]">$ tail -f ~/notifications.log</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono text-[var(--sun)]">{unreadCount} new</span>
            )}
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <Vessel
                key={n.id}
                variant="default"
                interactive
                className="p-3 flex items-center gap-3"
                onClick={() => {
                  tap("light");
                  const data = n.data as Record<string, string> | null;
                  if (data?.needId) navigate(`/needs/${data.needId}`);
                  else if (data?.contractId) navigate(`/contracts/${data.contractId}`);
                }}
              >
                <div className="w-9 h-9 rounded-md bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center shrink-0">
                  <Flame size={16} className="text-[var(--ember)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--gold)] truncate">{n.title}</p>
                  <p className="text-xs text-[var(--leather)] truncate">{n.body}</p>
                </div>
              </Vessel>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
         CONTRACTS CTA
         ═══════════════════════════════════════════════════════ */}
      <section className="px-4 mb-6">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            tap("light");
            navigate("/contracts");
          }}
        >
          <FileText size={16} />
          View My Contracts
        </Button>
      </section>

      {/* ═══════════════════════════════════════════════════════
         MY NEEDS
         ═══════════════════════════════════════════════════════ */}
      {myNeeds && myNeeds.length > 0 && (
        <section className="px-4 mb-6">
          <p className="font-mono text-xs text-[var(--leather)] mb-3">$ ls ~/needs/</p>
          <div className="space-y-2">
            {myNeeds.slice(0, 3).map((need) => (
              <Vessel
                key={need.id}
                variant="need"
                interactive
                className="p-3 flex items-center gap-3"
                onClick={() => {
                  tap("light");
                  navigate(`/needs/${need.id}`);
                }}
              >
                <div className="w-9 h-9 rounded-md bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-[var(--mercury)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--gold)] truncate">{need.title}</p>
                  <p className="text-xs text-[var(--leather)]">
                    {need._count?.acceptances ?? 0} interest · {need.status}
                  </p>
                </div>
              </Vessel>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
         MY DEALS
         ═══════════════════════════════════════════════════════ */}
      {myAcceptances && myAcceptances.length > 0 && (
        <section className="px-4 mb-6">
          <p className="font-mono text-xs text-[var(--leather)] mb-3">$ ls ~/deals/</p>
          <div className="space-y-2">
            {myAcceptances.slice(0, 3).map((acc) => (
              <Vessel
                key={acc.id}
                variant="offer"
                interactive
                className="p-3 flex items-center gap-3"
                onClick={() => {
                  tap("light");
                  acc.need && navigate(`/needs/${acc.need.id}`);
                }}
              >
                <div className="w-9 h-9 rounded-md bg-[var(--void)] border border-[var(--bronze)] flex items-center justify-center shrink-0">
                  <Handshake size={16} className="text-[var(--quintessence)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--gold)] truncate">
                    {acc.need?.title ?? "Untitled need"}
                  </p>
                  <p className="text-xs text-[var(--leather)]">{acc.status}</p>
                </div>
              </Vessel>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
         EMPTY STATE
         ═══════════════════════════════════════════════════════ */}
      {notifications.length === 0 &&
        (!myNeeds || myNeeds.length === 0) &&
        (!myAcceptances || myAcceptances.length === 0) && (
          <section className="px-4 py-8">
            <Vessel className="p-6 text-center">
              <ClipboardList size={28} className="text-[var(--leather)] mx-auto mb-3" />
              <p className="text-sm text-[var(--parchment)] mb-1">Nothing here yet</p>
              <p className="text-xs text-[var(--leather)] mb-4">
                Post a need or browse the community
              </p>
              <Button
                size="sm"
                onClick={() => {
                  tap("medium");
                  navigate("/needs/new");
                }}
              >
                Post a Need
              </Button>
            </Vessel>
          </section>
        )}

      {/* ═══════════════════════════════════════════════════════
         CTA SECTION
         ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pt-4 pb-8">
        <p className="font-mono text-xs text-[var(--leather)] mb-3">$ ./join_network.sh</p>
        <h2 className="heading-display text-xl text-[var(--gold)] mb-2">
          Start exchanging <span className="text-[var(--sun)]">today.</span>
        </h2>
        <p className="text-xs text-[var(--leather)] mb-4">
          Welcome back, {firstName}. The network is waiting.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              tap("light");
              navigate("/needs");
            }}
          >
            Browse Needs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              tap("light");
              navigate("/discover");
            }}
          >
            Discover Pros
            <ArrowRight size={14} />
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function StepCard({
  number,
  icon,
  title,
  description,
  accent,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
  accent: "sun" | "mercury" | "quintessence";
}) {
  const accentColor = {
    sun: "text-[var(--sun)]",
    mercury: "text-[var(--mercury)]",
    quintessence: "text-[var(--quintessence)]",
  }[accent];

  const borderColor = {
    sun: "border-[var(--sun)]/20",
    mercury: "border-[var(--mercury)]/20",
    quintessence: "border-[var(--quintessence)]/20",
  }[accent];

  const bgColor = {
    sun: "bg-[var(--sun)]/5",
    mercury: "bg-[var(--mercury)]/5",
    quintessence: "bg-[var(--quintessence)]/5",
  }[accent];

  return (
    <div className={`vessel p-4 ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-md ${bgColor} border ${borderColor} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <span
            className={`text-2xl font-sans font-bold ${accentColor} opacity-20 block leading-none mb-1`}
          >
            {number}
          </span>
          <h3 className="heading-display text-base text-[var(--gold)] mb-1">{title}</h3>
          <p className="text-xs text-[var(--leather)] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  description,
  color,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: "emerald" | "sun" | "mercury" | "quintessence";
}) {
  const colorMap = {
    emerald: {
      text: "text-[var(--emerald)]",
      border: "border-[var(--emerald)]/20",
      bg: "bg-[var(--emerald)]/5",
    },
    sun: {
      text: "text-[var(--sun)]",
      border: "border-[var(--sun)]/20",
      bg: "bg-[var(--sun)]/5",
    },
    mercury: {
      text: "text-[var(--mercury)]",
      border: "border-[var(--mercury)]/20",
      bg: "bg-[var(--mercury)]/5",
    },
    quintessence: {
      text: "text-[var(--quintessence)]",
      border: "border-[var(--quintessence)]/20",
      bg: "bg-[var(--quintessence)]/5",
    },
  };

  const c = colorMap[color];

  return (
    <div className={`vessel p-3 active:scale-[0.98] transition-transform`}>
      <div
        className={`w-8 h-8 rounded-md ${c.bg} border ${c.border} flex items-center justify-center mb-2`}
      >
        <span className={c.text}>{icon}</span>
      </div>
      <h3 className="heading-display text-sm text-[var(--gold)] mb-0.5">{title}</h3>
      <p className="text-[10px] text-[var(--leather)] leading-relaxed">{description}</p>
    </div>
  );
}
