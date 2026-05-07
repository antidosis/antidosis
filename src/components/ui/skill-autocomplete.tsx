"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchSkills, getSkillCategory, getCategoryLabel, SKILL_TAXONOMY } from "@/lib/skills-taxonomy";
import { Plus, X, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillAutocompleteProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
  className?: string;
}

export function SkillAutocomplete({
  value,
  onChange,
  placeholder = "Search skills…",
  maxSkills = 10,
  className,
}: SkillAutocompleteProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = searchSkills(input, value);
  const hasExactMatch = suggestions.some(
    (s) => s.toLowerCase() === input.trim().toLowerCase()
  );
  const showCustomOption = input.trim() && !hasExactMatch;
  const totalOptions = suggestions.length + (showCustomOption ? 1 : 0);

  const addSkill = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (!trimmed) return;
      if (value.length >= maxSkills) return;
      if (value.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
      onChange([...value, trimmed]);
      setInput("");
      setOpen(false);
      setHighlightedIndex(0);
      inputRef.current?.focus();
    },
    [value, onChange, maxSkills]
  );

  const removeSkill = useCallback(
    (skill: string) => {
      onChange(value.filter((s) => s.toLowerCase() !== skill.toLowerCase()));
    },
    [value, onChange]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "Enter" && input.trim()) {
        e.preventDefault();
        addSkill(input);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex < suggestions.length) {
          addSkill(suggestions[highlightedIndex]);
        } else if (showCustomOption) {
          addSkill(input);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  // Group suggestions by category for display
  const groupedSuggestions: { categoryId: string; categoryLabel: string; skills: string[] }[] = [];
  for (const skill of suggestions) {
    const catId = getSkillCategory(skill) ?? "other";
    const catLabel = getCategoryLabel(catId) ?? "Other";
    const group = groupedSuggestions.find((g) => g.categoryId === catId);
    if (group) {
      group.skills.push(skill);
    } else {
      groupedSuggestions.push({ categoryId: catId, categoryLabel: catLabel, skills: [skill] });
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Input row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a6b5a]" />
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length >= maxSkills ? `Max ${maxSkills} skills` : placeholder}
          disabled={value.length >= maxSkills}
          className="pl-9 pr-10"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => input.trim() && addSkill(input)}
          disabled={!input.trim() || value.length >= maxSkills}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-[#7a6b5a] hover:text-[#e8d5a3] disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || showCustomOption) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded border border-[#2a2420] bg-[#14110e] shadow-lg"
        >
          {/* Suggestions grouped by category */}
          {groupedSuggestions.map((group) => (
            <div key={group.categoryId}>
              <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#7a6b5a] bg-[#1a1714] border-b border-[#2a2420]">
                {group.categoryLabel}
              </div>
              {group.skills.map((skill) => {
                const globalIndex = suggestions.indexOf(skill);
                const isHighlighted = globalIndex === highlightedIndex;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                      isHighlighted
                        ? "bg-[#2a2420] text-[#e8d5a3]"
                        : "text-[#b8a078] hover:bg-[#1e1a16]"
                    )}
                  >
                    <Sparkles className="h-3 w-3 text-[#f5a623] opacity-60" />
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Custom skill option */}
          {showCustomOption && (
            <button
              type="button"
              onClick={() => addSkill(input)}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors border-t border-[#2a2420] flex items-center gap-2",
                highlightedIndex === suggestions.length
                  ? "bg-[#2a2420] text-[#e8d5a3]"
                  : "text-[#b8a078] hover:bg-[#1e1a16]"
              )}
            >
              <Plus className="h-3 w-3 text-[#00e676]" />
              <span>
                Add &quot;<span className="text-[#e8d5a3]">{input.trim()}</span>&quot;
              </span>
            </button>
          )}
        </div>
      )}

      {/* Empty state — no popular skills yet, we collect real usage data */}
      {open && !input.trim() && suggestions.length === 0 && !showCustomOption && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded border border-[#2a2420] bg-[#14110e] shadow-lg"
        >
          <div className="px-3 py-3 text-sm text-[#7a6b5a] text-center">
            Start typing to see skill suggestions
          </div>
        </div>
      )}

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 text-xs text-[#e8d5a3] bg-[#1a1714] border border-[#2a2420] rounded px-2.5 py-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-[#7a6b5a] hover:text-[#ff5252] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {value.length >= maxSkills && (
        <p className="text-[10px] text-[#7a6b5a] mt-1.5">
          Maximum {maxSkills} skills allowed.
        </p>
      )}
    </div>
  );
}
