"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import {
  IconGuru,
  IconMapel,
  IconKelas,
  IconRuang,
  IconBebanMengajar,
  IconJadwal,
  IconAbsensi,
  IconLaporan,
  IconRiwayat,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import { MegaMendung } from "@/components/shell/MegaMendung";
import * as Tooltip from "@radix-ui/react-tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const CORE_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
];

const DATA_ITEMS: NavItem[] = [
  { href: "/guru", label: "Guru", icon: IconGuru },
  { href: "/mapel", label: "Mapel", icon: IconMapel },
  { href: "/kelas", label: "Kelas", icon: IconKelas },
  { href: "/ruang", label: "Ruang", icon: IconRuang },
  { href: "/beban-mengajar", label: "Beban Mengajar", icon: IconBebanMengajar },
  { href: "/import", label: "Import / Sinkronisasi", icon: Upload },
];

const OPERATIONAL_ITEMS: NavItem[] = [
  { href: "/jadwal", label: "Jadwal", icon: IconJadwal },
  { href: "/absensi", label: "Absensi", icon: IconAbsensi },
  { href: "/laporan", label: "Laporan", icon: IconLaporan },
  { href: "/riwayat", label: "Riwayat", icon: IconRiwayat },
];

const JADWAL_SUBMENU: NavItem[] = [
  { href: "/jadwal", label: "Kanvas Jadwal", icon: IconJadwal },
  { href: "/jadwal/struktur-waktu", label: "Struktur Waktu", icon: Clock },
  { href: "/jadwal/aturan", label: "Aturan", icon: SlidersHorizontal },
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

function NavRowLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150",
        collapsed && "justify-center px-0",
        active ? "bg-surface/70 text-ink" : "text-ink-muted hover:bg-surface/40 hover:text-ink",
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
    </Link>
  );
}

/**
 * Tooltip Radix (Bagian §1 UI_WORKFLOW.md) menggantikan tooltip custom lama
 * yang cuma `opacity` CSS di hover — versi ini punya focus-visible,
 * escape-to-dismiss, dan positioning yang otomatis menghindar tepi layar,
 * gratis dari library yang sudah diuji jutaan pengguna, bukan ditulis ulang.
 * Cuma dipasang saat collapsed — saat expanded label sudah kelihatan.
 */
function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  if (!collapsed) {
    return <NavRowLink item={item} active={active} collapsed={collapsed} />;
  }

  return (
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger asChild>
        <span>
          <NavRowLink item={item} active={active} collapsed={collapsed} />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={10}
          className="z-50 rounded-md border border-hairline-strong bg-surface-overlay px-2.5 py-1.5 text-[12px] text-ink shadow-lg [animation:drawer-fade-in_120ms_ease-out]"
        >
          {item.label}
          <Tooltip.Arrow className="fill-surface-overlay" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
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
    <Tooltip.Provider delayDuration={200}>
    <aside
      className={cn(
        "relative hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-hairline bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[var(--shell-sidebar-collapsed)]" : "w-[var(--shell-sidebar-expanded)]",
      )}
    >
      {/* Digital Heritage Layer — Mega Mendung di pojok bawah sidebar
          (Bagian E.1.7 area 1). Boleh sedikit lebih tegas di sini karena
          tidak ada teks panjang. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden">
        <MegaMendung variant="sidebar" />
      </div>

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

        <div>
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10.5px] font-medium tracking-wide text-ink-faint">
              OPERASIONAL
            </div>
          )}
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
    </Tooltip.Provider>
  );
}


export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("sakala:open-mobile-nav", onOpen);
    return () => window.removeEventListener("sakala:open-mobile-nav", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  const sections = [
    { label: null, items: CORE_ITEMS },
    { label: "DATA", items: DATA_ITEMS },
    { label: null, items: OPERATIONAL_ITEMS },
  ];

  return (
    <Tooltip.Provider delayDuration={200}>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Tutup navigasi"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={close}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col border-r border-hairline bg-sidebar shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-teal to-champagne text-[13px] font-semibold text-canvas">S</div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[13.5px] font-semibold tracking-tight text-ink">SAKALA</span>
                  <span className="text-[10.5px] text-ink-faint">V3</span>
                </div>
              </div>
              <button onClick={close} aria-label="Tutup navigasi" className="rounded-lg p-2 text-ink-faint hover:text-ink">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
              {sections.map((section) => (
                <div key={section.label ?? "core"}>
                  {section.label && (
                    <div className="px-3 pb-1.5 text-[10.5px] font-medium tracking-wide text-ink-faint">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          className={cn(
                            "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px]",
                            active ? "text-ink" : "text-ink-muted hover:text-ink",
                          )}
                        >
                          <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {section.items === OPERATIONAL_ITEMS && pathname.startsWith("/jadwal") && (
                    <div className="ml-[26px] mt-1 space-y-0.5 border-l border-hairline pl-3">
                      {JADWAL_SUBMENU.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={close}
                          className={cn(
                            "block rounded-md px-2.5 py-2 text-[12.5px]",
                            (sub.href === "/jadwal" ? pathname === "/jadwal" : pathname.startsWith(sub.href))
                              ? "text-ink"
                              : "text-ink-faint hover:text-ink-muted",
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="border-t border-hairline p-3">
              <Link
                href="/settings"
                onClick={close}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-ink-muted hover:text-ink"
              >
                <Settings size={18} strokeWidth={1.75} />
                Settings
              </Link>
            </div>
          </aside>
        </div>
      )}
    </Tooltip.Provider>
  );
}
