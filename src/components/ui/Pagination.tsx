import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
export function Pagination({ page, pageCount, onPageChange, total, from, to, className }: { page:number; pageCount:number; onPageChange:(page:number)=>void; total?:number; from?:number; to?:number; className?:string }) {
  if (pageCount <= 1 && total == null) return null;
  const pages = Array.from({length: pageCount}, (_, i) => i + 1).filter(p => p === 1 || p === pageCount || Math.abs(p-page) <= 1);
  return <div className={cn("flex items-center justify-between gap-4 pt-3", className)}>
    <p className="text-[12px] text-ink-faint">{total != null && from != null && to != null ? `Menampilkan ${from}–${to} dari ${total}` : `${page} / ${pageCount}`}</p>
    <div className="flex items-center gap-1">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page-1)} aria-label="Halaman sebelumnya" className="sakala-focus-ring rounded-md p-1.5 text-ink-muted hover:bg-surface-elevated disabled:opacity-35"><ChevronLeft size={16}/></button>
      {pages.map((p,i) => <span key={p}>{i>0 && pages[i-1]!==p-1 ? <span className="px-1 text-ink-faint">…</span> : null}<button type="button" aria-current={p===page ? "page" : undefined} onClick={() => onPageChange(p)} className={cn("sakala-focus-ring min-w-8 rounded-md px-2 py-1.5 text-[12px]", p===page ? "bg-surface-focus text-ink" : "text-ink-muted hover:bg-surface-elevated")}>{p}</button></span>)}
      <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page+1)} aria-label="Halaman berikutnya" className="sakala-focus-ring rounded-md p-1.5 text-ink-muted hover:bg-surface-elevated disabled:opacity-35"><ChevronRight size={16}/></button>
    </div>
  </div>;
}
