"use client";

import { Search } from "lucide-react";

/**
 * Bagian F.3 — kotak pencarian di TopBar. Sebelumnya cuma placeholder mati
 * ("wired in a later phase"); sekarang jadi pintu masuk Command Palette.
 *
 * Fungsinya bukan input sungguhan melainkan tombol: menekan Ctrl/Cmd+K
 * adalah jalur utamanya, dan tombol ini yang membuat pintasan itu
 * DITEMUKAN operator yang tidak membaca dokumentasi.
 */
export function SearchTrigger() {
  const openPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );
  };

  return (
    <button
      onClick={openPalette}
      aria-label="Cari di SAKALA (Ctrl+K)"
      className="flex w-full max-w-sm items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-2 text-left transition-colors hover:border-hairline-strong hover:bg-surface-elevated"
    >
      <Search size={15} strokeWidth={1.75} className="shrink-0 text-ink-faint" />
      <span className="flex-1 text-[12.5px] text-ink-faint">Cari di SAKALA</span>
      {/* Label pintasan lewat CSS, bukan state: server tidak tahu OS klien,
          jadi mendeteksinya di JS akan memicu ketidakcocokan hydration. */}
      <kbd className="shrink-0 rounded-md border border-hairline-strong px-1.5 py-0.5 text-[10px] text-ink-faint">
        <span className="kbd-mod" /> K
      </kbd>
    </button>
  );
}
