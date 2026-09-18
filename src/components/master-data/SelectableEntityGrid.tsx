"use client";

import { type ReactNode, useState } from "react";
import { BulkActionBar } from "@/components/master-data/BulkActionBar";
import type { BulkResult } from "@/lib/application/master-data.actions";

interface Item {
  id: string;
}

/**
 * Bagian VI.4 — dipakai di keempat halaman Master Data (Guru/Mapel/Kelas/
 * Ruang) supaya logika seleksi tidak ditulis ulang 4 kali. Halaman tetap
 * server component untuk pengambilan data; hanya bagian yang butuh state
 * klien (checkbox + bilah aksi) yang dibungkus di sini.
 */
export function SelectableEntityGrid<T extends Item>({
  items,
  bulkActivate,
  bulkDeactivate,
  renderRow,
}: {
  items: T[];
  bulkActivate: (ids: string[]) => Promise<BulkResult>;
  bulkDeactivate: (ids: string[]) => Promise<BulkResult>;
  renderRow: (item: T, selectable: { checked: boolean; onToggle: () => void }) => ReactNode;
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
    <>
      <BulkActionBar
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
        onActivate={bulkActivate}
        onDeactivate={bulkDeactivate}
      />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          renderRow(item, {
            checked: selected.has(item.id),
            onToggle: () => toggle(item.id),
          }),
        )}
      </div>
    </>
  );
}
