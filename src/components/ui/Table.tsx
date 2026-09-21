import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-x-auto rounded-xl border border-hairline"><table {...props} className={cn("w-full min-w-[640px] border-collapse text-[13px]", className)} /></div>;
}
export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cn("bg-surface-elevated text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint", props.className)} />;
}
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} className={cn("divide-y divide-hairline", props.className)} />; }
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} className={cn("transition-colors duration-100 hover:bg-surface/60 data-[selected=true]:bg-surface-focus", className)} />;
}
export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={cn("h-10 whitespace-nowrap px-4 text-left font-medium", className)} />;
}
export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn("h-11 px-4 align-middle text-ink-muted", className)} />;
}
export function TableActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-1", className)}>{children}</div>;
}
