import { MapPin, Radio, ScrollText, ShieldCheck, Star } from "lucide-react";
import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: { absolute: "Antidosis — Employee Brief" },
  description:
    "Internal employee brief: what Antidosis is, why the community needs it, how the product engineers trust, and the role every employee plays.",
  robots: { index: false },
};

const PILLARS = [
  {
    icon: ShieldCheck,
    color: "var(--x-00e676)",
    title: "Verification first",
    desc: "Identity and mobile verification are required before anyone can post, accept, or message. Verified licence credentials gate regulated work — electrical, plumbing, building — so people hiring help know it's legitimate.",
  },
  {
    icon: ScrollText,
    color: "var(--x-00e5ff)",
    title: "Contracts, not handshakes",
    desc: "Every exchange can be formalised as a written contract with clear terms, in-app messaging, and completion records. Both parties know exactly what was agreed.",
  },
  {
    icon: Star,
    color: "var(--x-f5a623)",
    title: "Reputation that follows you",
    desc: "Reviews after completed exchanges build a public track record. On Antidosis, your history is your currency.",
  },
  {
    icon: Radio,
    color: "var(--x-b24bf5)",
    title: "Relay, our community radio",
    desc: "Named for mesh radio networks, Relay is the in-app comms surface — local channels for the whole neighbourhood, plus Direct messages for one-to-one coordination.",
  },
  {
    icon: MapPin,
    color: "var(--x-1ec4b8)",
    title: "Meet your neighbours safely",
    desc: "Built around meeting in public places for first exchanges, with the tools — credentials, contracts, reviews, reporting — to make in-person trades feel as safe as they should.",
  },
];

const BENEFITS = [
  {
    numeral: "i",
    title: "Economic resilience",
    desc: "When money is tight — job loss, rising cost of living, fixed retirement income — the ability to trade skills and goods locally is a real safety net. Barter is legal, and neighbours trading with neighbours keeps value circulating in the community instead of leaking out of it.",
  },
  {
    numeral: "ii",
    title: "Skills stay alive and valued",
    desc: "Decades of experience shouldn't retire when a person does. A platform where a retired electrician's knowledge is wanted — and exchangeable — keeps people engaged, useful, and connected.",
  },
  {
    numeral: "iii",
    title: "Less waste, more use",
    desc: "Items offered in exchange find new owners instead of landfill. Spare capacity — a free Saturday, an empty trailer — gets used instead of sitting idle.",
  },
  {
    numeral: "iv",
    title: "Access for the cash-poor, time-rich",
    desc: "The people with the most time to help are often those with the least money. Antidosis is one of the few marketplaces where that's an advantage, not a barrier.",
  },
];

const PRINCIPLES = [
  {
    num: "01",
    title: "You are an ambassador first",
    desc: "The pilot lives or dies on liquidity: enough real needs and enough real helpers in one region. Every user you onboard, every need you help fulfil, makes the marketplace more alive for everyone else.",
  },
  {
    num: "02",
    title: "Trust is the product",
    desc: "If you see something that undermines safety, verification, or fairness, it is a top-priority report — not a minor bug. Our users are meeting strangers in person because we told them it was safe.",
  },
  {
    num: "03",
    title: "We are careful by design",
    desc: "No user-to-user funds are held by the platform, contracts are formed directly between users, and regulated work is licence-gated. Keep it that way — the legally safe shape of this product is a feature.",
  },
  {
    num: "04",
    title: "Mobile matters most",
    desc: "For a neighbourhood app, the phone is the primary surface. The person standing in their driveway checking Relay is who we build for.",
  },
];

export default function BriefPage() {
  return (
    <div className="min-h-screen bg-void text-gold flex flex-col relative">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 brief-root">
        {/* ── HERO ── */}
        <section className="relative pt-28 md:pt-36 pb-16 md:pb-20 border-b border-line">
          <div className="max-w-4xl mx-auto px-6 md:px-8 animate-fade-in">
            <p className="font-mono text-[11px] md:text-xs tracking-[0.3em] text-ash mb-10">
              INTERNAL · EMPLOYEE BRIEF
            </p>
            <h1 className="heading-display text-4xl md:text-6xl text-gold brief-gold mb-8">
              What we are building, <span className="text-sun brief-accent">why it matters,</span>{" "}
              and the role you play.
            </h1>
            <p className="text-[13px] md:text-sm text-ash brief-soft leading-relaxed">
              Issued 16 October 2026 · Version 1.0 · Central Coast NSW pilot · For internal
              circulation
            </p>
          </div>
        </section>

        {/* ── 01 · WHAT IS ANTIDOSIS ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid mb-10">
              <p className="font-mono text-[11px] tracking-[0.3em] text-sun brief-accent mb-6">
                01 / WHAT IS ANTIDOSIS
              </p>
              <p className="heading-display text-2xl md:text-4xl text-gold brief-gold leading-tight">
                A local needs-exchange platform — a marketplace where neighbours help neighbours.
              </p>
            </div>
            <div className="space-y-6 text-base text-parchment brief-ink leading-relaxed max-w-3xl">
              <p>
                Someone posts a need — &quot;help moving a couch&quot;, &quot;fix a leaking
                tap&quot;, &quot;tutor my daughter in maths&quot; — and offers something in
                exchange: money, an item, or another service. The platform matches them with someone
                nearby who can help, formalises the agreement as a contract, and builds reputation
                through reviews.
              </p>
              <div className="vessel brief-card p-6 md:p-8 mt-2">
                <p className="font-mono text-[11px] tracking-[0.2em] text-ash brief-soft mb-3">
                  THE NAME
                </p>
                <p className="text-sm md:text-[15px] text-goldsoft brief-ink leading-relaxed">
                  The name comes from the ancient Greek{" "}
                  <em className="text-gold brief-gold">antidosis</em> — the exchange of resources
                  between citizens, where what you give and what you receive balance into something
                  greater for both. That is the idea in one word.
                </p>
              </div>
              <p className="text-sm text-ash brief-soft leading-relaxed pt-2">
                <span className="text-gold brief-gold font-medium">Current phase:</span> a pilot on
                the NSW Central Coast (roughly 350,000 people), with regional expansion planned only
                after the pilot proves the exchange loop works.
              </p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── 02 · WHY THE COMMUNITY NEEDS IT ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid mb-12">
              <p className="font-mono text-[11px] tracking-[0.3em] text-sun brief-accent mb-6">
                02 / WHY THE COMMUNITY NEEDS IT
              </p>
              <p className="heading-display text-2xl md:text-4xl text-gold brief-gold leading-tight max-w-2xl">
                Everyone is asset-rich in one currency and poor in another.
              </p>
            </div>
            <div className="mb-12 max-w-3xl">
              <p className="text-base text-parchment brief-ink leading-relaxed">
                A retired carpenter has skills and free time but might not want to spend cash. A
                student has energy and a ute but no income. A young family has a spare room full of
                things they never use. Antidosis lets people convert what they{" "}
                <em className="text-gold brief-gold">have</em> — skills, time, stuff — into what
                they <em className="text-gold brief-gold">need</em>, without everything being a cash
                transaction.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="vessel brief-card p-7 md:p-8">
                  <p className="font-mono text-xs text-sun brief-accent mb-4">{b.numeral}.</p>
                  <h3 className="heading-display text-lg md:text-xl text-gold brief-gold mb-3">
                    {b.title}
                  </h3>
                  <p className="text-sm text-ash brief-soft leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── 03 · HOW IT BUILDS CONNECTION ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid mb-12">
              <p className="font-mono text-[11px] tracking-[0.3em] text-sun brief-accent mb-6">
                03 / HOW IT BUILDS CONNECTION
              </p>
              <p className="heading-display text-2xl md:text-4xl text-gold brief-gold leading-tight max-w-2xl">
                Trust is engineered into the product — not bolted on.
              </p>
            </div>
            <div className="mb-10 max-w-3xl">
              <p className="text-base text-parchment brief-ink leading-relaxed">
                A marketplace of strangers only works if trust is real. So every layer of the
                platform exists to make one neighbourhood-scale question easy to answer: can I rely
                on this person?
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="vessel brief-card p-7 md:p-8"
                  style={{ borderTop: `1px solid ${p.color}22` }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center mb-5"
                    style={{ background: `${p.color}10`, border: `1px solid ${p.color}25` }}
                  >
                    <p.icon className="h-5 w-5" style={{ color: p.color }} />
                  </div>
                  <h3 className="heading-display text-lg md:text-xl text-gold brief-gold mb-3">
                    {p.title}
                  </h3>
                  <p className="text-sm text-ash brief-soft leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="brief-avoid mt-14 max-w-3xl border-l-2 border-gold/40 pl-6 md:pl-8">
              <p className="text-lg md:text-xl text-parchment brief-ink leading-relaxed">
                Every exchange is two stories: someone got help they needed, and someone was valued
                for what they could offer. Do that a few thousand times in one region and you
                haven&apos;t just moved furniture —{" "}
                <span className="text-gold brief-gold">
                  you&apos;ve rebuilt the connective tissue of a community.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ── 04 · IMPROVING OUR WAY OF LIFE ── */}
        <section className="py-20 md:py-28 border-y border-line bg-surface/40">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid mb-10">
              <p className="font-mono text-[11px] tracking-[0.3em] text-sun brief-accent mb-10">
                04 / IMPROVING OUR WAY OF LIFE
              </p>
              <blockquote className="heading-display text-2xl md:text-4xl text-gold brief-gold leading-snug max-w-3xl">
                We know what a stranger on another continent had for breakfast — but not the name of
                the person two doors down who could fix our fence.
              </blockquote>
            </div>
            <div className="space-y-6 text-base text-parchment brief-ink leading-relaxed max-w-3xl">
              <p>
                Modern life has made us extraordinarily connected digitally and oddly disconnected
                locally. Antidosis is a small, practical counterweight — it gives people a{" "}
                <em className="text-sun brief-accent">reason</em> to knock, a{" "}
                <em className="text-sun brief-accent">structure</em> to trust, and a{" "}
                <em className="text-sun brief-accent">record</em> that says: this neighbourhood
                takes care of its own.
              </p>
              <p className="text-sm text-ash brief-soft leading-relaxed">
                The goal is not to replace the cash economy or become the next gig giant. It&apos;s
                to prove that a region with a working exchange loop is a better place to live — and
                then take that proof, one region at a time, further.
              </p>
            </div>
          </div>
        </section>

        {/* ── 05 · WHAT THIS MEANS FOR YOU ── */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid mb-12">
              <p className="font-mono text-[11px] tracking-[0.3em] text-sun brief-accent mb-6">
                05 / WHAT THIS MEANS FOR YOU
              </p>
              <p className="heading-display text-2xl md:text-4xl text-gold brief-gold leading-tight">
                Four principles, one standard.
              </p>
            </div>
            <div>
              {PRINCIPLES.map((p) => (
                <div
                  key={p.num}
                  className="brief-avoid grid grid-cols-[3.5rem_1fr] md:grid-cols-[6rem_1fr] gap-4 md:gap-8 py-8 border-t border-line"
                >
                  <span className="heading-display text-2xl md:text-3xl text-ash/50 brief-soft">
                    {p.num}
                  </span>
                  <div>
                    <h3 className="heading-display text-lg md:text-xl text-gold brief-gold mb-3">
                      {p.title}
                    </h3>
                    <p className="text-sm md:text-[15px] text-parchment brief-ink leading-relaxed max-w-2xl">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-t border-line" />
            </div>
          </div>
        </section>

        {/* ── MOTTO ── */}
        <section className="pb-24 md:pb-32">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="brief-avoid text-center pt-6">
              <div className="divider mb-12" />
              <p className="font-mono text-[11px] tracking-[0.3em] text-ash brief-soft mb-6">
                ANTIDOSIS
              </p>
              <p className="heading-display text-3xl md:text-5xl text-gold brief-gold mb-4">
                Help your neighbour.
              </p>
              <p className="text-base md:text-lg text-sun brief-accent">
                It&apos;s worth more than it costs.
              </p>
              <div className="divider mt-12" />
            </div>
          </div>
        </section>
      </main>

      <div className="brief-print-footer" aria-hidden="true">
        ANTIDOSIS — EMPLOYEE BRIEF · INTERNAL · 16 OCTOBER 2026 · ANTIDOSIS.COM/BRIEF
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
