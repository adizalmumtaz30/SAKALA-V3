"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DeleteBebanMengajarButtonProps {
  id: string;
  label: string;
  meta: string;
  hasScheduleEntries?: boolean;
}

export function DeleteBebanMengajarButton({
  id,
  label,
  meta,
  hasScheduleEntries = false,
}: DeleteBebanMengajarButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function handleDelete() {
    setConfirming(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);

      const response = await fetch("/api/beban-mengajar/delete", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { error?: string; success?: string };

      if (result.error) {
        show({ message: result.error, tone: "warning" });
        return;
      }

      show({ message: result.success ?? "Beban mengajar dihapus.", tone: "success" });
      window.location.reload();
    });
  }

  const impactLines = [
    `${label} — ${meta} akan dihapus permanen dari Beban Mengajar.`
    ...(hasScheduleEntries ? ["Jadwal yang memakai beban ini juga akan ikut terhapus."] : []),
    "Tindakan ini tidak dapat di-undo.",
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={`Hapus ${label}`}
        title="Hapus beban mengajar"
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-status-blocked/10 hover:text-status-blocked disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.75} />
      </button>

      {confirming && (
        <ConfirmDialog
          title={`Hapus ${label}?`}
          impactLines={impactLines}
          confirmLabel="Hapus Permanen"
          tone="danger"
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
