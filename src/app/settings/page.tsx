import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";
import { SchoolProfileForm } from "@/components/settings/SchoolProfileForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SettingsPage() {
  const supabase = await createClient();
  const school = await getPrimarySchool(supabase);

  if (!school) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-[18px] font-semibold text-ink">
          Sekolah belum diatur
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-accent-teal px-4 py-2 text-[13px] font-medium text-accent-teal-ink"
        >
          Ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <PageHeader kicker="SETTINGS" title="Profil Sekolah" />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <SchoolProfileForm school={school} />
      </div>
    </div>
  );
}
