"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ToggleStatusButtonProps {
  id: string;
  status: "active" | "inactive";
  action: (formData: FormData) => Promise<void>;
  /** Nama entitas untuk pesan toast/dialog, mis. "Guru Ahmad". */
  label?: string;
  /**
   * Dependency nyata yang sudah dihitung diagnostics (Bagian E.2.1).
   * Kalau terisi DAN aksinya menonaktifkan, dialog konfirmasi muncul
   * dengan dampak konkret — bukan "Apakah Anda yakin?" generik.
   */
  dependencyWarnings?: string[];
}

export function ToggleStatusButton({
  id,
  status,
  action,
  label,
  dependencyWarnings = [],
}: ToggleStatusButtonProps) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const { show } = useToast();

  const isDeactivating = status === "active";
  const subject = label ?? "Data";

  function run(nextFromStatus: "active" | "inactive", withUndo: boolean) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("status", nextFromStatus);
      await action(formData);

      if (withUndo) {
        show({
          message: `${subject} ${nextFromStatus === "active" ? "dinonaktifkan" : "diaktifkan"}`,
          tone: nextFromStatus === "active" ? "warning" : "success",
          onUndo: () => run(nextFromStatus === "active" ? "inactive" : "active", false),
        });
      } else {
        show({ message: `Perubahan ${subject} diurungkan`, tone: "neutral" });
      }
    });
  }

  function handleClick() {
    // Aksi ini reversible, jadi defaultnya langsung jalan + Undo (E.3.1).
    // Konfirmasi HANYA kalau ada dependency nyata yang terdampak (E.2.1).
    if (isDeactivating && dependencyWarnings.length > 0) {
      setConfirming(true);
      return;
    }
    run(status, true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-[12px] text-ink-muted underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-ink disabled:opacity-50"
      >
        {pending ? "…" : isDeactivating ? "Nonaktifkan" : "Aktifkan"}
      </button>

      {confirming && (
        <ConfirmDialog
          title={`Nonaktifkan ${subject}?`}
          impactLines={dependencyWarnings}
          confirmLabel="Tetap Nonaktifkan"
          tone="warning"
          pending={pending}
          onConfirm={() => {
            setConfirming(false);
            run(status, true);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
