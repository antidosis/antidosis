import { useState } from "react";

import { Globe, Loader2, Lock, Plus, X } from "lucide-react";
import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFormRegister,
} from "react-hook-form";
import { useController } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isHttpUrl } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import { SectionCard } from "./section-card";
import type { ProfileFormData } from "./types";

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "website", "github", "other"];

const SELECT_CLASS =
  "h-10 rounded border border-line bg-inset px-3 text-sm text-gold outline-none transition-colors focus:border-sun disabled:cursor-not-allowed disabled:opacity-50";

interface SocialLinksSectionProps {
  control: Control<ProfileFormData>;
  register: UseFormRegister<ProfileFormData>;
  fields: FieldArrayWithId<ProfileFormData, "socialLinks", "id">[];
  removingIds: ReadonlySet<string>;
  onMarkRemoving: (fieldId: string) => void;
  append: UseFieldArrayAppend<ProfileFormData, "socialLinks">;
  errors: FieldErrors<ProfileFormData>;
}

export function SocialLinksSection({
  control,
  register,
  fields,
  removingIds,
  onMarkRemoving,
  append,
  errors,
}: SocialLinksSectionProps) {
  return (
    <SectionCard
      title="Social links"
      description="Public links appear on your profile and in the directory. Private links are shared when you message someone about a need."
    >
      {fields.length === 0 && (
        <p className="mb-4 text-xs text-ash">No links yet — add your first below.</p>
      )}

      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((field, index) => (
            <LinkRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              removing={removingIds.has(field.id)}
              onMarkRemoving={() => onMarkRemoving(field.id)}
              urlError={errors.socialLinks?.[index]?.url?.message}
            />
          ))}
        </ul>
      )}

      <AddLinkRow append={append} />
    </SectionCard>
  );
}

interface LinkRowProps {
  index: number;
  control: Control<ProfileFormData>;
  register: UseFormRegister<ProfileFormData>;
  removing: boolean;
  onMarkRemoving: () => void;
  urlError?: string;
}

function LinkRow({ index, control, register, removing, onMarkRemoving, urlError }: LinkRowProps) {
  const { field: visibility } = useController({
    control,
    name: `socialLinks.${index}.isPublic`,
  });
  const isPublic = visibility.value !== false;

  return (
    <li>
      <div className={cn("flex items-center gap-2", removing && "opacity-50")}>
        <select
          {...register(`socialLinks.${index}.platform`)}
          disabled={removing}
          aria-label={`Link ${index + 1} platform`}
          className={cn(SELECT_CLASS, "w-28 shrink-0 capitalize")}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Input
          {...register(`socialLinks.${index}.url`)}
          disabled={removing}
          placeholder="https://…"
          inputMode="url"
          aria-label={`Link ${index + 1} URL`}
          className={cn("min-w-0 flex-1 text-base", removing && "line-through")}
        />
        <button
          type="button"
          onClick={() => visibility.onChange(!isPublic)}
          disabled={removing}
          title={isPublic ? "Public — shown on your profile" : "Private — shared when messaging"}
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
        <button
          type="button"
          onClick={onMarkRemoving}
          disabled={removing}
          title={removing ? "Removing on save…" : "Remove link"}
          aria-label={`Remove link ${index + 1}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line text-ash transition-colors hover:border-bad/40 hover:text-bad disabled:cursor-wait"
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin text-bad" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      </div>
      {removing ? (
        <p className="mt-1 text-[11px] text-ash">This link will be removed when you save.</p>
      ) : (
        urlError && <p className="mt-1 text-xs text-bad">{urlError}</p>
      )}
    </li>
  );
}

interface AddLinkRowProps {
  append: UseFieldArrayAppend<ProfileFormData, "socialLinks">;
}

function AddLinkRow({ append }: AddLinkRowProps) {
  const [platform, setPlatform] = useState("instagram");
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
    append({ platform, url: normalized, isPublic });
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
          <Button type="button" variant="secondary" onClick={add} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
    </div>
  );
}
