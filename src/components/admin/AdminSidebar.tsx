"use client";

import {
  Boxes,
  Building2,
  LayoutGrid,
  LineChart,
  ListChecks,
  Map,
  Menu,
  Tag,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PronoiLogo } from "@/components/sites/handhold-io-1ee60dfc/shared/PronoiLogo";
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
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/categories", label: "Product Categories", icon: Tag },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
      { href: "/admin/rules", label: "Auto-order Rules", icon: ListChecks },
      { href: "/admin/business-types", label: "Business Types", icon: Boxes },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: Building2 },
      { href: "/admin/analytics", label: "Analytics", icon: LineChart },
      { href: "/admin/regions", label: "Regions", icon: Map },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function AdminBadge() {
  return (
    <div className="mx-4 flex items-center gap-3 rounded-xl bg-[#F5F4F1] px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">A</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-black">PRONOI Admin</p>
        <p className="text-xs text-gray-500">Demo admin access</p>
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
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-black/5 hover:text-black"
        >
          Back to Business Dashboard
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-black/5 bg-white lg:flex">
        <div className="px-5 py-5">
          <Link href="/admin" aria-label="PRONOI admin">
            <PronoiLogo />
          </Link>
        </div>
        <AdminBadge />
        <SidebarNav pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" aria-label="PRONOI admin">
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

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Link href="/admin" aria-label="PRONOI admin" onClick={() => setMobileOpen(false)}>
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
            <AdminBadge />
            <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
