import { useState } from "react";

import { Globe, Lock, Plus, X } from "lucide-react";
import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  Path,
  UseFieldArrayAppend,
  UseFormRegister,
} from "react-hook-form";
import { useController } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHttpUrl } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

const PLATFORMS = [
  "website",
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "twitter",
  "github",
  "other",
];

const SELECT_CLASS =
  "h-10 rounded border border-line bg-inset px-3 text-sm text-gold outline-none transition-colors focus:border-sun disabled:cursor-not-allowed disabled:opacity-50";

type LinksField = "socialLinks" | "businessSocialLinks";

interface SocialLinksSectionProps {
  control: Control<ProfileFormData>;
  register: UseFormRegister<ProfileFormData>;
  /** Which array this section binds to — personal and business links are
      stored independently. */
  field: LinksField;
  fields: FieldArrayWithId<ProfileFormData, LinksField, "id">[];
  onRemove: (index: number) => void;
  append: UseFieldArrayAppend<ProfileFormData, LinksField>;
  errors: FieldErrors<ProfileFormData>;
  showAudience: boolean;
  variant?: "social" | "business";
}

export function SocialLinksSection({
  control,
  register,
  field,
  fields,
  onRemove,
  append,
  errors,
  showAudience,
  variant = "social",
}: SocialLinksSectionProps) {
  return (
    <SectionCard
      tone="social"
      title={variant === "business" ? "Business web & social presence" : "Social profiles"}
    >
      {fields.length === 0 && (
        <p className="mb-4 text-xs text-ash">No links yet — add your first below.</p>
      )}

      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((row, index) => (
            <LinkRow
              key={row.id}
              field={field}
              index={index}
              control={control}
              register={register}
              onRemove={() => onRemove(index)}
              urlError={errors[field]?.[index]?.url?.message}
              showVisibility={variant !== "business"}
            />
          ))}
        </ul>
      )}

      {fields.length === 0 ? (
        <AddLinkRow
          append={append}
          defaultPlatform={variant === "business" ? "website" : "instagram"}
          showVisibility={variant !== "business"}
        />
      ) : (
        <AddAnotherLink
          append={append}
          defaultPlatform={variant === "business" ? "website" : "instagram"}
          showVisibility={variant !== "business"}
        />
      )}

      {showAudience && (
        <div className="mt-5 border-t border-orchid/20 pt-4">
          <Label htmlFor="profile-audience">Audience size (optional)</Label>
          <Input
            id="profile-audience"
            {...register("audienceSize", {
              setValueAs: (value) =>
                value === "" || value === null || value === undefined ? null : Number(value),
            })}
            placeholder="e.g. 3200"
            inputMode="numeric"
            type="number"
            min={0}
            className="mt-2 max-w-xs text-base"
          />
          {errors.audienceSize && (
            <p className="mt-2 text-xs text-bad">{errors.audienceSize.message}</p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-ash">
            Your approximate total reach. This helps businesses understand the audience for promo
            and review exchanges; it is not independently verified.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

interface LinkRowProps {
  field: LinksField;
  index: number;
  control: Control<ProfileFormData>;
  register: UseFormRegister<ProfileFormData>;
  onRemove: () => void;
  urlError?: string;
  showVisibility: boolean;
}

function LinkRow({
  field,
  index,
  control,
  register,
  onRemove,
  urlError,
  showVisibility,
}: LinkRowProps) {
  const { field: visibility } = useController({
    control,
    name: `${field}.${index}.isPublic` as Path<ProfileFormData>,
  });
  const isPublic = visibility.value !== false;

  return (
    <li>
      <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem] items-center gap-2 sm:flex">
        <select
          {...register(`${field}.${index}.platform` as Path<ProfileFormData>)}
          aria-label={`Link ${index + 1} platform`}
          className={cn(SELECT_CLASS, "col-span-3 w-full shrink-0 capitalize sm:w-28")}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Input
          {...register(`${field}.${index}.url` as Path<ProfileFormData>)}
          placeholder="https://…"
          inputMode="url"
          aria-label={`Link ${index + 1} URL`}
          className="min-w-0 flex-1 text-base"
        />
        {showVisibility ? (
          <button
            type="button"
            onClick={() => visibility.onChange(!isPublic)}
            title={isPublic ? "Public — shown on your profile" : "Private — visible only to you"}
            aria-label={isPublic ? "Make link private" : "Make link public"}
            aria-pressed={isPublic}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed",
              isPublic
                ? "border-sun/30 text-sun hover:border-sun/60"
                : "border-line text-ash hover:border-linehi hover:text-gold"
            )}
          >
            {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </button>
        ) : (
          <span
            className="hidden h-10 w-10 shrink-0 items-center justify-center text-ash sm:flex"
            title="Shown on your directory listing"
          >
            <Globe className="h-4 w-4" />
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Remove link"
          aria-label={`Remove link ${index + 1}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line text-ash transition-colors hover:border-bad/40 hover:text-bad"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {urlError && <p className="mt-1 text-xs text-bad">{urlError}</p>}
    </li>
  );
}

interface AddLinkRowProps {
  append: UseFieldArrayAppend<ProfileFormData, LinksField>;
  defaultPlatform: string;
  showVisibility: boolean;
}

function AddLinkRow({ append, defaultPlatform, showVisibility }: AddLinkRowProps) {
  const [platform, setPlatform] = useState(defaultPlatform);
  const [url, setUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const trimmed = url.trim();
    const normalized = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!isHttpUrl(normalized)) {
      setError("Enter a valid URL, e.g. https://instagram.com/you");
      return;
    }
    append({ platform, url: normalized, isPublic: showVisibility ? isPublic : true });
    setUrl("");
    setError(null);
  }

  return (
    <div className="mt-4 border-t border-line/40 pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-parchment">Add a link</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          aria-label="New link platform"
          className={cn(SELECT_CLASS, "w-full shrink-0 capitalize sm:w-32")}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://…"
          inputMode="url"
          aria-label="New link URL"
          className="min-w-0 flex-1 text-base"
        />
        <div className="flex gap-2">
          {showVisibility && (
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              title={isPublic ? "Will be public" : "Will be private"}
              aria-label={isPublic ? "New link will be public" : "New link will be private"}
              aria-pressed={isPublic}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors",
                isPublic
                  ? "border-sun/30 text-sun hover:border-sun/60"
                  : "border-line text-ash hover:border-linehi hover:text-gold"
              )}
            >
              {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
          )}
          <Button type="button" variant="secondary" onClick={add} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
    </div>
  );
}

/** Once links exist the composer tucks away behind a toggle so it doesn't
    sit there permanently cluttering the section. */
function AddAnotherLink({ append, defaultPlatform, showVisibility }: AddLinkRowProps) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 border-t border-line/40 pt-4 text-xs font-medium text-ash transition-colors hover:text-sun"
      >
        <Plus className="h-3.5 w-3.5" /> Add another link
      </button>
    );
  }
  return (
    <div>
      <AddLinkRow
        append={append}
        defaultPlatform={defaultPlatform}
        showVisibility={showVisibility}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ash transition-colors hover:text-gold"
      >
        <X className="h-3.5 w-3.5" /> Close
      </button>
    </div>
  );
}
