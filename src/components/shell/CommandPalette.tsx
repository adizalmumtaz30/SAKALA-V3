"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rankOptions } from "@/lib/application/smart-select";
import type { CommandItem, CommandGroup } from "@/lib/application/command-palette";

const GROUP_ORDER: CommandGroup[] = [
  "Navigasi",
  "Guru",
  "Mapel",
  "Kelas",
  "Ruang",
];

/** Batas hasil supaya daftar tidak pernah jadi scroll panjang (Bagian E.1.3). */
const MAX_PER_GROUP = 5;

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl/Cmd+K membuka, Esc menutup. Dipasang di window supaya bekerja dari
  // halaman mana pun tanpa tiap halaman perlu tahu soal palette.
  // Reset + fokus dilakukan di sini (event handler), bukan di effect —
  // effect yang memanggil setState memicu render berantai.
  const openPalette = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
    // Fokus setelah paint supaya caret benar-benar masuk ke input.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (v) return false;
          openPalette();
          return true;
        });
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  // Pakai mesin ranking yang sudah ada (exact → prefix → multi-token →
  // partial), bukan bikin algoritma pencarian kedua yang bisa beda hasil.
  const results = useMemo(() => {
    const ranked = rankOptions(
      items.map((i) => ({ id: i.id, name: i.name })),
      query,
    );
    const byId = new Map(items.map((i) => [i.id, i]));
    const ordered = ranked
      .map((r) => byId.get(r.id))
      .filter((i): i is CommandItem => Boolean(i));

    const grouped = new Map<CommandGroup, CommandItem[]>();
    for (const item of ordered) {
      const bucket = grouped.get(item.group) ?? [];
      if (bucket.length < MAX_PER_GROUP) {
        bucket.push(item);
        grouped.set(item.group, bucket);
      }
    }
    return GROUP_ORDER.flatMap((g) =>
      (grouped.get(g) ?? []).map((item) => ({ ...item, group: g })),
    );
  }, [items, query]);

  const go = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) go(item);
    }
  };

  // Jaga baris terpilih tetap terlihat saat navigasi panah.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian cepat"
    >
      <button
        aria-hidden
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-canvas/70 backdrop-blur-[3px]"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-hairline-strong bg-surface-overlay shadow-2xl">
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="shrink-0 text-ink-faint"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Cari guru, mapel, kelas, ruang, atau halaman…"
            aria-label="Cari"
            className="flex-1 bg-transparent py-3.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="shrink-0 rounded-md border border-hairline-strong px-1.5 py-0.5 text-[10px] text-ink-faint">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-ink-muted">
              Tidak ada yang cocok dengan “{query}”.
            </p>
          )}

          {results.map((item, index) => {
            // Header grup muncul saat grup berubah dari baris sebelumnya —
            // dibaca dari array, bukan variabel yang dimutasi saat render.
            const showHeader = results[index - 1]?.group !== item.group;
            const active = index === activeIndex;
            return (
              <div key={item.id}>
                {showHeader && (
                  <p className="px-2.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    {item.group}
                  </p>
                )}
                <button
                  data-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    active ? "bg-surface-focus text-ink" : "text-ink-muted"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        item.accentColor ?? "var(--color-hairline-strong)",
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">
                    {item.name}
                  </span>
                  {item.hint && (
                    <span className="shrink-0 text-[11px] text-status-incomplete">
                      {item.hint}
                    </span>
                  )}
                  {active && (
                    <kbd className="shrink-0 rounded-md border border-hairline-strong px-1.5 py-0.5 text-[10px] text-ink-faint">
                      ↵
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
