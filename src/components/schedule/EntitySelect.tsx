"use client";

import { useRouter } from "next/navigation";
import { SmartSelect } from "@/components/ui/SmartSelect";

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
    <div className="w-56">
      <SmartSelect
        options={options}
        value={selectedId ?? ""}
        onChange={(id) => router.push(`/jadwal?view=${view}&entity=${id}`)}
      />
    </div>
  );
}
