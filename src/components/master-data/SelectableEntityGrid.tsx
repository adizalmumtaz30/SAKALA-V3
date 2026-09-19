"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { BulkActionBar } from "@/components/master-data/BulkActionBar";
import type { BulkResult } from "@/lib/application/master-data.actions";

interface SelectionValue {
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
}

const SelectionContext = createContext<SelectionValue | null>(null);

/**
 * Dipakai oleh EntityRow untuk tahu apakah dirinya sedang di dalam grid
 * yang punya seleksi massal aktif. `undefined` (di luar provider) berarti
 * halaman ini belum ikut fitur bulk -- EntityRow tidak menampilkan
 * checkbox sama sekali, bukan error.
 */
export function useEntitySelection(id: string) {
  const ctx = useContext(SelectionContext);
  if (!ctx) return undefined;
  return { checked: ctx.isSelected(id), onToggle: () => ctx.toggle(id) };
}

/**
 * §Bugfix runtime (Bagian VI.4) — versi SEBELUMNYA menerima prop `renderRow`
 * (function) dari Server Component pemanggil. Next.js MELARANG lewatkan
 * closure biasa lintas batas Server->Client -- cuma referensi Server
 * Action ber-"use server" yang boleh. Errornya baru muncul di RUNTIME
 * ("Functions cannot be passed directly to Client Components"), lolos
 * total dari tsc & eslint karena ini aturan RSC, bukan aturan tipe.
 *
 * Fix: <EntityRow> dikirim sebagai CHILDREN (JSX yang sudah dirender
 * Server Component pemanggil -- itu SAH lintas batas, beda dengan
 * function belum-dipanggil). Status pilih/centang diteruskan lewat
 * Context, dibaca EntityRow sendiri lewat useEntitySelection(id) --
 * bukan lagi lewat prop yang harus dihitung di server.
 */
export function SelectableEntityGrid({
  children,
  bulkActivate,
  bulkDeactivate,
}: {
  children: ReactNode;
  bulkActivate: (ids: string[]) => Promise<BulkResult>;
  bulkDeactivate: (ids: string[]) => Promise<BulkResult>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <SelectionContext.Provider
      value={{ isSelected: (id) => selected.has(id), toggle }}
    >
      <BulkActionBar
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
        onActivate={bulkActivate}
        onDeactivate={bulkDeactivate}
      />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </SelectionContext.Provider>
  );
}
