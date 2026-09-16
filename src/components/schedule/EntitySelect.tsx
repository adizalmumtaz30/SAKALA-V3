"use client";

import { useRouter } from "next/navigation";

interface Option {
  id: string;
  name: string;
}

export function EntitySelect({
  view,
  options,
  selectedId,
}: {
  view: string;
  options: Option[];
  selectedId: string | undefined;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => router.push(`/jadwal?view=${view}&entity=${e.target.value}`)}
      className="rounded-lg border border-hairline-strong bg-surface px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent-teal"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
