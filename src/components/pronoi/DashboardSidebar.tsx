"use client";

import {
  Activity,
  Handshake,
  LayoutGrid,
  ListChecks,
  Menu,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AgentIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";
import { useCopilotUiOptional } from "@/lib/pronoi/copilotUi";
import { COMPANY } from "@/lib/pronoi/demoData";
import { useVoiceDemoOptional } from "@/lib/pronoi/voice/voiceDemoContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutGrid },
      { href: "/dashboard/decisions", label: "Decisions", icon: ListChecks },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/inventory", label: "Inventory", icon: Package },
      { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/pooling", label: "Pooling", icon: Handshake },
      { href: "/dashboard/simulation", label: "Simulation", icon: Activity },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function WorkspaceCard() {
  const initials = COMPANY.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="mx-4 flex items-center gap-3 rounded-xl bg-[#F5F4F1] px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-black">{COMPANY.name}</p>
        <p className="text-xs text-gray-500">{COMPANY.city}</p>
      </div>
    </div>
  );
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
        active ? "bg-black text-white" : "text-gray-600 hover:bg-black/5 hover:text-black"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const copilotUi = useCopilotUiOptional();
  const voiceDemo = useVoiceDemoOptional();

  return (
    <>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wide text-gray-400 uppercase">{section.label}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-black/5 px-4 py-4">
        <button
          type="button"
          onClick={() => copilotUi?.setOpen(true)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-black/5 hover:text-black"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 via-amber-200 to-emerald-200">
            <AgentIcon className="h-2 w-2 text-black/60" />
          </span>
          PRONOI Copilot
        </button>
        {voiceDemo && (
          <button
            type="button"
            onClick={voiceDemo.resetAll}
            disabled={voiceDemo.isResetting}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {voiceDemo.isResetting ? "Resetting…" : "Reset demo"}
          </button>
        )}
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-black/5 hover:text-black"
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Admin panel
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-black/5 hover:text-black"
        >
          Exit to site
        </Link>
      </div>
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-black/5 bg-white lg:flex">
        <div className="px-5 py-5">
          <Link href="/dashboard" aria-label="PRONOI dashboard">
            <PronoiLogo />
          </Link>
        </div>
        <WorkspaceCard />
        <SidebarNav pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="PRONOI dashboard">
          <PronoiLogo />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-black/5"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Link href="/dashboard" aria-label="PRONOI dashboard" onClick={() => setMobileOpen(false)}>
                <PronoiLogo />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-black/5"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <WorkspaceCard />
            <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
