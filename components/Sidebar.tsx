"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  TrendingDown,
  Settings,
  LogOut,
  Activity,
  Tractor,
  FileBarChart,
  Archive,
  Users,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import henIcon from "@/public/hen.svg";

const HenIcon = ({ className }: { className?: string }) => {
  return (
    <span
      className={`relative block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
    >
      <Image
        src={henIcon}
        alt="Hen"
        fill
        sizes="18px"
        className="object-contain dark:brightness-0 dark:invert"
      />
    </span>
  );
};

// --- NEW: TypeScript Definitions ---
type NavItem = {
  name: string;
  href?: string; // Optional (not needed if it has subItems)
  icon: any;
  subItems?: {
    // Optional (only for dropdowns)
    name: string;
    href: string;
    icon: any;
  }[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};
// ----------------------------------

// Apply the NavGroup type to our arrays
const ownerGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Farm Setup", href: "/farms", icon: Tractor },
      { name: "Chick Loading", href: "/production/loading", icon: HenIcon },
      {
        name: "Daily Monitoring",
        href: "/production/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Expenses", href: "/expenses", icon: TrendingDown },
      { name: "Master Reports", href: "/reports", icon: FileBarChart },
      { name: "Historical Ledger", href: "/reports/history", icon: Archive },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Settings",
        icon: Settings,
        subItems: [
          { name: "User Management", href: "/settings", icon: Users },
          { name: "System Logs", href: "/settings/logs", icon: ShieldAlert },
        ],
      },
    ],
  },
];

const staffGroups: NavGroup[] = [
  {
    label: "Farm Duties",
    items: [
      {
        name: "Daily Monitoring",
        href: "/production/monitoring",
        icon: Activity,
      },
      { name: "Expenses", href: "/expenses", icon: TrendingDown },
    ],
  },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const navGroups = role === "owner" ? ownerGroups : staffGroups;

  const [isSettingsOpen, setIsSettingsOpen] = useState(
    pathname.startsWith("/settings"),
  );

  return (
    <div className="w-[260px] border-r border-border/40 bg-card hidden md:flex flex-col h-full shadow-sm z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/40 hover:bg-secondary/20 transition-colors cursor-pointer">
        <div className="relative h-8 w-8 mr-3 shrink-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Otso Poultry Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <span className="font-bold text-lg tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Otso Poultry
        </span>
      </div>

      {/* Navigation Links with Category Headers */}
      <div className="flex-1 py-6 flex flex-col gap-6 px-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
              {group.label}
            </h3>

            {group.items.map((item) => {
              // IF THIS ITEM HAS SUB-ITEMS
              if (item.subItems) {
                const isAnySubActive = pathname.startsWith("/settings");

                return (
                  <div key={item.name} className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group w-full ${
                        isAnySubActive
                          ? "text-slate-900 font-bold dark:text-white"
                          : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isSettingsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isSettingsOpen && (
                      <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-border/50 ml-5 animate-in slide-in-from-top-2 fade-in duration-200">
                        {item.subItems.map((subItem) => {
                          const isStrictActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                isStrictActive
                                  ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
                                  : "text-muted-foreground hover:text-slate-900 text-sm font-medium dark:hover:text-white"
                              }`}
                            >
                              <subItem.icon
                                className={`h-4 w-4 ${
                                  isStrictActive
                                    ? "text-slate-900 dark:text-white"
                                    : ""
                                }`}
                              />
                              <span className="text-[13px]">
                                {subItem.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // NORMAL ITEMS
              // TypeScript now knows href is potentially undefined, so we use a fallback to safely check it
              const itemHref = item.href || "";
              const isActive =
                pathname === itemHref ||
                (pathname.startsWith(itemHref + "/") &&
                  itemHref !== "/reports");
              const isStrictActive =
                itemHref === "/" ? pathname === "/" : isActive;

              return (
                <Link
                  key={item.name}
                  href={itemHref}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isStrictActive
                      ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${
                      isStrictActive ? "text-slate-900 dark:text-white" : ""
                    }`}
                  />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border/40 bg-card/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-500 font-medium transition-colors group"
        >
          <LogOut className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Log out securely</span>
        </button>
      </div>
    </div>
  );
}
