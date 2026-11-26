"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Wrench,
  Package,
  CircleDollarSign,
  MapPin,
  ArrowRight,
  Shuffle,
  Heart,
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { EXCHANGE_MODES, getExchangeMode } from "@/lib/categories";

import { examples } from "./examples-data";

const offerIcons = {
  service: <Wrench className="h-3.5 w-3.5" />,
  item: <Package className="h-3.5 w-3.5" />,
  money: <CircleDollarSign className="h-3.5 w-3.5" />,
};

const categoryFilters = [
  { value: "all", label: "All Examples" },
  ...EXCHANGE_MODES.map((m) => ({ value: m.value, label: m.label })),
];

export default function ExamplesPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered =
    categoryFilter === "all" ? examples : examples.filter((e) => e.category === categoryFilter);

  return (
    <div className="chapters min-h-screen bg-void text-gold flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="chapter scene-beacon pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-ash mb-8 font-mono">
              » EXAMPLE CATALOGUE — ILLUSTRATIONS ONLY
            </p>
            <h1 className="heading-display text-4xl md:text-6xl text-gold mb-6">
              What Can You
              <br />
              <span className="text-sun">Exchange?</span>
            </h1>
            <p className="text-base text-ash max-w-xl leading-relaxed mb-6">
              Antidosis is built on a simple idea: everyone has something worth broadcasting. A
              skill. An item. Time. A favour. These are illustrative examples to help you write a
              need—not live listings or completed exchanges.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/needs/new">Post Your Need</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/needs">Browse Needs</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Concept Explainer */}
        <section className="chapter scene-ember py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="vessel p-5">
                <div className="inline-flex bg-raise p-3 rounded-md text-sun mb-4">
                  <Shuffle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-gold mb-2">Swap Anything</h3>
                <p className="text-xs text-ash leading-relaxed">
                  Goods for goods. Skills for skills. Services for items. Cash for anything. There
                  is no fixed formula — if both parties agree, the exchange works.
                </p>
              </div>
              <div className="vessel p-5">
                <div className="inline-flex bg-raise p-3 rounded-md text-mercury mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-gold mb-2">Start Local</h3>
                <p className="text-xs text-ash leading-relaxed">
                  All these examples are from the Central Coast. Trade with people nearby — walk
                  over with your lemons, meet at the beach for the lesson, or drop off the tools on
                  your way past.
                </p>
              </div>
              <div className="vessel col-span-2 p-5 sm:col-span-1">
                <div className="inline-flex bg-raise p-3 rounded-md text-ok mb-4">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-gold mb-2">Build Trust</h3>
                <p className="text-xs text-ash leading-relaxed">
                  The best trades come from clear communication. Describe what you need honestly.
                  State what you are offering upfront. Use the contract system when money or
                  valuable items are involved.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters — plain chapter: a control strip, not a meaning change */}
        <section className="chapter py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-ash mb-4 font-mono">» CHANNELS — FILTER BY TYPE</p>
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((cat) => (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section className="chapter scene-scan border-t-0 pb-20 pt-8 md:pb-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {filtered.map((example) => {
                const catMeta = getExchangeMode(example.category);
                return (
                  <div key={example.id} className="vessel p-5 group">
                    {/* Category badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-medium ${catMeta?.twText ?? "text-ash"}`}
                      >
                        {catMeta?.label ?? example.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-ash">
                        <MapPin className="h-3 w-3" />
                        <span>{example.location}</span>
                      </div>
                    </div>

                    {/* I NEED */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-bad">
                          I Need
                        </span>
                        <div className="flex-1 h-px bg-line" />
                      </div>
                      <h3 className="text-base font-medium text-gold group-hover:text-sun transition-colors">
                        {example.needTitle}
                      </h3>
                      <p className="text-sm text-parchment leading-relaxed mt-1">
                        {example.needDescription}
                      </p>
                    </div>

                    {/* I OFFER */}
                    <div className="pt-3 border-t border-line">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-ok">
                          I Offer
                        </span>
                        <div className="flex-1 h-px bg-line" />
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-raise text-ash shrink-0 mt-0.5">
                          {offerIcons[example.offerType]}
                        </div>
                        <div>
                          <p className="text-sm text-parchment">{example.offerDescription}</p>
                          <span className="text-[10px] text-ash uppercase tracking-wide mt-0.5 inline-block">
                            {example.offerType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-sm text-ash">No examples in this category yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Inspiration Section */}
        <section className="chapter scene-bloom py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-ash mb-8 font-mono">
              » COMMON QUESTIONS — CLEARING THE STATIC
            </p>
            <h2 className="heading-display text-2xl md:text-4xl text-gold mb-10">
              Still Not Sure?
              <br />
              <span className="text-sun">Here Are Some Truths.</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[
                {
                  q: "I don't have anything valuable.",
                  a: "Everyone has time. Everyone has a skill they've forgotten is valuable. Can you drive manual? Bake? Listen well? That's worth something.",
                },
                {
                  q: "What if no one wants what I have?",
                  a: "Post it anyway. The Central Coast is full of people with complementary needs. Your excess lemons are someone's cocktail ingredients.",
                },
                {
                  q: "Can I offer money AND something else?",
                  a: "Absolutely. 'I'll pay $50 AND mow your lawn' is a powerful offer. Mixed exchanges are common and welcomed.",
                },
                {
                  q: "What about ongoing arrangements?",
                  a: "Many of the best trades are recurring. Weekly dog walks for weekly meals. Fortnightly guitar lessons for lawn mowing. Build a relationship.",
                },
                {
                  q: "Is it safe to trade with strangers?",
                  a: "Meet in public first. Use our contract system for anything valuable. Check profiles and reviews. Trust is built, not assumed.",
                },
                {
                  q: "Can businesses use this?",
                  a: "Yes. A food truck can trade meals for graphic design. A landscaper can trade labour for website help. A cafe can trade coffee for photography.",
                },
                {
                  q: "I'm just a backpacker passing through — is this for me?",
                  a: "Absolutely. Trade a few hours of work for a bed. Swap your van parking spot for a shower. House-sit for free accommodation. Your labour, skills, and time are just as valuable as anyone else's.",
                },
              ].map((item, i) => (
                <div key={i} className="vessel p-5">
                  <p className="text-sm font-medium text-gold mb-3">&ldquo;{item.q}&rdquo;</p>
                  <p className="text-xs text-ash leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="chapter scene-target py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-ash mb-8 font-mono">◉ BROADCAST YOUR NEED</p>
            <h2 className="heading-display text-3xl md:text-5xl text-gold mb-6">
              Your Need Is
              <br />
              <span className="text-sun">Someone Else&apos;s Want.</span>
            </h2>
            <p className="text-base text-ash max-w-md mb-10 leading-relaxed">
              These are just sparks. The real magic happens when you post something only you can
              offer. Be specific. Be honest. See who shows up.
            </p>
            <Button asChild size="lg">
              <Link href="/needs/new">
                Post a Need <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
