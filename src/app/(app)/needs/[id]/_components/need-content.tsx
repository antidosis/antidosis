"use client";

import Link from "next/link";

import {
  MapPin,
  ArrowLeft,
  CircleDollarSign,
  Wrench,
  Package,
  Camera,
  Calendar,
  Clock,
  Info,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/ui/copy-link";
import { getExchangeMode } from "@/lib/categories";
import { detectRegulatedTrade, detectBuildingWork } from "@/lib/regulated-trades";

interface NeedContentProps {
  need: {
    id: string;
    title: string;
    description: string;
    needCategory: string | null;
    offerType: string;
    offerDescription: string;
    offerValue: number | null;
    status: string;
    requiresContract: boolean;
    deadline: string | null;
    timeRange: string | null;
    images: string[];
    offerImages: string[];
    requiredSkills: { id: string; name: string }[];
  };
  descExpanded: boolean;
  onToggleDesc: () => void;
}

export function NeedContent({ need, descExpanded, onToggleDesc }: NeedContentProps) {
  const descTooLong = need.description.length > 500;
  const displayDesc =
    descTooLong && !descExpanded ? need.description.slice(0, 500) + "..." : need.description;

  const offerIcon =
    need.offerType === "money" ? (
      <CircleDollarSign className="h-4 w-4 text-[#f5a623]" />
    ) : need.offerType === "item" ? (
      <Package className="h-4 w-4 text-[#00e5ff]" />
    ) : (
      <Wrench className="h-4 w-4 text-[#00e676]" />
    );

  return (
    <>
      {/* ========== HEADER ========== */}
      <div className="pt-6 pb-2 flex items-center justify-between">
        <Link
          href="/needs"
          className="inline-flex items-center text-xs text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          browse needs
        </Link>
        <CopyLinkButton
          url={`${typeof window !== "undefined" ? window.location.origin : ""}/needs/${need.id}`}
          label="Copy link"
        />
      </div>

      <div className="flex flex-wrap items-start gap-3 mb-3">
        <h1 className="heading-display text-2xl md:text-3xl text-[#e8d5a3]">{need.title}</h1>
        {need.status !== "open" && (
          <Badge
            variant={
              need.status === "completed"
                ? "success"
                : need.status === "cancelled"
                  ? "destructive"
                  : "warning"
            }
            className="mt-1.5 capitalize"
          >
            {need.status}
          </Badge>
        )}
        <Badge
          variant={need.requiresContract ? "quintessence" : "outline"}
          className="mt-1.5 text-[10px]"
        >
          {need.requiresContract ? "contract required" : "free form"}
        </Badge>
      </div>

      {/* ========== META STRIP ========== */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {need.requiredSkills.map((s) => (
          <span
            key={s.id}
            className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded"
          >
            {s.name}
          </span>
        ))}
        {need.needCategory &&
          (() => {
            const mode = getExchangeMode(need.needCategory);
            if (!mode) return null;
            return (
              <span
                className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border rounded flex items-center gap-1 ${mode.twText} ${mode.twBorder} ${mode.twBg}`}
              >
                {mode.label}
              </span>
            );
          })()}
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
          <MapPin className="h-3 w-3" /> local
        </span>
        {need.deadline && (
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(need.deadline).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
        {need.timeRange && (
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border border-[#2a2420] text-[#7a6b5a] bg-[#1a1714] rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {need.timeRange}
          </span>
        )}
      </div>

      {/* ========== LICENSED-WORK NOTICE (NSW) ========== */}
      {(() => {
        const trade = detectRegulatedTrade({
          title: need.title,
          skills: need.requiredSkills.map((s) => s.name),
        });
        if (trade) {
          return (
            <div className="bg-[#ffb300]/10 border border-[#ffb300]/30 p-3 mb-6">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-[#ffb300] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#b8a078]">
                  Licensed trade work (NSW) — this need involves {trade.label}. It can only be
                  fulfilled by a member holding a verified {trade.licenceLabel}.
                </p>
              </div>
            </div>
          );
        }
        if (
          detectBuildingWork({ title: need.title, skills: need.requiredSkills.map((s) => s.name) })
        ) {
          return (
            <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3 mb-6">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-[#00e5ff] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#b8a078]">
                  Building work note: in NSW, residential building work over $5,000 (labour +
                  materials incl. GST) must be done by a licensed contractor.
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* ========== DESCRIPTION ========== */}
      <div className="mb-6">
        <p className="text-sm text-[#b8a078] leading-relaxed whitespace-pre-line">{displayDesc}</p>
        {descTooLong && (
          <button onClick={onToggleDesc} className="text-xs text-[#f5a623] hover:underline mt-2">
            {descExpanded ? "show less" : "show more"}
          </button>
        )}
      </div>

      {/* ========== TRIAL NOTICE ========== */}
      <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3 mb-6">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-[#00e5ff] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#7a6b5a]">
            Central Coast NSW trial region — all needs are local during the pilot.
          </p>
        </div>
      </div>

      {/* ========== IMAGES ========== */}
      {need.images.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-3.5 w-3.5 text-[#7a6b5a]" />
            <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">need images</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {need.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="h-28 w-28 md:h-32 md:w-32 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer shrink-0 snap-start"
              />
            ))}
          </div>
        </div>
      )}

      {/* ========== EXCHANGE (compact) ========== */}
      <div className="vessel p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          {offerIcon}
          <span className="text-xs text-[#7a6b5a] uppercase tracking-wider">
            offering in exchange
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-[#e8d5a3]">{need.offerDescription}</p>
          {need.offerValue && (
            <span className="text-xs text-[#b8a078]">est. ${need.offerValue.toLocaleString()}</span>
          )}
        </div>
        {need.offerImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-3 pb-1 snap-x">
            {need.offerImages.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="h-20 w-20 object-cover border border-[#2a2420] hover:border-[#f5a623] transition-colors cursor-pointer shrink-0 snap-start"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
