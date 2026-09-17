import { PageHeader } from "@/components/ui/PageHeader";
import { ImportTeachersForm } from "@/components/import/ImportTeachersForm";

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Import / Sinkronisasi"
        description="Saat ini mendukung import Guru dari CSV. Entity lain menyusul dengan alur yang sama."
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <h2 className="mb-3 text-[13px] font-medium text-ink">Import Guru</h2>
        <ImportTeachersForm />
      </div>
    </div>
  );
}
