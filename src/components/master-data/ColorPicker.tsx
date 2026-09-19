"use client";

import { useTransition } from "react";
import * as Popover from "@radix-ui/react-popover";
import { setSubjectColorAction } from "@/lib/application/master-data.actions";
import {
  paletteForCount,
  getIdentityColor,
} from "@/lib/domain/identity-color";
import { useToast } from "@/components/ui/Toast";

/**
 * Radix Popover (UI_WORKFLOW.md) menggantikan implementasi click-outside +
 * Escape manual sebelumnya — logic dismiss/focus-management sekarang milik
 * library yang sudah teruji, bukan kode tulisan sendiri yang gampang
 * ketinggalan kasus tepi (mis. dua ColorPicker terbuka bersamaan).
 */
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
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const palette = paletteForCount(totalSubjects);
  const current = getIdentityColor(currentKey);

  function pick(colorKey: string) {
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
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={`Ubah warna identitas ${subjectName}`}
          title={current ? `Warna: ${current.label}` : "Pilih warna identitas"}
          className="h-6 w-6 rounded-md border border-hairline-strong transition-transform hover:scale-110 disabled:opacity-50"
          style={{ backgroundColor: current?.accent ?? "transparent" }}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-56 rounded-xl border border-hairline-strong bg-surface-overlay/95 p-2.5 shadow-2xl backdrop-blur-md [animation:drawer-fade-in_150ms_ease-out]"
        >
          <p className="mb-2 px-0.5 text-[11px] text-ink-faint">
            Warna identitas {subjectName}
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {palette.map((color) => (
              <Popover.Close key={color.key} asChild>
                <button
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
              </Popover.Close>
            ))}
          </div>
          <Popover.Arrow className="fill-surface-overlay" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
