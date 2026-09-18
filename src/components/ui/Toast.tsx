"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, Undo2 } from "lucide-react";

export interface ToastOptions {
  message: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  /** Bagian E.3.1: aksi yang bisa dibatalkan dijalankan langsung, lalu
   *  ditawarkan Undo ~8 detik — bukan dialog konfirmasi di setiap aksi. */
  onUndo?: () => void | Promise<void>;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<{ show: (o: ToastOptions) => void } | null>(
  null,
);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  }
  return ctx;
}

const TONE_ACCENT: Record<NonNullable<ToastOptions["tone"]>, string> = {
  neutral: "bg-ink-faint",
  success: "bg-status-ready",
  warning: "bg-status-attention",
  danger: "bg-status-blocked",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      // Undo needs a longer window than a plain notification.
      const duration = options.durationMs ?? (options.onUndo ? 8000 : 4000);
      setToasts((prev) => [...prev, { ...options, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 overflow-hidden rounded-xl border border-hairline-strong bg-surface-overlay/95 px-4 py-3 shadow-2xl backdrop-blur-md [animation:toast-in_220ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_ACCENT[toast.tone ?? "neutral"]}`}
            />
            <p className="min-w-0 flex-1 text-[12.5px] text-ink">
              {toast.message}
            </p>
            {toast.onUndo && (
              <button
                onClick={async () => {
                  dismiss(toast.id);
                  await toast.onUndo!();
                }}
                className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-accent-teal hover:underline"
              >
                <Undo2 size={13} strokeWidth={2} />
                Urungkan
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="shrink-0 text-ink-faint transition-colors hover:text-ink"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
