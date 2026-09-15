export function StatusBadge({ status }: { status: "active" | "inactive" }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${
        isActive ? "text-status-ready" : "text-ink-faint"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-status-ready" : "bg-ink-faint"
        }`}
      />
      {isActive ? "Aktif" : "Nonaktif"}
    </span>
  );
}
