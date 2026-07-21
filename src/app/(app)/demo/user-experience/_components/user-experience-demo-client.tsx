"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Briefcase,
  Calendar,
  Check,
  Clock,
  Handshake,
  Lightbulb,
  MapPin,
  MessageSquare,
  Package,
  PlusCircle,
  RotateCcw,
  Send,
  Shield,
  Star,
  Wrench,
  X,
  CircleDollarSign,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getExchangeMode } from "@/lib/categories";

import {
  DEMO_SARAH,
  DEMO_MARCUS,
  DEMO_EMMA,
  DEMO_DAVID,
  DEMO_NEED,
  OTHER_NEEDS,
  DEMO_MESSAGES_CONTRACT,
  DEMO_MESSAGES_FREEFORM,
  DEMO_REVIEWS,
  DEMO_SARAH_PAST_REVIEWS,
  STEPS,
} from "./mock-data";

/* ─── Types ─── */

interface DemoState {
  stepIdx: number;
  posted: boolean;
  useContract: boolean;
  interestSent: boolean;
  interestAccepted: boolean;
  messagesRevealed: number;
  markedComplete: boolean;
  posterReviewed: boolean;
  fulfillerReviewed: boolean;
}

/* ─── Main Component ─── */

export default function UserExperienceDemoClient() {
  const [state, setState] = useState<DemoState>({
    stepIdx: 0,
    posted: false,
    useContract: true,
    interestSent: false,
    interestAccepted: false,
    messagesRevealed: 0,
    markedComplete: false,
    posterReviewed: false,
    fulfillerReviewed: false,
  });

  const messages = state.useContract ? DEMO_MESSAGES_CONTRACT : DEMO_MESSAGES_FREEFORM;

  const step = STEPS[state.stepIdx];
  const isLast = state.stepIdx === STEPS.length - 1;
  const isFirst = state.stepIdx === 0;
  const user = step.persona === "sarah" ? DEMO_SARAH : DEMO_MARCUS;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Auto-play micro-animations within certain steps
  useEffect(() => {
    clearTimer();

    if (state.stepIdx === 0 && !state.posted) {
      // Auto-mark posted after 1.5s on the post-need step
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, posted: true }));
      }, 1500);
    }

    if (state.stepIdx === 3 && !state.interestSent) {
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, interestSent: true }));
      }, 1500);
    }

    if (state.stepIdx === 4 && !state.interestAccepted) {
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, interestAccepted: true }));
      }, 1500);
    }

    if (state.stepIdx === 5 && state.messagesRevealed < messages.length) {
      // Reveal messages one by one
      const reveal = () => {
        setState((s) => {
          if (s.stepIdx !== 5) return s;
          const msgArr = s.useContract ? DEMO_MESSAGES_CONTRACT : DEMO_MESSAGES_FREEFORM;
          const next = Math.min(s.messagesRevealed + 1, msgArr.length);
          if (next < msgArr.length) {
            timerRef.current = setTimeout(reveal, 1800);
          }
          return { ...s, messagesRevealed: next };
        });
      };
      timerRef.current = setTimeout(reveal, 800);
    }

    if (state.stepIdx === 6 && !state.markedComplete) {
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, markedComplete: true }));
      }, 1500);
    }

    if (state.stepIdx === 7 && !state.posterReviewed) {
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, posterReviewed: true }));
      }, 1500);
    }

    if (state.stepIdx === 8 && !state.fulfillerReviewed) {
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, fulfillerReviewed: true }));
      }, 1500);
    }

    return () => clearTimer();
  }, [
    state.stepIdx,
    state.posted,
    state.useContract,
    state.interestSent,
    state.interestAccepted,
    state.messagesRevealed,
    state.markedComplete,
    state.posterReviewed,
    state.fulfillerReviewed,
    clearTimer,
    messages.length,
  ]);

  const nextStep = useCallback(() => {
    if (isLast) return;
    setState((s) => ({
      ...s,
      stepIdx: s.stepIdx + 1,
    }));
  }, [isLast]);

  const toggleContract = useCallback(() => {
    setState((s) => ({ ...s, useContract: !s.useContract }));
  }, []);

  const prevStep = useCallback(() => {
    if (isFirst) return;
    setState((s) => ({
      ...s,
      stepIdx: s.stepIdx - 1,
      // Reset animation flags for steps we're going back past
      posted: s.stepIdx - 1 <= 0 ? false : s.posted,
      interestSent: s.stepIdx - 1 <= 3 ? false : s.interestSent,
      interestAccepted: s.stepIdx - 1 <= 4 ? false : s.interestAccepted,
      messagesRevealed: s.stepIdx - 1 <= 5 ? 0 : s.messagesRevealed,
      markedComplete: s.stepIdx - 1 <= 6 ? false : s.markedComplete,
      posterReviewed: s.stepIdx - 1 <= 7 ? false : s.posterReviewed,
      fulfillerReviewed: s.stepIdx - 1 <= 8 ? false : s.fulfillerReviewed,
    }));
  }, [isFirst]);

  const reset = useCallback(() => {
    clearTimer();
    setState({
      stepIdx: 0,
      posted: false,
      useContract: true,
      interestSent: false,
      interestAccepted: false,
      messagesRevealed: 0,
      markedComplete: false,
      posterReviewed: false,
      fulfillerReviewed: false,
    });
  }, [clearTimer]);

  const goToStep = useCallback(
    (idx: number) => {
      clearTimer();
      setState((s) => ({ ...s, stepIdx: idx }));
    },
    [clearTimer]
  );

  // Whether the current step's animation is done
  const stepReady =
    state.stepIdx === 0
      ? state.posted
      : state.stepIdx === 1
        ? true
        : state.stepIdx === 2
          ? true
          : state.stepIdx === 3
            ? state.interestSent
            : state.stepIdx === 4
              ? state.interestAccepted
              : state.stepIdx === 5
                ? state.messagesRevealed >= messages.length
                : state.stepIdx === 6
                  ? state.markedComplete
                  : state.stepIdx === 7
                    ? state.posterReviewed
                    : state.stepIdx === 8
                      ? state.fulfillerReviewed
                      : true;

  return (
    <div>
      {/* Guide Bar */}
      <div className="sticky top-[53px] z-40 bg-[#0a0806]/95 backdrop-blur border-b border-[#2a2420]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            {/* Persona */}
            <div
              className="flex items-center gap-2.5 shrink-0 px-3 py-2 rounded border"
              style={{
                borderColor: `${user.color}40`,
                backgroundColor: `${user.color}10`,
              }}
            >
              <Avatar name={user.name} size="sm" />
              <div>
                <p className="text-xs font-medium" style={{ color: user.color }}>
                  You are {user.name}
                </p>
                <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider">
                  {step.persona === "sarah" ? "Poster" : "Fulfiller"}
                </p>
              </div>
            </div>

            {/* Instruction */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e8d5a3]">
                Step {state.stepIdx + 1} of {STEPS.length}: {step.label}
              </p>
              <p className="text-xs text-[#b8a078] mt-0.5">{step.instruction}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={prevStep}
                disabled={isFirst}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === state.stepIdx
                        ? "w-4 bg-[#f5a623]"
                        : i < state.stepIdx
                          ? "w-1.5 bg-[#00e676]"
                          : "w-1.5 bg-[#2a2420]"
                    }`}
                  />
                ))}
              </div>
              <Button
                size="sm"
                variant={stepReady ? "default" : "secondary"}
                onClick={nextStep}
                disabled={!stepReady || isLast}
                className="h-8 w-8 p-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={reset}
                className="h-8 w-8 p-0 text-[#7a6b5a]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scene */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {state.stepIdx === 0 && (
          <ScenePostNeed
            posted={state.posted}
            useContract={state.useContract}
            onToggleContract={toggleContract}
          />
        )}
        {state.stepIdx === 1 && <SceneBrowse useContract={state.useContract} />}
        {state.stepIdx === 2 && <SceneProfile />}
        {state.stepIdx === 3 && (
          <SceneNeedDetailAndExpressInterest
            sent={state.interestSent}
            useContract={state.useContract}
          />
        )}
        {state.stepIdx === 4 && (
          <ScenePosterView accepted={state.interestAccepted} useContract={state.useContract} />
        )}
        {state.stepIdx === 5 && (
          <SceneMessageThread revealed={state.messagesRevealed} useContract={state.useContract} />
        )}
        {state.stepIdx === 6 && (
          <SceneMarkComplete marked={state.markedComplete} useContract={state.useContract} />
        )}
        {state.stepIdx === 7 && <SceneReviewPoster submitted={state.posterReviewed} />}
        {state.stepIdx === 8 && <SceneReviewFulfiller submitted={state.fulfillerReviewed} />}
        {state.stepIdx === 9 && <SceneSummary />}
      </div>
    </div>
  );
}

/* ─── Scene 1: Sarah posts a need ─── */

function ScenePostNeed({
  posted,
  useContract,
  onToggleContract,
}: {
  posted: boolean;
  useContract: boolean;
  onToggleContract: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="py-2">
          <span className="inline-flex items-center text-sm text-[#7a6b5a]">
            <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
          </span>
        </div>
        <h1 className="heading-display text-2xl text-[#e8d5a3]">Post Need</h1>
        <p className="text-xs text-[#7a6b5a] mt-3">$ nano new_need.conf</p>
        <p className="text-sm text-[#b8a078] mb-2">
          describe what you need and what you are offering in exchange
        </p>
      </div>

      <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-[#f5a623] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[#e8d5a3] font-medium">
              posts with images get 3x more responses
            </p>
            <p className="text-xs text-[#7a6b5a] mt-1">
              add photos of what you need and what you are offering. it builds instant trust.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="vessel-need p-5">
          <p className="text-xs text-[#35c2f0] uppercase tracking-wide font-medium mb-1">
            [what you need]
          </p>
          <p className="text-xs text-[#7a6b5a] mb-5">what are you seeking from the community?</p>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={DEMO_NEED.title} readOnly className="bg-[#0f0c0a] border-[#2a2420]" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={DEMO_NEED.description}
                readOnly
                rows={5}
                className="bg-[#0f0c0a] border-[#2a2420] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-[#7a6b5a]" />
                  <Label>Deadline</Label>
                </div>
                <Input
                  value={DEMO_NEED.deadline}
                  readOnly
                  className="bg-[#0f0c0a] border-[#2a2420]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-[#7a6b5a]" />
                  <Label>Time Estimate</Label>
                </div>
                <Input
                  value={DEMO_NEED.timeRange}
                  readOnly
                  className="bg-[#0f0c0a] border-[#2a2420]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-2">
                {DEMO_NEED.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-[11px] uppercase tracking-wider rounded border border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/5"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="vessel-offer p-5">
          <p className="text-xs text-[#f5a623] uppercase tracking-wide font-medium mb-1">
            [what you are offering]
          </p>
          <p className="text-xs text-[#7a6b5a] mb-5">what will you give in exchange?</p>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "service", icon: Wrench, active: true },
                { type: "item", icon: Package, active: false },
                { type: "money", icon: CircleDollarSign, active: false },
              ].map(({ type, icon: Icon, active }) => (
                <div
                  key={type}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded border ${active ? "border-[#f5a623] bg-[#f5a623]/5 text-[#e8d5a3]" : "border-[#2a2420] bg-[#0f0c0a] text-[#7a6b5a]"}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium capitalize">{type}</span>
                </div>
              ))}
            </div>

            {/* Sub-category */}
            <div className="space-y-2">
              <Label className="text-xs text-[#7a6b5a]">Sub-category</Label>
              {(() => {
                const mode = getExchangeMode(DEMO_NEED.needCategory);
                if (!mode) return null;
                return (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
                    >
                      {mode.label}
                    </span>
                    <span className="text-xs text-[#7a6b5a]">
                      —{" "}
                      {DEMO_NEED.offerType === "service"
                        ? "offering a service"
                        : DEMO_NEED.offerType === "item"
                          ? "offering an item"
                          : "offering money"}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>Offer Description</Label>
              <Textarea
                value={DEMO_NEED.offerDescription}
                readOnly
                rows={2}
                className="bg-[#0f0c0a] border-[#2a2420] text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Value</Label>
              <Input
                value={`$${DEMO_NEED.offerValue}`}
                readOnly
                className="bg-[#0f0c0a] border-[#2a2420]"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="border border-[#ff5252]/30 bg-[#ff5252]/5 p-5">
        <p className="text-xs text-[#ff5252] uppercase tracking-wide font-medium mb-1">[where]</p>
        <p className="text-xs text-[#7a6b5a] mb-3">where is this need located?</p>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#7a6b5a]" />
          <Input
            value={DEMO_NEED.location}
            readOnly
            className="bg-[#0f0c0a] border-[#2a2420] max-w-sm"
          />
        </div>
      </div>

      {/* Deal Type Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#7a6b5a] uppercase tracking-wide font-medium">[deal type]</p>
          <span className="text-[10px] text-[#f5a623]">click a card to switch</span>
        </div>
        <p className="text-xs text-[#7a6b5a]">choose how you want to structure this exchange</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => useContract && onToggleContract()}
            className={`text-left p-5 rounded border transition-all ${
              !useContract
                ? "border-[#00e676] bg-[#00e676]/5"
                : "border-[#2a2420] bg-[#0f0c0a] hover:border-[#3a342e]"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded ${!useContract ? "bg-[#00e676]/10" : "bg-[#1a1714]"}`}>
                <Handshake
                  className={`h-5 w-5 ${!useContract ? "text-[#00e676]" : "text-[#7a6b5a]"}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${!useContract ? "text-[#00e676]" : "text-[#e8d5a3]"}`}
                >
                  Free Form
                </p>
                <p className="text-[10px] text-[#7a6b5a]">handshake deal</p>
              </div>
            </div>
            <p className="text-xs text-[#8f7f6e]">
              Trust-based exchange with no formal contract. Best for smaller jobs or when you
              already know the person.
            </p>
          </button>

          <button
            onClick={() => !useContract && onToggleContract()}
            className={`text-left p-5 rounded border transition-all ${
              useContract
                ? "border-[#f5a623] bg-[#f5a623]/5"
                : "border-[#2a2420] bg-[#0f0c0a] hover:border-[#3a342e]"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded ${useContract ? "bg-[#f5a623]/10" : "bg-[#1a1714]"}`}>
                <Shield
                  className={`h-5 w-5 ${useContract ? "text-[#f5a623]" : "text-[#7a6b5a]"}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${useContract ? "text-[#f5a623]" : "text-[#e8d5a3]"}`}
                >
                  Formal Contract
                </p>
                <p className="text-[10px] text-[#7a6b5a]">structured terms</p>
              </div>
            </div>
            <p className="text-xs text-[#8f7f6e]">
              Written terms, digital signatures, and built-in dispute resolution. Recommended for
              larger or more complex exchanges.
            </p>
          </button>
        </div>
      </div>

      <div className="flex gap-3 pb-12">
        <Button size="lg" className="flex-1" disabled={!posted}>
          {posted ? (
            <>
              <Check className="h-4 w-4 mr-2" /> Posted
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" /> Posting...
            </>
          )}
        </Button>
        <Button size="lg" variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Scene 2: Marcus browses needs ─── */

/* ─── Mock Need Detail (reusable) ─── */

interface NeedView {
  id: string;
  title: string;
  description: string;
  offerType: string;
  offerDescription: string;
  offerValue: number;
  location: string;
  requiredSkills: string[];
  poster: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
    reviews: number;
    bio: string;
    skills: string[];
  };
}

function MockNeedDetail({ need, onBack }: { need: any; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="py-2">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> browse needs
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">{need.title}</h1>
              <Badge variant="outline" className="text-[10px]">
                {need.offerType}
              </Badge>
              {need.needCategory &&
                (() => {
                  const mode = getExchangeMode(need.needCategory);
                  if (!mode) return null;
                  return (
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
                    >
                      {mode.label}
                    </span>
                  );
                })()}
              {need.requiresContract && (
                <Badge className="text-[10px] bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
                  <Shield className="h-3 w-3 mr-1" /> Contract
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(need.requiredSkills as string[]).map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
                >
                  {s}
                </span>
              ))}
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {need.location}
              </span>
            </div>
            <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">
              {need.description}
            </p>
          </div>

          <div className="vessel p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                offering in exchange
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-[#e8d5a3]">{need.offerDescription}</p>
              {need.offerValue > 0 && (
                <span className="text-xs text-[#b8a078]">
                  est. ${need.offerValue.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="vessel p-4">
            <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-3">Posted by</p>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={need.poster.name} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#e8d5a3]">{need.poster.name}</span>
                  {need.poster.verified && <Shield className="h-3.5 w-3.5 text-[#00e676]" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8f7f6e] mt-0.5">
                  <Star className="h-3 w-3 text-[#f5a623]" />
                  <span>
                    {need.poster.rating} ({need.poster.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#8f7f6e] leading-relaxed mb-3">{need.poster.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {(need.poster.skills as string[]).map((s: string) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 text-[10px] text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <Button className="w-full" size="lg">
            <Handshake className="h-4 w-4 mr-1.5" /> Express Interest
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Mock Profile (reusable) ─── */

interface UserView {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  completed: number;
  bio: string;
  skills: string[];
  location: string;
}

function MockProfile({ user, onBack }: { user: any; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
        </button>
      </div>

      <p className="text-xs text-[#7a6b5a] mb-4">
        $ finger {user.name.toLowerCase().replace(/\s/g, "_")}
      </p>

      <div className="vessel p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar name={user.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-2xl text-[#e8d5a3]">{user.name}</h1>
              {user.verified && <Shield className="h-5 w-5 text-[#00e676]" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#b8a078] mt-2">
              <span className="flex items-center gap-1 text-[#f5a623]">
                <Star className="h-4 w-4 fill-current" />
                {user.rating.toFixed(1)} ({user.reviews} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {user.completed} completed
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
            </div>
            <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">{user.bio}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {user.skills.map((s: string) => (
                <span
                  key={s}
                  className="text-xs text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 2: Browse Needs (interactive) ─── */

function SceneBrowse({ useContract }: { useContract: boolean }) {
  const needs = [{ ...DEMO_NEED, requiresContract: useContract }, ...OTHER_NEEDS];
  const [view, setView] = useState<
    { type: "list" } | { type: "need"; needId: string } | { type: "profile"; userId: string }
  >({ type: "list" });

  if (view.type === "need") {
    const need = needs.find((n) => n.id === view.needId);
    if (!need) return null;
    return <MockNeedDetail need={need} onBack={() => setView({ type: "list" })} />;
  }

  if (view.type === "profile") {
    const allPosters = [DEMO_SARAH, DEMO_EMMA, DEMO_DAVID];
    const user = allPosters.find((u) => u.id === view.userId);
    if (!user) return null;
    return <MockProfile user={user} onBack={() => setView({ type: "list" })} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="heading-display text-2xl text-[#e8d5a3]">Browse Needs</h1>
          <p className="text-sm text-[#b8a078] mt-2">
            find skills, goods, and services people are looking for
          </p>
        </div>
        <Button variant="default" size="sm">
          <PlusCircle className="h-4 w-4 mr-1.5" /> Post Need
        </Button>
      </div>

      <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-4">
        <p className="text-sm text-[#00e5ff]">
          antidosis is currently in pilot on the Central Coast, NSW
        </p>
        <p className="text-xs text-[#7a6b5a] mt-1">
          help us grow by inviting neighbours and leaving reviews after exchanges.
        </p>
      </div>

      <div className="vessel p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input placeholder="search needs..." className="bg-[#0f0c0a]" readOnly />
          </div>
          <div className="flex gap-2">
            {["All", "Service", "Item", "Money"].map((t, i) => (
              <Button
                key={t}
                size="sm"
                variant={i === 1 ? "default" : "outline"}
                className="text-xs"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {needs.map((need, i) => (
          <div
            key={need.id}
            className={`vessel p-5 transition-all ${i === 0 ? "border-[#f5a623]/30 bg-[#f5a623]/5" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium text-[#e8d5a3]">{need.title}</h3>
                  {i === 0 && (
                    <Badge className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/30">
                      just posted
                    </Badge>
                  )}
                  {need.needCategory &&
                    (() => {
                      const mode = getExchangeMode(need.needCategory);
                      if (!mode) return null;
                      return (
                        <span
                          className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
                        >
                          {mode.label}
                        </span>
                      );
                    })()}
                  {need.requiresContract && (
                    <Badge className="text-[10px] bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
                      <Shield className="h-3 w-3 mr-1" /> Contract
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[#b8a078] mt-1 line-clamp-2">{need.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-[#7a6b5a]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {need.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {need.timeRange}
                  </span>
                  {need.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs text-[#7a6b5a] bg-[#1a1714] border border-[#2a2420] rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[#e8d5a3] font-medium">
                  {need.offerType === "money"
                    ? `$${need.offerValue}`
                    : need.offerDescription.slice(0, 20) + "…"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2420]">
              <button
                onClick={() => setView({ type: "profile", userId: need.poster.id })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar name={need.poster.name} size="sm" />
                <span className="text-xs text-[#8f7f6e]">{need.poster.name}</span>
                {need.poster.verified && <Shield className="h-3 w-3 text-[#00e676]" />}
                <span className="text-xs text-[#7a6b5a]">
                  <Star className="h-3 w-3 text-[#f5a623] inline" /> {need.poster.rating}
                </span>
              </button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={() => setView({ type: "need", needId: need.id })}
              >
                View Need
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Scene 3: Sarah's Profile ─── */

function SceneProfile() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="py-6 flex items-center justify-between">
        <span className="inline-flex items-center text-sm text-[#7a6b5a]">
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
        </span>
      </div>

      <p className="text-xs text-[#7a6b5a] mb-4">$ finger sarah_chen</p>

      {/* Profile Header */}
      <div className="vessel p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar name={DEMO_SARAH.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-2xl text-[#e8d5a3]">{DEMO_SARAH.name}</h1>
              {DEMO_SARAH.verified && <Shield className="h-5 w-5 text-[#00e676]" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#b8a078] mt-2">
              <span className="flex items-center gap-1 text-[#f5a623]">
                <Star className="h-4 w-4 fill-current" />
                {DEMO_SARAH.rating.toFixed(1)} ({DEMO_SARAH.reviews} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {DEMO_SARAH.completed} completed
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {DEMO_SARAH.location}
              </span>
            </div>
            <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">{DEMO_SARAH.bio}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {DEMO_SARAH.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded px-2 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Needs */}
      <div className="space-y-6">
        <p className="text-xs text-[#7a6b5a]">$ ls ~sarah_chen/needs/</p>
        <div className="space-y-4">
          <div className="vessel p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-[#e8d5a3]">{DEMO_NEED.title}</h3>
                <p className="text-sm text-[#b8a078] mt-1 line-clamp-1">{DEMO_NEED.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DEMO_NEED.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-xs font-medium uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-xs text-[#7a6b5a] uppercase tracking-wide">
                0 offers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        <p className="text-xs text-[#7a6b5a]">$ cat ~sarah_chen/reviews.log</p>
        <div className="space-y-4">
          {DEMO_SARAH_PAST_REVIEWS.map((review) => (
            <div key={review.id} className="vessel p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={review.giver.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[#e8d5a3]">{review.giver.name}</p>
                    <p className="text-xs text-[#7a6b5a]">{review.needTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#f5a623]">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{review.rating}/10</span>
                </div>
              </div>
              <p className="text-sm text-[#b8a078] mt-4 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 4: Need Detail + Express Interest ─── */

function SceneNeedDetailAndExpressInterest({
  sent,
  useContract,
}: {
  sent: boolean;
  useContract: boolean;
}) {
  const message =
    "Hey Sarah! Saw your post — I can definitely help with the garden. I specialise in native plants and have 8 years experience. Available this Saturday.";
  return (
    <div className="space-y-6">
      <div className="py-2">
        <span className="inline-flex items-center text-sm text-[#7a6b5a]">
          <ArrowLeft className="mr-2 h-4 w-4" /> browse needs
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">
                {DEMO_NEED.title}
              </h1>
              <Badge variant="outline" className="text-[10px]">
                service
              </Badge>
              {(() => {
                const mode = getExchangeMode(DEMO_NEED.needCategory);
                if (!mode) return null;
                return (
                  <span
                    className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
                  >
                    {mode.label}
                  </span>
                );
              })()}
              {useContract && (
                <Badge className="text-[10px] bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
                  <Shield className="h-3 w-3 mr-1" /> Contract Required
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {DEMO_NEED.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
                >
                  {s}
                </span>
              ))}
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {DEMO_NEED.location}
              </span>
            </div>
            <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">
              {DEMO_NEED.description}
            </p>
          </div>

          <div className="vessel p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
                offering in exchange
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-[#e8d5a3]">{DEMO_NEED.offerDescription}</p>
              <span className="text-xs text-[#b8a078]">
                est. ${DEMO_NEED.offerValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Express Interest Form */}
          <div className="vessel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Handshake className="h-4 w-4 text-[#00e5ff]" />
              <span className="text-xs text-[#00e5ff] uppercase tracking-wide font-medium">
                Express Interest
              </span>
            </div>
            {!sent ? (
              <div className="space-y-3">
                <label className="text-xs text-[#8f7f6e]">
                  Message to {DEMO_SARAH.name}{" "}
                  <span className="text-[#7a6b5a]">(optional but recommended)</span>
                </label>
                <Textarea rows={4} value={message} readOnly className="bg-[#0f0c0a]" />
                <div className="flex items-center gap-3">
                  <Button disabled>
                    <Send className="h-4 w-4 mr-1.5" /> Sending...
                  </Button>
                  <span className="text-xs text-[#7a6b5a]">
                    This notifies {DEMO_SARAH.name} immediately
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#00e676]">
                <Check className="h-4 w-4" />
                <span>Interest sent — Sarah has been notified</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="vessel p-4">
            <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-3">Posted by</p>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={DEMO_SARAH.name} size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#e8d5a3]">{DEMO_SARAH.name}</span>
                  {DEMO_SARAH.verified && <Shield className="h-3.5 w-3.5 text-[#00e676]" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8f7f6e] mt-0.5">
                  <Star className="h-3 w-3 text-[#f5a623]" />
                  <span>
                    {DEMO_SARAH.rating} ({DEMO_SARAH.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#8f7f6e] leading-relaxed mb-3">{DEMO_SARAH.bio}</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_SARAH.skills.map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 text-[10px] text-[#b8a078] bg-[#1a1714] border border-[#2a2420] rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <Button className="w-full" size="lg" disabled={!sent}>
            {sent ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Interest Sent
              </>
            ) : (
              <>
                <Handshake className="h-4 w-4 mr-1.5" /> Express Interest
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 5: Sarah reviews and accepts ─── */

function ScenePosterView({ accepted, useContract }: { accepted: boolean; useContract: boolean }) {
  return (
    <div className="space-y-6">
      <div className="py-2">
        <span className="inline-flex items-center text-sm text-[#7a6b5a]">
          <ArrowLeft className="mr-2 h-4 w-4" /> browse needs
        </span>
      </div>
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">{DEMO_NEED.title}</h1>
        <Badge variant="warning" className="mt-1.5">
          active
        </Badge>
        {(() => {
          const mode = getExchangeMode(DEMO_NEED.needCategory);
          if (!mode) return null;
          return (
            <span
              className={`mt-1.5 shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
            >
              {mode.label}
            </span>
          );
        })()}
        {useContract && (
          <Badge className="mt-1.5 text-[10px] bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
            <Shield className="h-3 w-3 mr-1" /> Contract
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs text-[#7a6b5a] uppercase tracking-wider">Interested</h3>
        <div className="vessel p-4">
          <div className="flex items-start gap-3">
            <Avatar name={DEMO_MARCUS.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#e8d5a3]">{DEMO_MARCUS.name}</span>
                  {DEMO_MARCUS.verified && <Shield className="h-3.5 w-3.5 text-[#00e676]" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" className="h-7 text-xs px-2" disabled={!accepted}>
                    {accepted ? (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Accepted
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Accepting...
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-[#7a6b5a]">
                    <X className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#7a6b5a]">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-[#f5a623]" /> {DEMO_MARCUS.rating} (
                  {DEMO_MARCUS.reviews})
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {DEMO_MARCUS.completed} jobs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {DEMO_MARCUS.location}
                </span>
              </div>
              <p className="text-xs text-[#b8a078] mt-2 line-clamp-1">{DEMO_MARCUS.bio}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DEMO_MARCUS.skills.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide border border-[#2a2420] text-[#7a6b5a] rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-2 bg-[#0f0c0a] p-2.5 rounded text-xs text-[#b8a078]">
                <span className="text-[#7a6b5a] uppercase tracking-wider text-[9px]">
                  Message:{" "}
                </span>
                Hey Sarah! Saw your post — I can definitely help with the garden. I specialise in
                native plants and have 8 years experience. Available this Saturday.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vessel p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-3.5 w-3.5 text-[#7a6b5a]" />
          <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">private messages</span>
        </div>
        <p className="text-xs text-[#7a6b5a] text-center py-4">
          no messages yet. be the first to reach out.
        </p>
      </div>
    </div>
  );
}

/* ─── Scene 6: Message thread ─── */

function SceneMessageThread({ revealed, useContract }: { revealed: number; useContract: boolean }) {
  const msgArr = useContract ? DEMO_MESSAGES_CONTRACT : DEMO_MESSAGES_FREEFORM;
  const allRevealed = revealed >= msgArr.length;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-[#00e5ff]" />
        <span className="text-xs text-[#00e5ff] uppercase tracking-wide font-medium">
          {useContract ? "Negotiate" : "Coordinate"}
        </span>
        <span className="text-xs text-[#7a6b5a] ml-2">Chat with {DEMO_MARCUS.name}</span>
        {useContract && (
          <Badge className="ml-2 text-[10px] bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
            <Shield className="h-3 w-3 mr-1" /> Contract
          </Badge>
        )}
      </div>
      <div className="vessel p-4 space-y-3 min-h-[200px]">
        <p className="text-xs text-[#7a6b5a] mb-3 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-[#00e676]" />
          Private thread — only you and {DEMO_MARCUS.name} can see these messages
        </p>
        {msgArr.slice(0, revealed).map((msg, i) => {
          const isSarah = msg.sender === "sarah";
          const user = isSarah ? DEMO_SARAH : DEMO_MARCUS;
          return (
            <div key={i} className={`flex items-start gap-2 ${isSarah ? "flex-row-reverse" : ""}`}>
              <Avatar name={user.name} size="sm" />
              <div
                className={`max-w-[75%] px-3 py-2 text-sm rounded ${isSarah ? "bg-[#1a1714] text-[#e8d5a3] border-l-2 border-[#f5a623]" : "bg-[#12100e] text-[#b8a078] border border-[#2a2420]"}`}
              >
                <p className="text-[10px] text-[#7a6b5a] uppercase tracking-wider mb-1">
                  {user.name}
                </p>
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        {!allRevealed && (
          <div className="flex items-center gap-2 text-[10px] text-[#7a6b5a]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8f7f6e] animate-pulse" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8f7f6e] animate-pulse delay-100" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8f7f6e] animate-pulse delay-200" />
            <span className="ml-1">typing...</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="send a private message..."
          className="h-9 text-sm bg-[#0f0c0a]"
          readOnly
        />
        <Button size="icon" className="h-9 w-9 shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Scene 7: Mark Complete ─── */

function SceneMarkComplete({ marked, useContract }: { marked: boolean; useContract: boolean }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Check className="h-4 w-4 text-[#00e676]" />
        <span className="text-xs text-[#00e676] uppercase tracking-wide font-medium">
          Mark Complete
        </span>
      </div>
      <div className="vessel p-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 mb-3">
          <Wrench className="h-6 w-6 text-[#00e676]" />
        </div>
        <h3 className="text-lg font-medium text-[#e8d5a3] mb-1">Work Complete</h3>
        <p className="text-sm text-[#8f7f6e] mb-4">
          Marcus has finished the garden landscaping. The front yard looks refreshed with native
          shrubs, mulch, and a new stone path.
        </p>
        <p className="text-sm text-[#b8a078] mb-6">
          {useContract
            ? "In return, you will provide professional electrical work (up to 2 hours) as agreed in the contract."
            : "In return, you will provide professional electrical work (up to 2 hours) as discussed."}
        </p>
        <Button disabled={!marked}>
          {marked ? (
            <>
              <Check className="h-4 w-4 mr-1.5" /> Completed
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1.5" /> Marking...
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Scene 8: Review (Poster) ─── */

function SceneReviewPoster({ submitted }: { submitted: boolean }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-4 w-4 text-[#f5a623]" />
        <span className="text-xs text-[#f5a623] uppercase tracking-wide font-medium">
          Leave a Review
        </span>
      </div>
      <div className="vessel p-5 space-y-4">
        <p className="text-sm text-[#e8d5a3]">How was your experience with {DEMO_MARCUS.name}?</p>
        <div className="bg-[#1a1714] border border-[#2a2420] p-4 rounded space-y-4">
          <div>
            <label className="text-xs text-[#7a6b5a] block mb-2">Rating (1–10)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[#2a2420] overflow-hidden">
                <div
                  className="h-full bg-[#f5a623] rounded-full transition-all"
                  style={{ width: "100%" }}
                />
              </div>
              <span className="text-xs text-[#f5a623] font-medium">10</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#7a6b5a] block mb-2">Public Review</label>
            <Textarea
              value={DEMO_REVIEWS.sarah.comment}
              readOnly
              rows={3}
              className="bg-[#0f0c0a] text-sm"
            />
          </div>
          <Button size="sm" disabled={!submitted}>
            {submitted ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Submitted
              </>
            ) : (
              <>
                <Star className="h-3 w-3 mr-1" /> Submitting...
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 9: Review (Fulfiller) ─── */

function SceneReviewFulfiller({ submitted }: { submitted: boolean }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-4 w-4 text-[#f5a623]" />
        <span className="text-xs text-[#f5a623] uppercase tracking-wide font-medium">
          Leave a Review
        </span>
      </div>
      <div className="vessel p-5 space-y-4">
        <p className="text-sm text-[#e8d5a3]">How was your experience with {DEMO_SARAH.name}?</p>
        <div className="bg-[#1a1714] border border-[#2a2420] p-4 rounded space-y-4">
          <div>
            <label className="text-xs text-[#7a6b5a] block mb-2">Rating (1–10)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[#2a2420] overflow-hidden">
                <div
                  className="h-full bg-[#f5a623] rounded-full transition-all"
                  style={{ width: "100%" }}
                />
              </div>
              <span className="text-xs text-[#f5a623] font-medium">10</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#7a6b5a] block mb-2">Public Review</label>
            <Textarea
              value={DEMO_REVIEWS.marcus.comment}
              readOnly
              rows={3}
              className="bg-[#0f0c0a] text-sm"
            />
          </div>
          <Button size="sm" disabled={!submitted}>
            {submitted ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Submitted
              </>
            ) : (
              <>
                <Star className="h-3 w-3 mr-1" /> Submitting...
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene 10: Summary ─── */

function SceneSummary() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 mb-6">
          <Check className="h-8 w-8 text-[#00e676]" />
        </div>
        <h2 className="heading-display text-2xl text-[#e8d5a3] mb-3">Exchange Complete</h2>
        <p className="text-sm text-[#8f7f6e] max-w-md mx-auto leading-relaxed">
          The full journey from posting a need to leaving reviews. Every step is designed to build
          trust and protect both parties.
        </p>
      </div>

      <div className="vessel p-5 space-y-4">
        <p className="text-xs text-[#7a6b5a] uppercase tracking-wider">What happened</p>
        <div className="space-y-3">
          {[
            {
              who: "Sarah",
              what: "Posted a need for garden landscaping in Terrigal",
              icon: PlusCircle,
            },
            {
              who: "Marcus",
              what: "Browsed needs and expressed interest with a message",
              icon: ArrowRightLeft,
            },
            {
              who: "Sarah",
              what: "Reviewed Marcus's profile and accepted his interest",
              icon: Check,
            },
            {
              who: "Both",
              what: "Negotiated details through private messages",
              icon: MessageSquare,
            },
            { who: "Marcus", what: "Completed the garden work over the weekend", icon: Wrench },
            { who: "Both", what: "Left bilateral 10/10 reviews", icon: Star },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1714] border border-[#2a2420] shrink-0">
                <item.icon className="h-3 w-3 text-[#f5a623]" />
              </div>
              <p className="text-sm text-[#b8a078]">
                <span className="text-[#e8d5a3] font-medium">{item.who}:</span> {item.what}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="vessel p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={DEMO_SARAH.name} size="md" />
            <div>
              <p className="text-sm font-medium text-[#e8d5a3]">{DEMO_SARAH.name}</p>
              <p className="text-xs text-[#7a6b5a]">Poster</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#b8a078]">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-[#f5a623]" /> 4.8 →{" "}
              <span className="text-[#00e676]">4.9</span>
            </span>
            <span>{DEMO_SARAH.reviews + 1} reviews</span>
            <span>{DEMO_SARAH.completed + 1} completed</span>
          </div>
        </div>
        <div className="vessel p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={DEMO_MARCUS.name} size="md" />
            <div>
              <p className="text-sm font-medium text-[#e8d5a3]">{DEMO_MARCUS.name}</p>
              <p className="text-xs text-[#7a6b5a]">Fulfiller</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#b8a078]">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-[#f5a623]" /> 4.9 →{" "}
              <span className="text-[#00e676]">4.9</span>
            </span>
            <span>{DEMO_MARCUS.reviews + 1} reviews</span>
            <span>{DEMO_MARCUS.completed + 1} completed</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-[#7a6b5a] uppercase tracking-wider">Bilateral Reviews</p>
        {[
          { user: DEMO_MARCUS, review: DEMO_REVIEWS.marcus },
          { user: DEMO_SARAH, review: DEMO_REVIEWS.sarah },
        ].map(({ user, review }, i) => (
          <div key={i} className="vessel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={user.name} size="sm" />
              <span className="text-sm font-medium text-[#e8d5a3]">{user.name}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3 w-3 ${j < review.rating ? "text-[#f5a623] fill-current" : "text-[#2a2420]"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#f5a623] font-medium">{review.rating}/10</span>
            </div>
            <p className="text-xs text-[#b8a078] leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <Button variant="default" asChild>
          <Link href="/register">Create Account</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/demo">Explore More Demos</Link>
        </Button>
      </div>
    </div>
  );
}
