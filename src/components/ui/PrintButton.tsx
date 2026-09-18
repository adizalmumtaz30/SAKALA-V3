"use client";

import { Printer } from "lucide-react";

/**
 * Bagian F.7 — memicu dialog cetak bawaan browser, yang sekaligus jadi
 * jalur "Simpan sebagai PDF" tanpa perlu pustaka ekspor apa pun.
 *
 * Sengaja tidak memakai pustaka PDF: hasil cetak browser mengikuti
 * stylesheet @media print yang sama, jadi apa yang dilihat operator di
 * pratinjau persis yang keluar di kertas — tidak ada jalur render kedua
 * yang bisa berbeda hasilnya.
 */
export function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      data-print="hide"
      aria-label={`${label} (Ctrl+P)`}
      className="flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:border-accent-teal hover:text-ink"
    >
      <Printer size={14} strokeWidth={1.75} />
      {label}
    </button>
  );
}
