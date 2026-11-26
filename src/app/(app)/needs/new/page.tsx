"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  CircleDollarSign,
  Clock,
  Handshake,
  Info,
  Package,
  Phone,
  Shield,
  SlidersHorizontal,
  Wrench,
  Zap,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";

import { UrgencyField } from "@/components/needs/urgency-field";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/ui/image-gallery";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { Textarea } from "@/components/ui/textarea";
import { EXCHANGE_MODES, INCOMPATIBLE_EXCHANGE_MODES, getExchangeMode } from "@/lib/categories";
import { detectRegulatedTrade } from "@/lib/regulated-trades";
import { createNeedSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { URGENT_CONTACT_MIN } from "@/lib/urgency";
import { cn } from "@/lib/utils";

type FormData = z.input<typeof createNeedSchema>;
type PostMode = "quick" | "detailed";

export default function CreateNeedPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<PostMode>("quick");
  const [profile, setProfile] = useState<{
    mobileVerified: boolean;
    mobile: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createNeedSchema),
    defaultValues: {
      offerType: "service",
      isLocal: true,
      urgency: 0,
      allowUrgentContact: false,
      requiredSkills: [],
      images: [],
      offerImages: [],
      requiresContract: false,
    },
  });

  const offerType = watch("offerType");
  const exchangeMode = watch("needCategory");
  const urgency = watch("urgency") ?? 0;
  const watchedTitle = watch("title") ?? "";
  const watchedSkills = watch("requiredSkills") ?? [];
  const regulatedTrade = detectRegulatedTrade({ title: watchedTitle, skills: watchedSkills });
  const mobileGate = profile ? !profile.mobileVerified : false;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("antidosis-need-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        reset(draft.values);
        if (draft.mode === "detailed") setMode("detailed");
      }
    } catch {
      sessionStorage.removeItem("antidosis-need-draft");
    }
  }, [reset]);

  useEffect(() => {
    fetch("/api/v1/profiles/me")
      .then((response) => (response.ok ? response.json() : null))
      .then(setProfile)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const incompatible = INCOMPATIBLE_EXCHANGE_MODES[offerType] || [];
    if (exchangeMode && incompatible.includes(exchangeMode)) {
      setValue("needCategory", undefined);
    }
  }, [offerType, exchangeMode, setValue]);

  useEffect(() => {
    if (exchangeMode !== "rideshare") setValue("destinationName", undefined);
  }, [exchangeMode, setValue]);

  useEffect(() => {
    if (urgency < URGENT_CONTACT_MIN) setValue("allowUrgentContact", false);
  }, [urgency, setValue]);

  function saveDraft() {
    sessionStorage.setItem("antidosis-need-draft", JSON.stringify({ mode, values: getValues() }));
  }

  async function onSubmit(data: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/needs/new");
      return;
    }

    try {
      const response = await fetch("/api/v1/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof json.error === "string"
            ? json.error
            : json.details?.fieldErrors
              ? Object.values(json.details.fieldErrors).flat().join(" ")
              : "Could not post your need";
        setError("root", { message });
        if (json.code === "MOBILE_NOT_VERIFIED")
          setProfile({ mobileVerified: false, mobile: null });
        return;
      }
      sessionStorage.removeItem("antidosis-need-draft");
      router.push(`/needs/${json.need.id}`);
      router.refresh();
    } catch {
      setError("root", { message: "Network error. Your details are still here—please try again." });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
      <div className="py-6">
        <Link href="/needs" className="inline-flex items-center text-sm text-ash hover:text-gold">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to needs
        </Link>
      </div>

      <header className="mb-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-mercury">
          Exchange / New need
        </p>
        <h1 className="heading-display text-3xl text-gold md:text-4xl">Post a need</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ash">
          Start with the essentials. Add detail only when it helps someone say yes.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface/40 p-2">
        <button
          type="button"
          aria-pressed={mode === "quick"}
          onClick={() => setMode("quick")}
          className={cn(
            "flex min-h-16 items-center justify-center gap-2 rounded-md border px-3 py-2 text-left sm:justify-start sm:px-4",
            mode === "quick" ? "border-sun/40 bg-sun/[0.08]" : "border-transparent hover:bg-raise"
          )}
        >
          <Zap className={cn("h-5 w-5 shrink-0", mode === "quick" ? "text-sun" : "text-ash")} />
          <span>
            <span className="block text-sm font-medium text-gold">Quick post</span>
            <span className="hidden text-xs text-ash sm:block">Just the essentials</span>
          </span>
        </button>
        <button
          type="button"
          aria-pressed={mode === "detailed"}
          onClick={() => setMode("detailed")}
          className={cn(
            "flex min-h-16 items-center justify-center gap-2 rounded-md border px-3 py-2 text-left sm:justify-start sm:px-4",
            mode === "detailed"
              ? "border-mercury/40 bg-mercury/[0.08]"
              : "border-transparent hover:bg-raise"
          )}
        >
          <SlidersHorizontal
            className={cn("h-5 w-5 shrink-0", mode === "detailed" ? "text-mercury" : "text-ash")}
          />
          <span>
            <span className="block text-sm font-medium text-gold">Detailed post</span>
            <span className="hidden text-xs text-ash sm:block">
              Photos, skills, timing and terms
            </span>
          </span>
        </button>
      </div>

      {mobileGate && (
        <div className="mb-6 rounded-lg border border-alert/30 bg-alert/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
            <div>
              <p className="text-sm font-medium text-gold">Verify your mobile before posting</p>
              <p className="mt-1 text-sm leading-relaxed text-ash">
                This anti-scam step is required once.{" "}
                <Link
                  onClick={saveDraft}
                  href="/verify-mobile?next=/needs/new"
                  className="text-sun hover:underline"
                >
                  Verify now →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <section className="vessel-need rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium text-gold">What do you need?</h2>
            <p className="mt-1 text-sm text-ash">
              Be specific enough for the right person to respond.
            </p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="need-title">Title</Label>
              <Input
                id="need-title"
                placeholder="e.g. Help move a sofa this weekend"
                className="text-base"
                {...register("title")}
              />
              {errors.title && <p className="text-sm text-bad">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="need-description">Description</Label>
              <Textarea
                id="need-description"
                placeholder="What happened, what needs doing, and anything a helper should know?"
                rows={mode === "quick" ? 4 : 6}
                className="text-base"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-bad">{errors.description.message}</p>
              )}
            </div>
            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <UrgencyField value={field.value ?? 0} onChange={field.onChange} />
              )}
            />
            {urgency >= URGENT_CONTACT_MIN && (
              <div className="rounded-lg border border-alert/30 bg-alert/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-alert" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gold">Optional direct phone contact</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ash">
                      Let verified members reveal your verified mobile after clicking a protected
                      contact button. It never appears in the public post data.
                    </p>
                    {profile?.mobileVerified && profile.mobile ? (
                      <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded border border-line bg-surface/60 p-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-[var(--c-sun)]"
                          {...register("allowUrgentContact")}
                        />
                        <span className="text-sm text-parchment">
                          Allow calls to {profile.mobile} for this urgent need
                        </span>
                      </label>
                    ) : (
                      <p className="mt-3 text-sm text-alert">
                        Add and verify your mobile first.{" "}
                        <Link
                          onClick={saveDraft}
                          href="/verify-mobile?next=/needs/new"
                          className="underline"
                        >
                          Open mobile verification
                        </Link>
                      </p>
                    )}
                    <p className="mt-3 text-xs text-ash">
                      Antidosis is not an emergency service. Call 000 for immediate danger.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="vessel-offer rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium text-gold">What can you offer?</h2>
            <p className="mt-1 text-sm text-ash">A service, goods, cash, or a simple thank-you.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["service", "item", "money"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                onClick={() => setValue("offerType", type, { shouldDirty: true })}
                aria-pressed={offerType === type}
                className={cn(
                  "h-auto flex-col gap-2 px-2 py-3",
                  offerType === type && "border-sun bg-sun/5 text-gold"
                )}
              >
                {type === "service" && <Wrench className="h-5 w-5" />}
                {type === "item" && <Package className="h-5 w-5" />}
                {type === "money" && <CircleDollarSign className="h-5 w-5" />}
                <span className="text-sm font-medium capitalize">
                  {type === "item" ? "Goods" : type}
                </span>
              </Button>
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-2">
              <Label htmlFor="need-category">Category (optional)</Label>
              <select
                id="need-category"
                {...register("needCategory")}
                className="h-10 w-full rounded border border-line bg-inset px-3 text-base text-gold outline-none focus:border-sun"
              >
                <option value="">Choose a category</option>
                {EXCHANGE_MODES.filter((modeItem) => {
                  const incompatible = INCOMPATIBLE_EXCHANGE_MODES[offerType] || [];
                  return !incompatible.includes(modeItem.value);
                }).map((modeItem) => (
                  <option key={modeItem.value} value={modeItem.value}>
                    {modeItem.label}
                  </option>
                ))}
              </select>
              {exchangeMode && getExchangeMode(exchangeMode)?.example && (
                <p className="text-xs text-ash">{getExchangeMode(exchangeMode)?.example}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-description">Offer</Label>
              <Input
                id="offer-description"
                className="text-base"
                placeholder="e.g. Two hours of gardening, or $40"
                {...register("offerDescription")}
              />
              {errors.offerDescription && (
                <p className="text-sm text-bad">{errors.offerDescription.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-mercury/25 bg-mercury/[0.035] p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-mercury" />
            <div>
              <h2 className="text-base font-medium text-gold">
                {exchangeMode === "rideshare" ? "Where are you travelling?" : "Where is the need?"}
              </h2>
              <p className="mt-1 text-sm text-ash">
                Posts start on the Central Coast during the pilot. Only a suburb is needed—never a
                street address.
              </p>
            </div>
          </div>
          <div className={cn("grid gap-4", exchangeMode === "rideshare" && "sm:grid-cols-2")}>
            <div className="space-y-2">
              <Label htmlFor="need-location">
                {exchangeMode === "rideshare" ? "Pickup suburb" : "Suburb"}
              </Label>
              <Controller
                name="locationName"
                control={control}
                render={({ field }) => (
                  <LocationAutocomplete
                    id="need-location"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Search suburb or postcode…"
                  />
                )}
              />
              {errors.locationName && (
                <p className="text-sm text-bad">{errors.locationName.message}</p>
              )}
            </div>
            {exchangeMode === "rideshare" && (
              <div className="space-y-2">
                <Label htmlFor="need-destination">Destination</Label>
                <Input
                  id="need-destination"
                  className="text-base"
                  placeholder="e.g. Sydney Central, NSW"
                  {...register("destinationName")}
                />
                {errors.destinationName && (
                  <p className="text-sm text-bad">{errors.destinationName.message}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {mode === "detailed" && (
          <div className="space-y-5">
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="vessel rounded-lg p-5 sm:p-6">
                <h2 className="mb-5 text-base font-medium text-gold">Timing and skills</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="need-deadline" className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-ash" /> Deadline
                    </Label>
                    <Input id="need-deadline" type="date" {...register("deadline")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="need-time" className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-ash" /> Time estimate
                    </Label>
                    <Input id="need-time" placeholder="e.g. 2–4 hours" {...register("timeRange")} />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <Label>Required skills (optional)</Label>
                  <Controller
                    name="requiredSkills"
                    control={control}
                    render={({ field }) => (
                      <SkillAutocomplete
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Search skills or add your own"
                        maxSkills={8}
                      />
                    )}
                  />
                  {regulatedTrade && (
                    <p className="flex items-start gap-1.5 text-xs text-alert">
                      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      This looks like licensed {regulatedTrade.label} work. Only members with a
                      verified {regulatedTrade.licenceLabel} can fulfil it in NSW.
                    </p>
                  )}
                </div>
              </div>

              <div className="vessel rounded-lg p-5 sm:p-6">
                <h2 className="mb-5 text-base font-medium text-gold">Photos and value</h2>
                <Controller
                  name="images"
                  control={control}
                  render={({ field }) => (
                    <ImageGallery
                      images={field.value ?? []}
                      onChange={field.onChange}
                      folder="needs"
                      maxImages={5}
                      label="Photos of the need (optional)"
                    />
                  )}
                />
                <div className="mt-5 space-y-2">
                  <Label htmlFor="offer-value">Estimated offer value (optional)</Label>
                  <Input
                    id="offer-value"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    {...register("offerValue", { valueAsNumber: true })}
                  />
                  {errors.offerValue && (
                    <p className="text-sm text-bad">{errors.offerValue.message}</p>
                  )}
                </div>
                <div className="mt-5">
                  <Controller
                    name="offerImages"
                    control={control}
                    render={({ field }) => (
                      <ImageGallery
                        images={field.value ?? []}
                        onChange={field.onChange}
                        folder="offers"
                        maxImages={5}
                        label="Photos of your offer (optional)"
                      />
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="vessel rounded-lg p-5 sm:p-6">
              <h2 className="text-base font-medium text-gold">How do you want to proceed?</h2>
              <p className="mt-1 text-sm text-ash">
                Either path still uses interest, messaging and reviews. A formal agreement adds
                written terms and signatures.
              </p>
              <Controller
                name="requiresContract"
                control={control}
                render={({ field }) => (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      aria-pressed={!field.value}
                      className={cn(
                        "rounded-lg border p-4 text-left",
                        !field.value ? "border-ok/45 bg-ok/[0.055]" : "border-line bg-inset"
                      )}
                    >
                      <Handshake className="mb-2 h-5 w-5 text-ok" />
                      <span className="block text-sm font-medium text-gold">
                        Free-form exchange
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-ash">
                        Agree the details in messages, then complete and review.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      aria-pressed={!!field.value}
                      className={cn(
                        "rounded-lg border p-4 text-left",
                        field.value ? "border-sun/45 bg-sun/[0.055]" : "border-line bg-inset"
                      )}
                    >
                      <Shield className="mb-2 h-5 w-5 text-sun" />
                      <span className="block text-sm font-medium text-gold">Written agreement</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ash">
                        Negotiate written terms and sign before starting.
                      </span>
                    </button>
                  </div>
                )}
              />
            </section>
          </div>
        )}

        {mode === "quick" && (
          <button
            type="button"
            onClick={() => setMode("detailed")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-linehi px-4 py-3 text-sm text-ash hover:border-mercury/40 hover:text-gold"
          >
            <SlidersHorizontal className="h-4 w-4" /> Add photos, skills, timing or written terms
          </button>
        )}

        {errors.root && (
          <p className="rounded border border-bad/30 bg-bad/5 p-3 text-sm text-bad" role="alert">
            {errors.root.message}
          </p>
        )}

        <div className="sticky bottom-3 z-20 flex gap-3 rounded-lg border border-line bg-surface/95 p-3 shadow-lg backdrop-blur">
          <Button type="submit" size="lg" disabled={isSubmitting || mobileGate} className="flex-1">
            {isSubmitting ? "Posting…" : "Post need"}
          </Button>
          <Button type="button" variant="secondary" size="lg" asChild>
            <Link href="/needs">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
