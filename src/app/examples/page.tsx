"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Wrench, Package, CircleDollarSign, MapPin, ArrowRight } from "lucide-react";

const examples = [
  {
    id: 1,
    needTitle: "Help moving house",
    needDescription: "Moving from Terrigal to Wamberal. One bedroom apartment — bed, desk, bookshelf, boxes. Saturday morning preferred.",
    offerType: "service" as const,
    offerDescription: "I'll mow your lawns for a month",
    location: "Terrigal → Wamberal",
  },
  {
    id: 2,
    needTitle: "Piano lessons for my daughter",
    needDescription: "Beginner level, 8 years old. Once a week for 30 mins. We have a keyboard at home.",
    offerType: "service" as const,
    offerDescription: "I'll build you a custom bookshelf",
    location: "Erina",
  },
  {
    id: 3,
    needTitle: "Dog walking, 3 days a week",
    needDescription: "Medium-sized labrador, friendly. Needs a walk Mon/Wed/Fri around 2pm while I'm at work.",
    offerType: "service" as const,
    offerDescription: "Weekly home-cooked meals for two",
    location: "Avoca Beach",
  },
  {
    id: 4,
    needTitle: "Help assembling IKEA furniture",
    needDescription: "BILLY bookcase, MALM bed frame, and a desk. Tools provided. Should take 2-3 hours.",
    offerType: "item" as const,
    offerDescription: "My vintage road bike — rides well, needs a tune",
    location: "Kincumber",
  },
  {
    id: 5,
    needTitle: "Graphic design for food truck logo",
    needDescription: "Need a logo and menu board design for my new food truck. Have rough sketches and colour ideas.",
    offerType: "item" as const,
    offerDescription: "A Weber kettle BBQ, barely used",
    location: "Gosford",
  },
  {
    id: 6,
    needTitle: "Fresh produce from my garden",
    needDescription: "Tomatoes, zucchini, herbs — way more than I can eat. Harvested weekly. You pick up.",
    offerType: "service" as const,
    offerDescription: "Help me build raised garden beds",
    location: "Macmasters Beach",
  },
  {
    id: 7,
    needTitle: "Maths tutor for my teenager",
    needDescription: "Year 10 student falling behind in algebra and trig. Needs one hour a week after school, either at our place or online.",
    offerType: "item" as const,
    offerDescription: "An old iPhone 12, unlocked, 64GB — good condition, battery health 85%",
    location: "Woy Woy",
  },
  {
    id: 8,
    needTitle: "Leaking tap fixed",
    needDescription: "Kitchen tap dripping constantly. Washer probably needs replacing. Parts supplied.",
    offerType: "money" as const,
    offerDescription: "$80 cash",
    location: "Umina Beach",
  },
  {
    id: 9,
    needTitle: "Website for landscaping business",
    needDescription: "Simple 5-page site: home, services, gallery, about, contact. Photos and copy ready.",
    offerType: "money" as const,
    offerDescription: "$1,200 or equivalent trade",
    location: "Copacabana",
  },
  {
    id: 10,
    needTitle: "French conversation practice",
    needDescription: "Intermediate level. Want to practice speaking 1 hour a week. No formal teaching needed — just chat.",
    offerType: "service" as const,
    offerDescription: "I'll teach you to surf at Macmasters",
    location: "Macmasters Beach",
  },
];

const offerTypes = [
  { value: "all", label: "All" },
  { value: "service", label: "Service" },
  { value: "item", label: "Item" },
  { value: "money", label: "Money" },
];

const offerIcons = {
  service: <Wrench className="h-3.5 w-3.5" />,
  item: <Package className="h-3.5 w-3.5" />,
  money: <CircleDollarSign className="h-3.5 w-3.5" />,
};

export default function ExamplesPage() {
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = typeFilter === "all"
    ? examples
    : examples.filter((e) => e.offerType === typeFilter);

  return (
    <div className="min-h-screen bg-[#0a0806] text-[#e8d5a3] flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ cat /etc/antidosis/examples.md</p>
            <h1 className="heading-display text-4xl md:text-6xl text-[#e8d5a3] mb-6">
              What Can You
              <br />
              <span className="text-[#f5a623]">Exchange?</span>
            </h1>
            <p className="text-base text-[#7a6b5a] max-w-lg leading-relaxed mb-10">
              Real exchanges happening right now. Service for service. Item for item. Cash for time. Or any mix you can imagine.
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

        <div className="divider" />

        {/* Filters */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex gap-2">
              {offerTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={typeFilter === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section className="pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((example) => (
                <div key={example.id} className="vessel p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-base font-medium text-[#e8d5a3]">{example.needTitle}</h3>
                    <span className="shrink-0 text-xs text-[#7a6b5a] uppercase tracking-wide">
                      {example.offerType}
                    </span>
                  </div>
                  <p className="text-sm text-[#b8a078] leading-relaxed mb-4">{example.needDescription}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#7a6b5a] mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>{example.location}</span>
                  </div>
                  <div className="pt-3 border-t border-[#2a2420] flex items-center gap-2">
                    <div className="p-1.5 bg-[#1a1714] text-[#7a6b5a]">
                      {offerIcons[example.offerType]}
                    </div>
                    <span className="text-sm text-[#b8a078]">{example.offerDescription}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* CTA */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-xs text-[#7a6b5a] mb-8 font-mono">$ ./post_need.sh</p>
            <h2 className="heading-display text-3xl md:text-5xl text-[#e8d5a3] mb-6">
              Have Something
              <br />
              <span className="text-[#f5a623]">in Mind?</span>
            </h2>
            <p className="text-base text-[#7a6b5a] max-w-md mb-10 leading-relaxed">
              These are just examples. Your need is unique. Post it and see who can help.
            </p>
            <Button asChild size="lg">
              <Link href="/needs/new">Post a Need <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
