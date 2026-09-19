"use client";

import { type ReactNode, createContext, useContext, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Plus, Pencil, Check, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEntitySelection } from "@/components/master-data/SelectableEntityGrid";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import type { FormState } from "@/lib/application/master-data.actions";

/**
 * §Bugfix runtime — panel `expandable` (mis. Duplikat di Beban Mengajar)
 * dulu diberi tahu cara menutup dirinya lewat prop `render: (close) =>
 * ReactNode`, function yang dihitung di Server Component pemanggil. Sama
 * ilegalnya dengan `renderRow` di SelectableEntityGrid. Sekarang halaman
 * pemanggil cukup kirim JSX yang SUDAH jadi (`panel`, bukan `render`), dan
 * konten di dalamnya membaca fungsi tutup lewat context ini kalau perlu.
 */
const ExpandableCloseContext = createContext<(() => void) | null>(null);
export function useExpandableClose() {
  return useContext(ExpandableCloseContext);
}

interface EntityRowProps {
  icon: ReactNode;
  name: string;
  meta?: string;
  status: "active" | "inactive";
  id: string;
  toggleAction: (formData: FormData) => Promise<void>;
  detailHref?: string;
  /** Dependency nyata dari diagnostics — memicu ConfirmDialog (Bagian E.2.1). */
  dependencyWarnings?: string[];
  /** Strip aksen identitas warna (Bagian E.1.2) — aksen, bukan fill solid. */
  accentColor?: string;
  /** Slot aksi tambahan di kanan, mis. pemilih warna. */
  trailing?: ReactNode;
  /** Bagian V.1 — deret ikon aksi: 👁 Lihat Jadwal, ➕ Tambah Jadwal, ✏️ Edit.
   *  Undefined = ikon itu tidak ditampilkan (mis. Ruang belum ikut Jadwal). */
  viewScheduleHref?: string;
  addScheduleHref?: string;
  renameAction?: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Bagian VI.5 — panel inline tambahan (mis. "Duplikat"), dibuka lewat
   *  ikon sendiri, ditutup lewat callback yang diteruskan ke isinya. Slot
   *  generik supaya tidak perlu menambah prop baru tiap ada kebutuhan
   *  serupa di halaman lain. */
  expandable?: {
    icon: ReactNode;
    label: string;
    panel: ReactNode;
  };
}

const emptyState: FormState = {};

/**
 * Kartu entitas untuk grid (Bagian E.1.3: grid kartu, bukan daftar vertikal
 * panjang). Aksi tetap hover-reveal supaya daftar tidak terlihat ramai, tapi
 * ikut muncul saat fokus keyboard demi aksesibilitas.
 *
 * Deret ikon (Bagian V.1): fungsi tiap ikon menyesuaikan konteks entitasnya
 * sendiri — 👁 dan ➕ mengarah ke Kanvas Jadwal yang sudah difilter/fokus ke
 * entitas ini (bukan halaman baru yang operator harus filter manual lagi),
 * ✏️ membuka edit di tempat (tanpa pindah halaman), 🗑 tetap lewat
 * ToggleStatusButton yang sudah ada.
 */
export function EntityRow({
  icon,
  name,
  meta,
  status,
  id,
  toggleAction,
  detailHref,
  dependencyWarnings,
  accentColor,
  trailing,
  viewScheduleHref,
  addScheduleHref,
  renameAction,
  expandable,
}: EntityRowProps) {
  // §Bugfix runtime -- dulu diterima sebagai prop `selectable` yang harus
  // dihitung di Server Component pemanggil (butuh function di dalamnya,
  // ilegal lintas batas RSC). Sekarang dibaca sendiri lewat Context --
  // undefined kalau EntityRow ini tidak dibungkus SelectableEntityGrid.
  const selectable = useEntitySelection(id);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, pending] = useActionState(
    renameAction ?? (async () => emptyState),
    emptyState,
  );

  // Submit sukses menutup mode edit otomatis — dideteksi lewat transisi
  // pending true->false TANPA error, bukan lewat identitas objek state
  // (yang rapuh: instance emptyState di modul actions berbeda dengan yang
  // di sini walau isinya sama-sama kosong).
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div>
    <div className={`group relative flex items-center gap-3 overflow-hidden border border-hairline bg-surface px-4 py-3 transition-all duration-200 hover:border-hairline-strong hover:bg-surface-elevated focus-within:border-hairline-strong ${expandable && expanded ? "rounded-t-xl border-b-0" : "rounded-xl"}`}>
      {accentColor && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {selectable && (
        <input
          type="checkbox"
          checked={selectable.checked}
          onChange={selectable.onToggle}
          aria-label={`Pilih ${name}`}
          className="h-4 w-4 shrink-0 accent-accent-teal"
        />
      )}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-hairline-strong text-ink-muted transition-colors group-hover:text-ink">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <form action={formAction} className="flex items-center gap-1.5">
            <input type="hidden" name="id" value={id} />
            <input
              name="name"
              defaultValue={name}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label={`Ubah nama ${name}`}
              className="min-w-0 flex-1 rounded-md border border-accent-teal bg-surface px-2 py-1 text-[13.5px] text-ink outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              aria-label="Simpan"
              className="shrink-0 rounded-md p-1 text-status-ready transition-colors hover:bg-status-ready/10 disabled:opacity-50"
            >
              <Check size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="Batal"
              className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </form>
        ) : (
          <>
            {detailHref ? (
              <Link
                href={detailHref}
                className="block truncate text-[13.5px] text-ink transition-colors hover:text-accent-teal"
              >
                {name}
              </Link>
            ) : (
              <p className="truncate text-[13.5px] text-ink">{name}</p>
            )}
            <div className="mt-0.5 flex items-center gap-2">
              {meta && <span className="text-[12px] text-ink-muted">{meta}</span>}
              <StatusBadge status={status} />
              {state.error && (
                <span className="text-[11px] text-status-blocked">{state.error}</span>
              )}
            </div>
          </>
        )}
      </div>

      {trailing && (\n        <div className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">\n          {trailing}\n        </div>\n      )}

      {!editing && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          {viewScheduleHref && (
            <Link
              href={viewScheduleHref}
              aria-label={`Lihat jadwal ${name}`}
              title="Lihat jadwal"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
            >
              <Eye size={14} strokeWidth={1.75} />
            </Link>
          )}
          {addScheduleHref && (
            <Link
              href={addScheduleHref}
              aria-label={`Tambah jadwal ${name}`}
              title="Tambah jadwal"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
            >
              <Plus size={14} strokeWidth={1.75} />
            </Link>
          )}
          {renameAction && (
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit ${name}`}
              title="Edit"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-focus hover:text-ink"
            >
              <Pencil size={14} strokeWidth={1.75} />
            </button>
          )}
          {expandable && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={`${expandable.label} ${name}`}
              title={expandable.label}
              aria-expanded={expanded}
              className={`rounded-lg p-1.5 transition-colors ${
                expanded
                  ? "bg-surface-focus text-ink"
                  : "text-ink-faint hover:bg-surface-focus hover:text-ink"
              }`}
            >
              {expandable.icon}
            </button>
          )}
          <ToggleStatusButton
            id={id}
            status={status}
            action={toggleAction}
            label={name}
            dependencyWarnings={dependencyWarnings}
          />
        </div>
      )}
    </div>
    {expandable && expanded && (
      <div className="rounded-b-xl border border-t-0 border-hairline-strong bg-surface-elevated px-4 py-3">
        <ExpandableCloseContext.Provider value={() => setExpanded(false)}>
          {expandable.panel}
        </ExpandableCloseContext.Provider>
      </div>
    )}
    </div>
  );
}
