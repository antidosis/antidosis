"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  UserPlus,
  ShieldCheck,
  FileText,
  Gift,
  Search,
  Hand,
  Clock,
  ClipboardList,
  PenTool,
  Hammer,
  CheckCircle,
  Star,
  ArrowRight,
} from "lucide-react";

const sharedSteps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create Your Account",
    desc: "Sign up with email. Verify. Build your profile with skills, location, and a photo. The more complete, the more trust you earn.",
    color: "#f5a623",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Get Verified",
    desc: "Add credentials, link socials, verify your mobile. Verified profiles get more responses and stand out in search.",
    color: "#00e5ff",
  },
];

const posterSteps = [
  {
    num: "03",
    icon: FileText,
    title: "Post Your Need",
    desc: "Describe what you need: a service, an item, or help with something. Set your deadline and location.",
    color: "#f5a623",
  },
  {
    num: "04",
    icon: Gift,
    title: "Define Your Offer",
    desc: "Say what you'll give back: a service, an item, or money. Add photos. Be specific — detail builds trust.",
    color: "#f5a623",
  },
  {
    num: "05",
    icon: Search,
    title: "Review Interested Responses",
    desc: "People who can help will express interest. Check their profiles, ratings, and skills. Message them first if you want.",
    color: "#f5a623",
  },
  {
    num: "06",
    icon: Hand,
    title: "Accept & Form a Contract",
    desc: "Choose the right person. Accept their interest. A contract draft is created automatically.",
    color: "#f5a623",
  },
];

const responderSteps = [
  {
    num: "03",
    icon: Search,
    title: "Browse Needs",
    desc: "Filter by type, location, or skill. See what people near you need and what they're offering in return.",
    color: "#00e5ff",
  },
  {
    num: "04",
    icon: Hand,
    title: "Express Interest",
    desc: "Found a match? Send a message introducing yourself and why you're a good fit. Or ask questions first.",
    color: "#00e5ff",
  },
  {
    num: "05",
    icon: Clock,
    title: "Wait for Response",
    desc: "The poster reviews your profile and message. If they accept your interest, a contract draft is created.",
    color: "#00e5ff",
  },
];

const completionSteps = [
  {
    num: "07",
    icon: ClipboardList,
    title: "Negotiate Terms",
    desc: "Both parties edit the contract: your individual terms, shared deadline, completion method, and any extras. Agree when ready.",
    color: "#b24bf5",
  },
  {
    num: "08",
    icon: PenTool,
    title: "Sign Digitally",
    desc: "A PDF contract is generated. Both parties sign digitally. The contract is now binding and active.",
    color: "#b24bf5",
  },
  {
    num: "09",
    icon: Hammer,
    title: "Do the Work",
    desc: "Complete what you agreed to. Communicate through the built-in messaging. Stay on track.",
    color: "#b24bf5",
  },
  {
    num: "10",
    icon: CheckCircle,
    title: "Mark Complete",
    desc: "Both parties mark the contract as complete. Only when both agree is it finalized.",
    color: "#b24bf5",
  },
  {
    num: "11",
    icon: Star,
    title: "Leave a Review",
    desc: "Rate each other 1-10. Public comments build reputation. Private feedback helps people improve. Your review becomes part of their permanent history.",
    color: "#b24bf5",
  },
];

function StepCard({
  num,
  icon: Icon,
  title,
  desc,
  color,
}: {
  num: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 flex items-center justify-center border border-[#2a2420] bg-[#12100e] shrink-0"
          style={{ borderColor: `${color}30` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="w-px flex-1 bg-[#2a2420] my-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono text-[#7a6b5a]">{num}</span>
          <h3 className="heading-display text-lg" style={{ color }}>
            {title}
          </h3>
        </div>
        <p className="text-sm text-[#7a6b5a] leading-relaxed max-w-md">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat docs/how-it-works.md</p>
            <h1 className="heading-display text-4xl md:text-6xl text-[#e8d5a3] mb-6">
              How Antidosis
              <br />
              <span className="text-[#f5a623]">Works</span>
            </h1>
            <p className="text-base text-[#7a6b5a] max-w-lg leading-relaxed mb-10">
              From post to handshake. Every step. Whether you&apos;re posting a need or responding to one, here&apos;s exactly what happens.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/needs/new">Post a Need</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/needs">Browse Needs</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Shared: Getting Started */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat docs/getting-started.md</p>
            <h2 className="heading-display text-2xl text-[#e8d5a3] mb-10">Getting Started</h2>
            <div>
              {sharedSteps.map((step) => (
                <StepCard key={step.num} {...step} />
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Dual Journey */}
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ls journeys/</p>
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Poster Journey */}
              <div>
                <h2 className="heading-display text-2xl text-[#f5a623] mb-2">Poster Journey</h2>
                <p className="text-sm text-[#7a6b5a] mb-10">You need something. You offer something back.</p>
                <div>
                  {posterSteps.map((step) => (
                    <StepCard key={`poster-${step.num}`} {...step} />
                  ))}
                </div>
              </div>

              {/* Responder Journey */}
              <div>
                <h2 className="heading-display text-2xl text-[#00e5ff] mb-2">Responder Journey</h2>
                <p className="text-sm text-[#7a6b5a] mb-10">You can help. You browse and express interest.</p>
                <div>
                  {responderSteps.map((step) => (
                    <StepCard key={`responder-${step.num}`} {...step} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Shared: Contract & Completion */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat docs/completion.md</p>
            <h2 className="heading-display text-2xl text-[#b24bf5] mb-2">Contract & Completion</h2>
            <p className="text-sm text-[#7a6b5a] mb-10">Both parties walk this path together.</p>
            <div>
              {completionSteps.map((step) => (
                <StepCard key={step.num} {...step} />
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./join_network.sh</p>
            <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
              Ready to
              <br />
              <span className="text-[#f5a623]">Start?</span>
            </h2>
            <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
              Join the Central Coast community. Post your first need or browse what&apos;s available.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/needs/new">Post a Need <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/needs">Browse Needs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
