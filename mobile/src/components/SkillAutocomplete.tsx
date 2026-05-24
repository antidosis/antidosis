import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, X, Sparkles } from "lucide-react";
import { searchSkills, getSkillCategory, getCategoryLabel } from "@mobile/lib/skills-taxonomy";
import { hapticImpact } from "@mobile/lib/native";

interface SkillAutocompleteProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

export function SkillAutocomplete({
  value,
  onChange,
  placeholder = "Search skills…",
  maxSkills = 8,
}: SkillAutocompleteProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => searchSkills(input, value), [input, value]);

  const hasExactMatch = suggestions.some((s) => s.toLowerCase() === input.trim().toLowerCase());
  const showCustomOption = input.trim() && !hasExactMatch && value.length < maxSkills;
  const totalOptions = suggestions.length + (showCustomOption ? 1 : 0);

  const addSkill = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (!trimmed) return;
      if (value.length >= maxSkills) return;
      if (value.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
      hapticImpact("light");
      onChange([...value, trimmed]);
      setInput("");
      setOpen(false);
      inputRef.current?.focus();
    },
    [value, onChange, maxSkills]
  );

  const removeSkill = useCallback(
    (skill: string) => {
      hapticImpact("light");
      onChange(value.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
    },
    [value, onChange]
  );

  // Close dropdown on outside tap
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Group suggestions by category
  const grouped = useMemo(() => {
    const groups: { categoryId: string; categoryLabel: string; skills: string[] }[] = [];
    for (const skill of suggestions) {
      const catId = getSkillCategory(skill) ?? "other";
      const catLabel = getCategoryLabel(catId) ?? "Other";
      const group = groups.find((g) => g.categoryId === catId);
      if (group) {
        group.skills.push(skill);
      } else {
        groups.push({ categoryId: catId, categoryLabel: catLabel, skills: [skill] });
      }
    }
    return groups;
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "Enter" && input.trim()) {
        e.preventDefault();
        addSkill(input);
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addSkill(suggestions[0]);
      } else if (showCustomOption) {
        addSkill(input);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const atMax = value.length >= maxSkills;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input row */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-[var(--leather)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (!atMax) setOpen(true);
          }}
          onFocus={() => {
            if (!atMax && input.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={atMax ? `Max ${maxSkills} skills` : placeholder}
          disabled={atMax}
          autoComplete="off"
          className="w-full h-10 pl-9 pr-10 py-2 bg-[var(--void-input)] border border-[var(--bronze)] text-[var(--gold)] text-sm font-mono rounded-md focus:outline-none focus:border-[var(--sun)] transition-all disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => input.trim() && addSkill(input)}
          disabled={!input.trim() || atMax}
          className="absolute right-1.5 p-1.5 rounded-md text-[var(--leather)] hover:text-[var(--parchment)] disabled:opacity-30 tap-highlight-none"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Dropdown */}
      {open && totalOptions > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-[var(--bronze)] bg-[var(--void-raised)] shadow-lg scrollbar-hide">
          {/* Grouped suggestions */}
          {grouped.map((group) => (
            <div key={group.categoryId}>
              <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--leather)] bg-[var(--void-hover)] border-b border-[var(--bronze)]">
                {group.categoryLabel}
              </div>
              {group.skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 text-[var(--parchment)] hover:bg-[var(--void-hover)] active:bg-[var(--void-hover)] transition-colors tap-highlight-none"
                >
                  <Sparkles size={12} className="text-[var(--sun)] opacity-60 shrink-0" />
                  <span>{skill}</span>
                </button>
              ))}
            </div>
          ))}

          {/* Custom skill option */}
          {showCustomOption && (
            <button
              type="button"
              onClick={() => addSkill(input)}
              className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 text-[var(--parchment)] hover:bg-[var(--void-hover)] active:bg-[var(--void-hover)] border-t border-[var(--bronze)] transition-colors tap-highlight-none"
            >
              <Plus size={12} className="text-[var(--emerald)] shrink-0" />
              <span>
                Add "<span className="text-[var(--gold)]">{input.trim()}</span>"
              </span>
            </button>
          )}
        </div>
      )}

      {/* Empty state hint */}
      {open && !input.trim() && suggestions.length === 0 && !showCustomOption && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--bronze)] bg-[var(--void-raised)] shadow-lg">
          <div className="px-3 py-3 text-sm text-[var(--leather)] text-center">
            Start typing to see skill suggestions
          </div>
        </div>
      )}

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 text-xs text-[var(--gold)] bg-[var(--void-hover)] border border-[var(--bronze)] rounded px-2 py-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-[var(--leather)] hover:text-[var(--ruby)] tap-highlight-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {atMax && (
        <p className="text-[10px] text-[var(--leather)] mt-1.5">
          Maximum {maxSkills} skills allowed.
        </p>
      )}
    </div>
  );
}
