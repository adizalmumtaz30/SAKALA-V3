import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";
import {
  getWorkspaceAcademicYear,
  listAcademicYears,
} from "@/lib/data-access/academic-year";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { loadCommandItems } from "@/lib/application/command-palette";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SAKALA V3",
  description: "Sistem penjadwalan sekolah — operator workspace.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const school = await getPrimarySchool(supabase).catch(() => null);
  const [academicYear, academicYears] = await Promise.all([
    getWorkspaceAcademicYear(supabase).catch(() => null),
    school ? listAcademicYears(supabase, school.id).catch(() => []) : Promise.resolve([]),
  ]);

  // Bagian F.3 — data palette dimuat sekali di shell, lalu difilter di klien.
  const commandItems = await loadCommandItems(
    supabase,
    academicYear?.id ?? null,
  ).catch(() => []);

  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">
        <ToastProvider>
          <AppShell school={school} academicYear={academicYear} academicYears={academicYears}>
            {children}
          </AppShell>
          <CommandPalette items={commandItems} />
        </ToastProvider>
      </body>
    </html>
  );
}
