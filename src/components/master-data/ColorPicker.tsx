"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setSubjectColorAction } from "@/lib/application/master-data.actions";
import {
  paletteForCount,
  getIdentityColor,
} from "@/lib/domain/identity-color";
import { useToast } from "@/components/ui/Toast";

export function ColorPicker({
  subjectId,
  subjectName,
  currentKey,
  totalSubjects,
}: {
  subjectId: string;
  subjectName: string;
  currentKey: string | null;
  totalSubjects: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  // Aturan 3: jumlah slot menyesuaikan jumlah data, bukan selalu 20.
  const palette = paletteForCount(totalSubjects);
  const current = getIdentityColor(currentKey);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(colorKey: string) {
    setOpen(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", subjectId);
      formData.set("colorKey", colorKey);
      await setSubjectColorAction(formData);
      show({
        message: `Warna ${subjectName} diubah ke ${getIdentityColor(colorKey)?.label}`,
        tone: "success",
      });
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label={`Ubah warna identitas ${subjectName}`}
        title={current ? `Warna: ${current.label}` : "Pilih warna identitas"}
        className="h-6 w-6 rounded-md border border-hairline-strong transition-transform hover:scale-110 disabled:opacity-50"
        style={{ backgroundColor: current?.accent ?? "transparent" }}
      />

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-hairline-strong bg-surface-overlay/95 p-2.5 shadow-2xl backdrop-blur-md">
          <p className="mb-2 px-0.5 text-[11px] text-ink-faint">
            Warna identitas {subjectName}
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {palette.map((color) => (
              <button
                key={color.key}
                type="button"
                onClick={() => pick(color.key)}
                title={color.label}
                aria-label={color.label}
                className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                  color.key === currentKey
                    ? "border-ink ring-1 ring-ink"
                    : "border-hairline-strong"
                }`}
                style={{ backgroundColor: color.accent }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
