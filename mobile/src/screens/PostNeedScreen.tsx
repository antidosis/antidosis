import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateNeed } from "@mobile/hooks/useApi";
import { useHaptics, useCamera } from "@mobile/hooks/useNative";
import { uploadFile } from "@mobile/lib/api";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  ChevronRight,
  X,
  Wrench,
  Package,
  CircleDollarSign,
  FileText,
  ToggleLeft,
  ToggleRight,
  Tag,
} from "lucide-react";
import { hapticImpact } from "@mobile/lib/native";
import { Input, Textarea, Button, Vessel, Badge } from "@mobile/components/ui";
import { SkillAutocomplete } from "@mobile/components/SkillAutocomplete";
import { LocationAutocomplete } from "@mobile/components/LocationAutocomplete";
import { EXCHANGE_MODES, INCOMPATIBLE_EXCHANGE_MODES } from "@/lib/categories";

/* ═══════════════════════════════════════════════════════════════
   POST NEED SCREEN — Terminal Wizard (v2)
   $ nano ~/needs/new.md with skills, contract toggle, offer images.
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { label: "What", fields: ["title", "description"] },
  { label: "When", fields: ["deadline", "timeRange"] },
  { label: "Offer", fields: ["offerType", "offerDescription"] },
  { label: "Where", fields: ["locationName"] },
];

const OFFER_TYPES = [
  { key: "service" as const, label: "Service", icon: <Wrench size={14} /> },
  { key: "item" as const, label: "Item", icon: <Package size={14} /> },
  { key: "money" as const, label: "Money", icon: <CircleDollarSign size={14} /> },
];

export function PostNeedScreen() {
  const navigate = useNavigate();
  const { trigger: submitNeed, isMutating, error: submitError } = useCreateNeed();
  const { tap, success, error: hapticError } = useHaptics();
  const { takePhoto, pickPhotos } = useCamera();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    timeRange: "",
    offerType: "service" as "service" | "item" | "money",
    offerDescription: "",
    offerValue: "",
    locationName: "",
    requiredSkills: [] as string[],
    requiresContract: false,
    needCategory: "" as string,
  });
  const [images, setImages] = useState<string[]>([]);
  const [offerImages, setOfferImages] = useState<string[]>([]);

  const update = (key: string, value: string | boolean | string[]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const canProceed = () => {
    const s = STEPS[step];
    return s.fields.every((f) => {
      const val = (form as any)[f];
      return val && String(val).trim().length > 0;
    });
  };

  const setSkills = (skills: string[]) => {
    setForm((f) => ({ ...f, requiredSkills: skills }));
  };

  const handleAddPhoto = async (source: "camera" | "gallery", target: "need" | "offer") => {
    tap("medium");
    const photo = source === "camera" ? await takePhoto() : await pickPhotos();
    if (!photo?.base64String) return;

    setUploading(true);
    try {
      const blob = base64ToBlob(photo.base64String, `image/${photo.format}`);
      const result = await uploadFile(blob, target === "need" ? "needs" : "offers");
      if (target === "need") {
        setImages((prev) => [...prev, result.url]);
      } else {
        setOfferImages((prev) => [...prev, result.url]);
      }
      success();
    } catch {
      hapticError();
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number, target: "need" | "offer") => {
    hapticImpact("light");
    if (target === "need") {
      setImages((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setOfferImages((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async () => {
    tap("medium");
    try {
      const result = await submitNeed({
        title: form.title.trim(),
        description: form.description.trim(),
        offerType: form.offerType,
        offerDescription: form.offerDescription.trim(),
        offerValue: form.offerValue ? parseFloat(form.offerValue) : null,
        locationName: form.locationName.trim(),
        isLocal: true,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        timeRange: form.timeRange.trim() || null,
        requiredSkills: form.requiredSkills,
        images,
        offerImages,
        requiresContract: form.requiresContract,
        needCategory: form.needCategory || null,
      });
      if (result.need) {
        success();
        navigate(`/needs/${result.need.id}`);
      }
    } catch {
      hapticError();
    }
  };

  return (
    <div className="min-h-full pb-6 pt-4 safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-4 max-w-3xl mx-auto">
        <button
          aria-label="Go back"
          onClick={() => {
            hapticImpact("light");
            if (window.history.length > 1) navigate(-1);
            else navigate("/needs");
          }}
          className="p-2 rounded-md text-[var(--parchment)] tap-highlight-none hover:text-[var(--gold)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-mono text-[10px] text-[var(--leather)]">$ nano ~/needs/new.md</p>
          <h1 className="heading-display text-lg text-[var(--gold)]">Post a Need</h1>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-4 mb-6 max-w-3xl mx-auto">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center shrink-0">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                  i < step
                    ? "bg-[var(--emerald)] text-[var(--void)]"
                    : i === step
                      ? "bg-[var(--sun)] text-[var(--void)]"
                      : "bg-[var(--void-raised)] border border-[var(--bronze)] text-[var(--leather)]"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`ml-1.5 font-mono text-[10px] uppercase tracking-wider ${
                  i === step ? "text-[var(--sun)]" : "text-[var(--leather)]"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-2 w-4 h-px bg-[var(--bronze)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <div className="mx-4 mb-4 p-3 rounded-md bg-[var(--ruby)]/10 border border-[var(--ruby)]/30 max-w-3xl">
          <p className="font-mono text-xs text-[var(--ruby)]">$ error: {submitError.message}</p>
        </div>
      )}

      {/* Form */}
      <div className="px-4 space-y-4 max-w-3xl mx-auto">
        {step === 0 && (
          <>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Fix a leaking kitchen tap"
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the situation, timeline, requirements..."
              rows={4}
            />

            {/* Skills */}
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-2">
                Required Skills
              </label>
              <SkillAutocomplete
                value={form.requiredSkills}
                onChange={setSkills}
                placeholder="Search skills… e.g. electrical, tutoring"
                maxSkills={8}
              />
              <p className="text-[10px] text-[var(--leather)] mt-1.5">
                Add skills to help the right people find your need. Browse popular skills or type
                your own.
              </p>
            </div>

            {/* Need Photos */}
            <PhotoUploader
              label="Need Photos"
              photos={images}
              onAdd={(src) => handleAddPhoto(src, "need")}
              onRemove={(idx) => removePhoto(idx, "need")}
              uploading={uploading}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
                className="w-full h-10 px-3 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono rounded-md focus:outline-none focus:border-[var(--sun)] transition-all"
              />
            </div>
            <Input
              label="Time Estimate"
              value={form.timeRange}
              onChange={(e) => update("timeRange", e.target.value)}
              placeholder="e.g. 2 hours, 1 weekend"
            />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-2">
                Offer Type
              </label>
              <div className="flex gap-2">
                {OFFER_TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      hapticImpact("light");
                      setForm((f) => {
                        const incompatible = INCOMPATIBLE_EXCHANGE_MODES[t.key] ?? [];
                        const newCategory = incompatible.includes(f.needCategory)
                          ? ""
                          : f.needCategory;
                        return { ...f, offerType: t.key, needCategory: newCategory };
                      });
                    }}
                    className={`flex-1 py-2.5 rounded-md font-mono text-xs font-medium uppercase tracking-wider border tap-highlight-none transition-all ${
                      form.offerType === t.key
                        ? "bg-[var(--sun)] border-[var(--sun)] text-[var(--void)]"
                        : "bg-transparent border-[var(--bronze)] text-[var(--parchment)] hover:border-[var(--bronze-hover)]"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {t.icon}
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Category */}
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-2">
                <span className="inline-flex items-center gap-1">
                  <Tag size={12} />
                  Category
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EXCHANGE_MODES.filter((m) => {
                  const incompatible = INCOMPATIBLE_EXCHANGE_MODES[form.offerType] ?? [];
                  return !incompatible.includes(m.value);
                }).map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      hapticImpact("light");
                      setForm((f) => ({
                        ...f,
                        needCategory: f.needCategory === mode.value ? "" : mode.value,
                      }));
                    }}
                    className={`px-2.5 py-1.5 rounded-md font-mono text-[10px] font-medium uppercase tracking-wide border tap-highlight-none transition-all ${
                      form.needCategory === mode.value
                        ? `${mode.twBg} ${mode.twBorder} ${mode.twText} border-opacity-100`
                        : "bg-transparent border-[var(--bronze)] text-[var(--leather)] hover:border-[var(--bronze-hover)]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--leather)] mt-1.5">
                Select a category that best describes your exchange.
              </p>
            </div>

            <Textarea
              label="What are you offering?"
              value={form.offerDescription}
              onChange={(e) => update("offerDescription", e.target.value)}
              placeholder="Describe what you're offering in return..."
              rows={3}
            />
            <Input
              label="Estimated Value ($)"
              type="number"
              value={form.offerValue}
              onChange={(e) => update("offerValue", e.target.value)}
              placeholder="e.g. 80"
            />

            {/* Offer Photos */}
            <PhotoUploader
              label="Offer Photos"
              photos={offerImages}
              onAdd={(src) => handleAddPhoto(src, "offer")}
              onRemove={(idx) => removePhoto(idx, "offer")}
              uploading={uploading}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-2">
                Suburb
              </label>
              <LocationAutocomplete
                value={form.locationName}
                onChange={(formatted) => update("locationName", formatted)}
                placeholder="Type suburb name…"
              />
              <p className="text-[10px] text-[var(--leather)] mt-1.5">
                All Central Coast suburbs autocomplete. Try "Terrigal" or "2250"
              </p>
            </div>

            {/* Contract Toggle */}
            <button
              onClick={() => {
                hapticImpact("light");
                update("requiresContract", !form.requiresContract);
              }}
              className="w-full flex items-center justify-between p-3 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)]/30 tap-highlight-none"
            >
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--sun)]" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[var(--mercury)]">Require Contract</p>
                  <p className="text-[10px] text-[var(--leather)]">
                    Both parties must sign a binding agreement
                  </p>
                </div>
              </div>
              {form.requiresContract ? (
                <ToggleRight size={24} className="text-[var(--sun)]" />
              ) : (
                <ToggleLeft size={24} className="text-[var(--bronze)]" />
              )}
            </button>

            {/* Preview */}
            <Vessel className="p-4">
              <p className="font-mono text-xs text-[var(--leather)] uppercase tracking-wider mb-2">
                $ cat preview.txt
              </p>
              <p className="text-sm font-medium text-[var(--gold)]">{form.title || "(no title)"}</p>
              <p className="font-mono text-xs text-[var(--parchment)] mt-1">
                {form.locationName || "(no location)"} · {form.offerType}
                {form.needCategory && (
                  <span className="ml-1">
                    ·{" "}
                    {EXCHANGE_MODES.find((m) => m.value === form.needCategory)?.label ??
                      form.needCategory}
                  </span>
                )}
              </p>
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.requiredSkills.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-2 text-[10px] font-mono text-[var(--leather)]">
                {images.length > 0 && (
                  <span>
                    {images.length} need photo{images.length > 1 ? "s" : ""}
                  </span>
                )}
                {offerImages.length > 0 && (
                  <span>
                    {offerImages.length} offer photo{offerImages.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {form.requiresContract && (
                <p className="text-[10px] text-[var(--sun)] mt-2 flex items-center gap-1">
                  <FileText size={10} />
                  Contract required
                </p>
              )}
            </Vessel>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-4">
          {step > 0 && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                hapticImpact("light");
                setStep(step - 1);
              }}
            >
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => {
                if (canProceed()) {
                  tap("medium");
                  setStep(step + 1);
                }
              }}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight size={14} />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canProceed() || isMutating || uploading}
              haptic={false}
            >
              {isMutating || uploading ? "Posting..." : "Post Need"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Photo Uploader Sub-component ─────────────────────────────── */

function PhotoUploader({
  label,
  photos,
  onAdd,
  onRemove,
  uploading,
}: {
  label: string;
  photos: string[];
  onAdd: (source: "camera" | "gallery") => void;
  onRemove: (idx: number) => void;
  uploading: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] text-[var(--leather)] uppercase tracking-wider mb-2">
        {label}
      </label>
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className="relative shrink-0 w-20 h-20 rounded-md overflow-hidden border border-[var(--bronze)]"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                aria-label="Remove photo"
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--ruby)] text-white flex items-center justify-center tap-highlight-none"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onAdd("camera")}
          disabled={uploading}
          className="flex-1 py-2.5 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] border-dashed text-[var(--leather)] text-xs font-mono flex items-center justify-center gap-2 tap-highlight-none active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <Camera size={14} />
          Camera
        </button>
        <button
          onClick={() => onAdd("gallery")}
          disabled={uploading}
          className="flex-1 py-2.5 rounded-md bg-[var(--void-raised)] border border-[var(--bronze)] border-dashed text-[var(--leather)] text-xs font-mono flex items-center justify-center gap-2 tap-highlight-none active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <ImagePlus size={14} />
          Gallery
        </button>
      </div>
    </div>
  );
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}
