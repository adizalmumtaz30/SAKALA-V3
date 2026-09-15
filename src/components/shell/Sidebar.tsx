"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  BookOpen,
  LayoutGrid,
  DoorOpen,
  Scale,
  Upload,
  CalendarDays,
  CheckSquare,
  FileText,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const CORE_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
];

const DATA_ITEMS: NavItem[] = [
  { href: "/guru", label: "Guru", icon: Users },
  { href: "/mapel", label: "Mapel", icon: BookOpen },
  { href: "/kelas", label: "Kelas", icon: LayoutGrid },
  { href: "/ruang", label: "Ruang", icon: DoorOpen },
  { href: "/beban-mengajar", label: "Beban Mengajar", icon: Scale },
  { href: "/import", label: "Import / Sinkronisasi", icon: Upload },
];

const OPERATIONAL_ITEMS: NavItem[] = [
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/absensi", label: "Absensi", icon: CheckSquare },
  { href: "/laporan", label: "Laporan", icon: FileText },
  { href: "/riwayat", label: "Riwayat", icon: History },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150",
        active ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent-teal transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon size={17} strokeWidth={1.75} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ hasAttention }: { hasAttention?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-dvh w-[248px] shrink-0 flex-col overflow-hidden border-r border-hairline bg-sidebar">
      {/* Atmospheric heritage layer — extremely subtle, discovered not displayed */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-[0.04]"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 100%, var(--color-accent-teal), transparent 60%)",
        }}
      />

      <div className="relative flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-teal to-champagne text-[13px] font-semibold text-canvas">
          S
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13.5px] font-semibold tracking-tight text-ink">
            SAKALA
          </span>
          <span className="text-[10.5px] text-ink-faint">V3</span>
        </div>
      </div>

      <nav className="relative flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {CORE_ITEMS.map((item) => (
            <NavRow key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </div>

        <div>
          <div className="px-3 pb-1.5 text-[10.5px] font-medium tracking-wide text-ink-faint">
            DATA
          </div>
          <div className="space-y-0.5">
            {DATA_ITEMS.map((item) => (
              <NavRow key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </div>
        </div>

        <div className="space-y-0.5">
          {OPERATIONAL_ITEMS.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
          {hasAttention && (
            <div className="px-3 pt-0.5">
              <span className="text-[10.5px] text-status-incomplete">
                • Perlu dicek
              </span>
            </div>
          )}
        </div>
      </nav>

      <div className="relative border-t border-hairline px-3 py-3">
        <NavRow
          item={{ href: "/settings", label: "Settings", icon: Settings }}
          active={isActive(pathname, "/settings")}
        />
      </div>
    </aside>
  );
}
