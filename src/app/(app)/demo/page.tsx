import Link from "next/link";

import { ArrowRight, ArrowRightLeft, FileText, MessageSquare, Terminal } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Interactive Demos — antidosis",
  description:
    "Learn how Antidosis works with hands-on demos. Try posting a need, using the terminal, or negotiating a contract — no account required.",
};

const DEMOS = [
  {
    id: "user-experience",
    title: "Full User Journey",
    description:
      "Walk through the entire exchange lifecycle from both sides. Watch Sarah post a need, Marcus find it, negotiate, and complete the exchange — with reviews.",
    icon: ArrowRightLeft,
    href: "/demo/user-experience",
    color: "#f5a623",
    bg: "#f5a62308",
    border: "#f5a62320",
    lessons: [
      "Posting a need and setting expectations",
      "How the browse feed and search works",
      "Expressing interest and getting accepted",
      "Negotiation, completion, and bilateral reviews",
    ],
  },
  {
    id: "terminal",
    title: "Community Terminal",
    description:
      "Watch a live replay of real terminal usage. See how community members find each other, negotiate deals, and build trust in public channels and DMs.",
    icon: MessageSquare,
    href: "/demo/terminal",
    color: "#00e5ff",
    bg: "#00e5ff08",
    border: "#00e5ff20",
    lessons: [
      "How channels like #general and #trades work",
      "Using /dm to start private conversations",
      "Finding users with /who and /users",
      "How mentions and replies work",
    ],
  },
  {
    id: "contract-flow",
    title: "Contract Flow",
    description:
      "Experience the full lifecycle of a formal exchange. Post a need, receive interest, negotiate terms, sign a binding contract, and leave reviews.",
    icon: FileText,
    href: "/demo/contract-flow",
    color: "#00e676",
    bg: "#00e67608",
    border: "#00e67620",
    lessons: [
      "Expressing interest on a need",
      "Negotiating terms and messaging",
      "Digital signatures and contract activation",
      "Marking complete and bilateral reviews",
    ],
  },
];

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0806]">
      {/* Hero */}
      <div className="border-b border-[#2a2420]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-xs text-[#8f7f6e] mb-6 font-mono">$ ./tutorials --interactive</p>
            <h1 className="heading-display text-4xl md:text-5xl text-[#e8d5a3] mb-6">
              Learn by <span className="text-[#f5a623]">doing.</span>
            </h1>
            <p className="text-base text-[#8f7f6e] leading-relaxed max-w-lg">
              These hands-on demos let you explore Antidosis without creating an account or
              affecting real data. Switch between users, try different flows, and reset anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {DEMOS.map((demo) => {
            const Icon = demo.icon;
            return (
              <div
                key={demo.id}
                className="group relative flex flex-col border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: demo.bg,
                  borderColor: demo.border,
                }}
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded mb-4"
                    style={{
                      background: `${demo.color}15`,
                      border: `1px solid ${demo.color}30`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: demo.color }} />
                  </div>
                  <h2 className="heading-display text-xl text-[#e8d5a3] mb-2">{demo.title}</h2>
                  <p className="text-sm text-[#8f7f6e] leading-relaxed">{demo.description}</p>
                </div>

                {/* Lessons */}
                <div className="px-6 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#7a6b5a] mb-3">
                    You will learn
                  </p>
                  <ul className="space-y-2">
                    {demo.lessons.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#b8a078]">
                        <span
                          className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: demo.color }}
                        />
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-5 mt-auto">
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full group-hover:border-current transition-colors"
                    style={{
                      borderColor: demo.border,
                    }}
                  >
                    <Link href={demo.href}>
                      Start Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal teaser */}
        <div className="mt-12 p-6 rounded-lg border border-[#2a2420] bg-[#12100e]">
          <div className="flex items-start gap-4">
            <Terminal className="h-5 w-5 text-[#00e5ff] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-[#e8d5a3] font-medium">Prefer learning by watching?</p>
              <p className="text-xs text-[#8f7f6e] mt-1">
                The Terminal demo auto-plays a realistic conversation between community members.
                Just hit play and watch how deals get made.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
