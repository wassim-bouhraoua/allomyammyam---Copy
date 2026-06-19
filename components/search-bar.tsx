"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar — controlled input, state owned by the parent page.
// The clear button (×) only appears when there is text.
// ─────────────────────────────────────────────────────────────────────────────
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search dishes or chefs...",
}: SearchBarProps) {
  return (
    <div className="flex-1 flex items-center gap-2.5 bg-secondary rounded-2xl px-4 h-11 focus-within:ring-2 focus-within:ring-orange-300 transition-all duration-200">
      <Search size={15} className="text-muted-foreground flex-shrink-0" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
      />

      {value.length > 0 && (
        <button
          onClick={() => onChange("")}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center active:bg-muted/80 transition-colors"
          aria-label="Clear search"
        >
          <X size={11} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
