import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X } from "lucide-react";
import {
  findSuburb,
  type Suburb,
  isValidCentralCoastSuburb,
} from "@mobile/lib/data/central-coast-suburbs";
import { hapticImpact } from "@mobile/lib/native";

interface LocationAutocompleteProps {
  value: string; // formatted value e.g. "terrigal_2260"
  onChange: (formatted: string, displayName: string) => void;
  placeholder?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Type suburb name…",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suburb[]>([]);
  const [open, setOpen] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // When value prop changes externally, derive display query
  useEffect(() => {
    if (value && !query) {
      // Try to find the suburb name from formatted value
      const match = findSuburb(value.replace(/_/g, " "))[0];
      if (match && match.formatted === value) {
        setQuery(match.name);
        setHasSelected(true);
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleInputChange = useCallback(
    (val: string) => {
      setQuery(val);
      setHasSelected(false);
      // Always clear stored value on new typing — user must select from dropdown
      onChange("", "");
      if (val.trim()) {
        setResults(findSuburb(val));
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
      }
    },
    [onChange]
  );

  const selectSuburb = useCallback(
    (suburb: Suburb) => {
      hapticImpact("light");
      onChange(suburb.formatted, suburb.name);
      setQuery(suburb.name);
      setOpen(false);
      setHasSelected(true);
    },
    [onChange]
  );

  const clearSelection = useCallback(() => {
    hapticImpact("light");
    setQuery("");
    setOpen(false);
    setHasSelected(false);
    onChange("", "");
  }, [onChange]);

  const isValid = hasSelected && isValidCentralCoastSuburb(value);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input row */}
      <div className="relative flex items-center">
        <MapPin size={14} className="absolute left-3 text-[var(--leather)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-10 pl-9 pr-10 py-2 bg-[var(--void-input)] border text-sm font-mono rounded-md focus:outline-none focus:border-[var(--sun)] transition-all ${
            isValid
              ? "border-[var(--emerald)] text-[var(--emerald)]"
              : "border-[var(--bronze)] text-[var(--gold)]"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-1.5 p-1.5 rounded-md text-[var(--leather)] hover:text-[var(--parchment)] tap-highlight-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-[var(--bronze)] bg-[var(--void-raised)] shadow-lg scrollbar-hide">
          {results.map((suburb) => (
            <button
              key={suburb.formatted}
              type="button"
              onClick={() => selectSuburb(suburb)}
              className="w-full text-left px-3 py-2.5 flex items-center justify-between text-[var(--parchment)] hover:bg-[var(--void-hover)] active:bg-[var(--void-hover)] transition-colors tap-highlight-none"
            >
              <span className="text-sm">
                <span className="text-[var(--gold)]">{suburb.name}</span>
                <span className="text-[var(--leather)] ml-2 text-xs">{suburb.postcode}</span>
              </span>
              <span className="text-[10px] text-[var(--leather)] font-mono">
                {suburb.formatted}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--bronze)] bg-[var(--void-raised)] shadow-lg">
          <div className="px-3 py-3 text-sm text-[var(--leather)] text-center">
            No suburbs found. Try "Terrigal" or "2250"
          </div>
        </div>
      )}

      {/* Stored value indicator */}
      {isValid && (
        <p className="text-[10px] text-[var(--leather)] mt-1">
          stored as: <span className="text-[var(--sun)] font-mono">{value}</span>
        </p>
      )}
    </div>
  );
}
