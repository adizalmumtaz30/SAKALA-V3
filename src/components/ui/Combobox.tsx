"use client";
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ComboboxOption { value: string; label: string; disabled?: boolean; }

export function Combobox({ options, value, onValueChange, placeholder="Pilih...", searchPlaceholder="Cari...", className }: { options: ComboboxOption[]; value?: string; onValueChange: (value: string) => void; placeholder?: string; searchPlaceholder?: string; className?: string; }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find(o => o.value === value);
  const filtered = useMemo(() => options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())), [options, query]);
  return (
    <div className={cn("relative", className)}>
      <button type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(v => !v)} className="sakala-focus-ring flex h-9 w-full items-center justify-between rounded-lg border border-hairline-strong bg-surface px-3 text-left text-[13px] text-ink hover:bg-surface-elevated">
        <span className={cn(!selected && "text-ink-faint")}>{selected?.label ?? placeholder}</span><ChevronsUpDown size={14} className="text-ink-faint" />
      </button>
      {open && (
        <div className="sakala-overlay-surface absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-56 overflow-hidden rounded-lg">
          <div className="border-b border-hairline p-2"><div className="relative"><Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder} className="h-8 w-full rounded-md border border-hairline bg-surface px-8 text-[12.5px] text-ink outline-none focus:border-accent-teal" /></div></div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1.5">
            {filtered.length ? filtered.map(option => (
              <button key={option.value} type="button" disabled={option.disabled} onClick={() => { onValueChange(option.value); setOpen(false); setQuery(""); }} className="flex min-h-8 w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-muted outline-none hover:bg-surface-focus hover:text-ink disabled:opacity-40">
                {option.label}{value === option.value && <Check size={14} className="text-accent-teal" />}
              </button>
            )) : <div className="px-2.5 py-4 text-center text-[12px] text-ink-faint">Tidak ada hasil.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
