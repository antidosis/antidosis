"use client";

import { useState, useRef, useEffect } from "react";

import { displayLocation, findSuburb, type Suburb } from "@/lib/data/central-coast-suburbs";
import { cn } from "@/lib/utils";

import { Input } from "./input";

interface LocationAutocompleteProps {
  value: string;
  onChange: (formatted: string, display: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "search_suburb...",
  className,
  id,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(() => (value ? displayLocation(value) : ""));
  const [results, setResults] = useState<Suburb[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Adjust local text when the external value changes — render-adjust pattern
  const [queryFor, setQueryFor] = useState(value);
  if (queryFor !== value) {
    setQueryFor(value);
    setQuery(value ? displayLocation(value) : "");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    setResults(findSuburb(val));
    setOpen(true);
  }

  function selectSuburb(suburb: Suburb) {
    onChange(suburb.formatted, suburb.name);
    setQuery(displayLocation(suburb.formatted));
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Input
        id={id}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={open ? `${id || "suburb"}-suggestions` : undefined}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div
          id={`${id || "suburb"}-suggestions`}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-line bg-surface box-glow-mercury"
        >
          {results.map((suburb) => (
            <button
              key={suburb.formatted}
              type="button"
              onClick={() => selectSuburb(suburb)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-raise transition-colors"
            >
              <span className="text-gold">{suburb.name}</span>
              <span className="ml-2 text-ash">NSW {suburb.postcode}</span>
            </button>
          ))}
        </div>
      )}
      {value && !open && query === displayLocation(value) && (
        <p className="mt-1.5 text-xs text-ok">Saved suburb · search above to change it</p>
      )}
    </div>
  );
}
