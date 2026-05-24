"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Wrench,
  Package,
  CircleDollarSign,
  Camera,
  ImageIcon,
  Lightbulb,
  Clock,
  Calendar,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { EXCHANGE_MODES, INCOMPATIBLE_EXCHANGE_MODES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

export default function CreateNeedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<"service" | "item" | "money">("service");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerValue, setOfferValue] = useState("");
  const isLocal = true;
  const [locationFormatted, setLocationFormatted] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [offerImages, setOfferImages] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [exchangeMode, setExchangeMode] = useState("");

  // Clear exchange mode if it becomes incompatible with the selected offer type
  useEffect(() => {
    const incompatible = INCOMPATIBLE_EXCHANGE_MODES[offerType] || [];
    if (exchangeMode && incompatible.includes(exchangeMode)) {
      setExchangeMode("");
    }
  }, [offerType, exchangeMode]);
  const [requiresContract, setRequiresContract] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("error: you must be logged in.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/v1/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        offerType,
        offerDescription,
        needCategory: exchangeMode || undefined,
        offerValue: offerValue ? parseFloat(offerValue) : undefined,
        isLocal: true,
        locationName: locationFormatted,
        requiredSkills,
        images,
        offerImages,
        deadline: deadline || undefined,
        timeRange: timeRange || undefined,
        requiresContract,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg =
        typeof data.error === "string" ? data.error : data.error?.[0]?.message || "failed";
      setError("error: " + msg);
      setLoading(false);
      return;
    }

    router.push(`/needs/${data.need.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 md:px-8">
      <div className="py-6">
        <Link
          href="/needs"
          className="inline-flex items-center text-sm text-[#7a6b5a] hover:text-[#e8d5a3] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />$ cd ~/needs/
        </Link>
      </div>

      <h1 className="heading-display text-2xl text-[#e8d5a3]">Post Need</h1>
      <p className="text-xs text-[#7a6b5a] mt-3">$ nano new_need.conf</p>
      <p className="text-sm text-[#b8a078] mb-6">
        describe what you need and what you are offering in exchange
      </p>

      <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 p-4 mb-8">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-[#f5a623] mt-0.5 flex-shrink-0" />
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="vessel-need p-5">
            <p className="text-xs text-[#35c2f0] uppercase tracking-wide font-medium mb-1">
              [what you need]
            </p>
            <p className="text-xs text-[#7a6b5a] mb-5">what are you seeking from the community?</p>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. electrical_work_1hr"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <p className="text-xs text-[#7a6b5a]">
                  be specific. &quot;fix_leaking_tap&quot; beats &quot;plumbing_help&quot;
                </p>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="describe the work, timeline, requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                />
                <p className="text-xs text-[#7a6b5a]">
                  include deadlines, access details, and any tools/materials provided
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-[#7a6b5a]" />
                    <Label>Deadline (Optional)</Label>
                  </div>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-xs text-[#7a6b5a]">when does this need to be done by?</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-[#7a6b5a]" />
                    <Label>Time Estimate (Optional)</Label>
                  </div>
                  <Input
                    placeholder="e.g. 2-4 hours"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  />
                  <p className="text-xs text-[#7a6b5a]">how long do you estimate this will take?</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Required Skills <span className="text-[#7a6b5a] font-normal">(optional)</span>
                </Label>
                <SkillAutocomplete
                  value={requiredSkills}
                  onChange={setRequiredSkills}
                  placeholder="Search skills… e.g. electrical, tutoring"
                  maxSkills={8}
                />
                <p className="text-xs text-[#7a6b5a]">
                  add skills to help the right people find your need. browse popular skills or type
                  your own.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-[#7a6b5a]" />
                  <Label>Need Images (Optional)</Label>
                </div>
                <ImageGallery
                  images={images}
                  onChange={setImages}
                  folder="needs"
                  maxImages={5}
                  label="attach photos of what you need"
                />
              </div>
            </div>
          </section>

          <section className="vessel-offer p-5">
            <p className="text-xs text-[#f5a623] uppercase tracking-wide font-medium mb-1">
              [what you are offering]
            </p>
            <p className="text-xs text-[#7a6b5a] mb-5">
              this determines which exchange categories are available below
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
                {(["service", "item", "money"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    onClick={() => setOfferType(type)}
                    className={`flex flex-col items-center gap-2 h-auto py-4 px-2 ${
                      offerType === type
                        ? "border-[#f5a623] bg-[#f5a623]/5 text-[#e8d5a3] hover:bg-[#f5a623]/10 hover:text-[#e8d5a3]"
                        : "border-[#2a2420] bg-[#0f0c0a] text-[#7a6b5a] hover:text-[#e8d5a3] hover:bg-[#1a1714] hover:border-[#3d3530]"
                    }`}
                  >
                    {type === "service" && <Wrench className="h-5 w-5" />}
                    {type === "item" && <Package className="h-5 w-5" />}
                    {type === "money" && <CircleDollarSign className="h-5 w-5" />}
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#7a6b5a]">Sub-category (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {EXCHANGE_MODES.filter((mode) => {
                    const incompatible = INCOMPATIBLE_EXCHANGE_MODES[offerType] || [];
                    return !incompatible.includes(mode.value);
                  }).map((mode) => {
                    const active = exchangeMode === mode.value;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setExchangeMode(active ? "" : mode.value)}
                        className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border transition-colors ${mode.twText} ${
                          active
                            ? `${mode.twBorder} ${mode.twBg} border-current`
                            : "border-[#2a2420] hover:border-current"
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Offer Description</Label>
                <Textarea
                  placeholder="describe what you are offering..."
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  required
                  rows={3}
                />
                <p className="text-xs text-[#7a6b5a]">
                  the more detail, the better your match rate
                </p>
              </div>
              <div className="space-y-2">
                <Label>Estimated Value (Optional)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerValue}
                  onChange={(e) => setOfferValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-[#7a6b5a]" />
                  <Label>Offer Images (Optional)</Label>
                </div>
                <ImageGallery
                  images={offerImages}
                  onChange={setOfferImages}
                  folder="offers"
                  maxImages={5}
                  label="attach photos of what you are offering"
                />
              </div>
            </div>
          </section>
        </div>

        <section className="p-4 rounded border border-[#00e676]/30 bg-[#00e676]/5">
          <p className="text-xs text-[#00e676] uppercase tracking-wide font-medium mb-4">
            [deal type]
          </p>
          <div className="flex items-start gap-6">
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresContract}
                  onChange={(e) => setRequiresContract(e.target.checked)}
                  className="mt-1 accent-[#f5a623]"
                />
                <div>
                  <p className="text-sm font-medium text-[#e8d5a3]">Require a formal contract</p>
                  <p className="text-xs text-[#7a6b5a] mt-1.5 max-w-2xl">
                    If checked, both parties must agree to terms and digitally sign a binding
                    contract before the exchange begins. If unchecked, the deal proceeds in free
                    form — you simply accept an interest and arrange the exchange directly.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="p-4 rounded border border-[#ff5252]/30 bg-[#ff5252]/5">
          <p className="text-xs text-[#ff5252] uppercase tracking-wide font-medium mb-4">
            [location]
          </p>
          <div className="space-y-4">
            <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 p-3">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-[#00e5ff] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#e8d5a3] font-medium">
                    Central Coast NSW trial region
                  </p>
                  <p className="text-xs text-[#7a6b5a] mt-1">
                    only central coast suburbs are available during the pilot. remote exchanges are
                    temporarily disabled.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Suburb</Label>
              <LocationAutocomplete
                value={locationFormatted}
                onChange={(formatted) => {
                  setLocationFormatted(formatted);
                }}
                placeholder="type_suburb_name..."
              />
              <p className="text-xs text-[#7a6b5a]">
                all central coast suburbs autocomplete. try &quot;terrigal&quot; or &quot;2250&quot;
              </p>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-[#ff5252]">{error}</p>}

        <div className="flex gap-3 pb-12">
          <Button type="submit" variant="default" size="lg" disabled={loading} className="flex-1">
            {loading ? "posting..." : "Post Need"}
          </Button>
          <Button type="button" variant="secondary" size="lg" asChild>
            <Link href="/needs">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
