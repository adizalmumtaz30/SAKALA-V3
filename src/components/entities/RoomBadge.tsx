import { IconRuang } from "@/components/icons";

export function RoomBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
      <IconRuang size={13} strokeWidth={1.75} className="shrink-0 text-ink-faint" />
      {name}
    </span>
  );
}
