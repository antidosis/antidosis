"use client";

import { useState, useRef, useEffect } from "react";

import { findSuburb, type Suburb } from "@/lib/data/central-coast-suburbs";
import { cn } from "@/lib/utils";

import { Input } from "./input";

interface LocationAutocompleteProps {
  value: string;
  onChange: (formatted: string, display: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "search_suburb...",
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suburb[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    setQuery(suburb.name);
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Input
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full border border-line bg-surface max-h-48 overflow-y-auto rounded-md box-glow-mercury">
          {results.map((suburb) => (
            <button
              key={suburb.formatted}
              type="button"
              onClick={() => selectSuburb(suburb)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-raise transition-colors"
            >
              <span className="text-gold">{suburb.name}</span>
              <span className="text-ash ml-2">{suburb.postcode}</span>
              <span className="text-ash ml-2 text-xs">{suburb.formatted}</span>
            </button>
          ))}
        </div>
      )}
      {value && !open && (
        <p className="text-xs text-ash mt-1">
          stored as: <span className="text-sun">{value}</span>
        </p>
      )}
    </div>
  );
}
