import Link from "next/link";
import type { DiagnosticIssue } from "@/lib/domain/diagnostic";

export function IssueList({ issues }: { issues: DiagnosticIssue[] }) {
  if (issues.length === 0) return null;

  const visible = issues.slice(0, 3);
  const remaining = issues.length - visible.length;

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5">
      <h2 className="text-[13.5px] font-medium text-ink">Perlu Dicek</h2>
      <ul className="mt-3 space-y-3">
        {visible.map((issue, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                issue.severity === "blocked"
                  ? "bg-status-blocked"
                  : "bg-status-attention"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[13px] text-ink-muted">{issue.message}</p>
              <Link
                href={issue.href}
                className="text-[12px] text-accent-teal hover:underline"
              >
                {issue.actionLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="mt-3 text-[12px] text-ink-faint">
          +{remaining} lainnya
        </p>
      )}
    </div>
  );
}
