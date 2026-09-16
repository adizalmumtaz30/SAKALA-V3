import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getPrimarySchool } from "@/lib/data-access/school";
import {
  getWorkspaceAcademicYear,
  listAcademicYears,
} from "@/lib/data-access/academic-year";

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

  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">
        <AppShell school={school} academicYear={academicYear} academicYears={academicYears}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
