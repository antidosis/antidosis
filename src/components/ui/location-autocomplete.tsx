"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { findSuburb, formatLocation, type Suburb } from "@/lib/data/central-coast-suburbs";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
  value: string;
  onChange: (formatted: string, display: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ value, onChange, placeholder = "search_suburb...", className }: LocationAutocompleteProps) {
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
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full border border-[#2a2a2a] bg-[#0c0c0c] max-h-48 overflow-y-auto">
          {results.map((suburb) => (
            <button
              key={suburb.formatted}
              type="button"
              onClick={() => selectSuburb(suburb)}
              className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-[#e8c97c]">{suburb.name}</span>
              <span className="text-[#7a6b4a] ml-2">{suburb.postcode}</span>
              <span className="text-[#7a6b4a]/50 ml-2 text-[11px]">{suburb.formatted}</span>
            </button>
          ))}
        </div>
      )}
      {value && !open && (
        <p className="text-[11px] text-[#7a6b4a] mt-1">
          stored as: <span className="text-[#f5b800]">{value}</span>
        </p>
      )}
    </div>
  );
}
