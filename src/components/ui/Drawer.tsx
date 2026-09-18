"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Context Drawer (Bagian 71-72, doc 3; 10.10.23-26, doc 6 — LOCKED pattern).
 * A click on an entity opens a panel beside the workspace, not a new page —
 * the surrounding context (list, filters, scroll position) is never lost.
 */
export function Drawer({ title, onClose, children }: DrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm [animation:drawer-fade-in_200ms_ease-out]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface-overlay/95 shadow-2xl backdrop-blur-xl [animation:drawer-slide-in_260ms_ease-out]">
        <div className="flex shrink-0 items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-[14px] font-medium text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-ink-faint hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
