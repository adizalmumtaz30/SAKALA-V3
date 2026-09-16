"use client";

import { useSyncExternalStore } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
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

const JADWAL_SUBMENU: NavItem[] = [
  { href: "/jadwal", label: "Kanvas Jadwal", icon: CalendarDays },
  { href: "/jadwal/struktur-waktu", label: "Struktur Waktu", icon: Clock },
];

const COLLAPSE_STORAGE_KEY = "sakala:sidebar-collapsed";

// Module-level external store: keeps localStorage as the single source of
// truth and lets useSyncExternalStore render the correct value on first
// client paint without a hydration-mismatch flash or a setState-in-effect.
const collapseListeners = new Set<() => void>();

function getCollapsedSnapshot() {
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

function getCollapsedServerSnapshot() {
  return false;
}

function subscribeCollapsed(callback: () => void) {
  collapseListeners.add(callback);
  return () => collapseListeners.delete(callback);
}

function setCollapsedStore(value: boolean) {
  localStorage.setItem(COLLAPSE_STORAGE_KEY, value ? "1" : "0");
  collapseListeners.forEach((listener) => listener());
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150",
        collapsed && "justify-center px-0",
        active ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent-teal transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon size={17} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-hairline-strong bg-surface-overlay px-2.5 py-1.5 text-[12px] text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ hasAttention }: { hasAttention?: boolean }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  function toggleCollapsed() {
    setCollapsedStore(!collapsed);
  }

  const showJadwalSubmenu = !collapsed && pathname.startsWith("/jadwal");

  return (
    <aside
      className={cn(
        "relative flex h-dvh shrink-0 flex-col overflow-hidden border-r border-hairline bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      {/* Atmospheric heritage layer — extremely subtle, discovered not displayed */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-[0.04]"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 100%, var(--color-accent-teal), transparent 60%)",
        }}
      />

      <div
        className={cn(
          "relative flex items-center gap-2.5 px-5 pt-6 pb-5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-teal to-champagne text-[13px] font-semibold text-canvas">
          S
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[13.5px] font-semibold tracking-tight text-ink">
              SAKALA
            </span>
            <span className="text-[10.5px] text-ink-faint">V3</span>
          </div>
        )}
      </div>

      <nav className={cn("relative flex-1 space-y-5 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}>
        <div className="space-y-0.5">
          {CORE_ITEMS.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div>
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10.5px] font-medium tracking-wide text-ink-faint">
              DATA
            </div>
          )}
          <div className="space-y-0.5">
            {DATA_ITEMS.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>

        <div className="space-y-0.5">
          {OPERATIONAL_ITEMS.map((item) => (
            <div key={item.href}>
              <NavRow
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
              />
              {item.href === "/jadwal" && showJadwalSubmenu && (
                <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-hairline pl-3">
                  {JADWAL_SUBMENU.map((sub) => {
                    const subActive =
                      sub.href === "/jadwal"
                        ? pathname === "/jadwal"
                        : pathname.startsWith(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "block rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150",
                          subActive
                            ? "text-ink"
                            : "text-ink-faint hover:text-ink-muted",
                        )}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {hasAttention && !collapsed && (
            <div className="px-3 pt-0.5">
              <span className="text-[10.5px] text-status-incomplete">
                • Perlu dicek
              </span>
            </div>
          )}
        </div>
      </nav>

      <div className={cn("relative border-t border-hairline py-3", collapsed ? "px-2" : "px-3")}>
        <NavRow
          item={{ href: "/settings", label: "Settings", icon: Settings }}
          active={isActive(pathname, "/settings")}
          collapsed={collapsed}
        />
        <button
          onClick={toggleCollapsed}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] text-ink-faint transition-colors hover:text-ink-muted",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronsRight size={16} strokeWidth={1.75} />
          ) : (
            <>
              <ChevronsLeft size={16} strokeWidth={1.75} />
              <span>Ciutkan</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
