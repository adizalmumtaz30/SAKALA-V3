"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { rankOptions, suggestClosest, type SmartOption } from "@/lib/application/smart-select";
import { cn } from "@/lib/cn";

interface SmartSelectProps {
  name?: string;
  options: SmartOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function SmartSelect({
  name,
  options,
  defaultValue,
  value,
  onChange,
  placeholder = "Pilih",
  required,
}: SmartSelectProps) {
  const [internalId, setInternalId] = useState(defaultValue ?? "");
  const selectedId = value !== undefined ? value : internalId;

  function select(id: string) {
    if (value === undefined) setInternalId(id);
    onChange?.(id);
  }

  // Bagian 74 (LOCKED): 3 or fewer choices are shown directly — search adds
  // friction where it isn't needed.
  if (options.length <= 3) {
    return (
      <div className="flex flex-wrap gap-2">
        {name && <input type="hidden" name={name} value={selectedId} required={required} />}
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => select(o.id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-[13px] transition-colors",
              selectedId === o.id
                ? "border-accent-teal text-ink"
                : "border-hairline-strong text-ink-muted hover:text-ink",
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <SmartSelectSearch
      name={name}
      options={options}
      selectedId={selectedId}
      onSelect={select}
      placeholder={placeholder}
      required={required}
    />
  );
}

function SmartSelectSearch({
  name,
  options,
  selectedId,
  onSelect,
  placeholder,
  required,
}: {
  name?: string;
  options: SmartOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === selectedId);
  const ranked = useMemo(() => rankOptions(options, query), [options, query]);
  const suggestion = ranked.length === 0 ? suggestClosest(options, query) : null;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function openDropdown() {
    setQuery("");
    setHighlight(0);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function commit(id: string) {
    onSelect(id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, ranked.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ranked[highlight]) commit(ranked[highlight].id);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={selectedId} required={required} />}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="flex w-full items-center justify-between rounded-lg border border-hairline-strong bg-surface px-3.5 py-2.5 text-left text-[13.5px] text-ink outline-none focus:border-accent-teal"
      >
        <span className={selected ? "text-ink" : "text-ink-faint"}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={1.75} className="text-ink-faint" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-hairline-strong bg-surface-overlay shadow-xl">
          <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
            <Search size={14} strokeWidth={1.75} className="shrink-0 text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Cari…"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {ranked.length === 0 ? (
              <div className="px-3 py-3 text-[12.5px] text-ink-faint">
                {suggestion ? (
                  <>
                    Tidak menemukan &quot;{query}&quot;. Mungkin maksud Anda{" "}
                    <button
                      type="button"
                      onClick={() => commit(suggestion.id)}
                      className="text-accent-teal hover:underline"
                    >
                      {suggestion.name}
                    </button>
                    ?
                  </>
                ) : (
                  `Tidak ada hasil untuk "${query}".`
                )}
              </div>
            ) : (
              ranked.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => commit(o.id)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-[13px]",
                    i === highlight ? "bg-surface-focus text-ink" : "text-ink-muted",
                  )}
                >
                  {o.name}
                  {o.id === selectedId && (
                    <Check size={14} strokeWidth={1.75} className="text-accent-teal" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
