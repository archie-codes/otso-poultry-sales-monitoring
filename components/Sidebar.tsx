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
  Package,
  Warehouse,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import henIcon from "@/public/hen.svg";
import { cn } from "@/lib/utils";

const HenIcon = ({ className }: { className?: string }) => {
  return (
    <span className={cn("relative block h-[18px] w-[18px] shrink-0", className)}>
      <span
        className="absolute inset-0 bg-current transition-colors duration-200"
        style={{
          WebkitMaskImage: `url(${henIcon.src})`,
          maskImage: `url(${henIcon.src})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </span>
  );
};

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  subItems?: {
    name: string;
    href: string;
    icon: any;
  }[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

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
      {
        name: "Feed Inventory",
        icon: Package,
        subItems: [
          { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
          {
            name: "Building Stocks",
            href: "/inventory/building-stocks",
            icon: Building2,
          },
        ],
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
      {
        name: "Feed Inventory",
        icon: Package,
        subItems: [
          { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
          {
            name: "Building Stocks",
            href: "/inventory/building-stocks",
            icon: Building2,
          },
        ],
      },
    ],
  },
];

export default function Sidebar({
  role,
  isExpanded,
  setIsExpanded,
}: {
  role: string;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const navGroups = role === "owner" ? ownerGroups : staffGroups;

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Settings: pathname.startsWith("/settings"),
    "Feed Inventory": pathname.startsWith("/inventory"),
  });

  const toggleMenu = (name: string) => {
    if (!isExpanded) setIsExpanded(true);
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full z-20 transition-all duration-300 ease-in-out relative border-r border-slate-200/60 dark:border-[#1e293b]/80",
        "bg-background dark:bg-[#0B1121]", // Premium pale sage/emerald for light, deep navy for dark
        isExpanded ? "w-[260px]" : "w-[80px]",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-border hover:bg-muted/50 transition-colors cursor-pointer shrink-0 overflow-hidden",
          isExpanded ? "px-6" : "px-0 justify-center",
        )}
      >
        <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>
        <span
          className={cn(
            "font-black text-lg tracking-tight text-foreground transition-opacity duration-300 whitespace-nowrap ml-3 drop-shadow-sm",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden",
          )}
        >
          Otso Poultry
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 w-full">
            {/* Category Header */}
            {isExpanded ? (
              <h3 className="px-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 truncate transition-opacity duration-300">
                {group.label}
              </h3>
            ) : (
              <div className="h-4 flex justify-center mb-1">
                <div className="w-4 h-0.5 bg-border rounded-full" />
              </div>
            )}

            <div className="px-3 flex flex-col gap-1">
              {group.items.map((item) => {
                const itemHref = item.href || "";
                const isActive =
                  pathname === itemHref ||
                  (pathname.startsWith(itemHref + "/") &&
                    itemHref !== "/reports");
                const isStrictActive =
                  itemHref === "/" ? pathname === "/" : isActive;
                const isMenuOpen = openMenus[item.name];

                if (item.subItems) {
                  const isAnySubActive = item.subItems.some(
                    (sub) =>
                      pathname === sub.href ||
                      pathname.startsWith(sub.href + "/"),
                  );

                  return (
                    <div key={item.name} className="flex flex-col gap-1 w-full">
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                          "flex items-center py-2.5 rounded-xl transition-all duration-200 group w-full outline-none",
                          isExpanded
                            ? "px-4 justify-between"
                            : "px-0 justify-center",
                          isAnySubActive
                            ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold shadow-md"
                            : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium",
                        )}
                        title={!isExpanded ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                              isAnySubActive
                                ? "text-white dark:text-indigo-400"
                                : "opacity-90 group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
                            )}
                          />
                          {isExpanded && (
                            <span className="text-sm truncate transition-transform duration-300 group-hover:translate-x-1">
                              {item.name}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200 opacity-70",
                              isMenuOpen
                                ? "rotate-180 text-white dark:text-indigo-400"
                                : "group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
                            )}
                          />
                        )}
                      </button>

                      {/* Sub Items */}
                      {isExpanded && isMenuOpen && (
                        <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-border ml-6 animate-in slide-in-from-top-2 fade-in duration-200">
                          {item.subItems.map((subItem) => {
                            const subStrictActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                  subStrictActive
                                    ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold shadow-md"
                                    : "text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-300 text-sm font-medium hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10",
                                )}
                              >
                                <subItem.icon className="h-3.5 w-3.5" />
                                <span className="text-[13px] truncate transition-transform duration-300 group-hover:translate-x-1">
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

                // Normal Links
                return (
                  <Link
                    key={item.name}
                    href={itemHref}
                    className={cn(
                      "flex items-center py-2.5 rounded-xl transition-all duration-200 group relative border",
                      isExpanded ? "px-4" : "px-0 justify-center",
                      isStrictActive
                        ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold border-indigo-500 dark:border-indigo-500/30 shadow-md"
                        : "border-transparent text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium",
                    )}
                    title={!isExpanded ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isStrictActive
                          ? "text-white dark:text-indigo-400"
                          : "opacity-90 group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
                      )}
                    />
                    {isExpanded && (
                      <span className="text-sm ml-3 truncate transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                    )}

                    {/* Active Indicator Dot (Only shows when collapsed) */}
                    {!isExpanded && isStrictActive && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-indigo-400 rounded-full shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-border bg-muted/30 flex flex-col gap-2 shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors py-2 rounded-xl group",
            isExpanded ? "px-4 justify-between" : "justify-center",
          )}
        >
          {isExpanded ? (
            <>
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Collapse Menu
              </span>
              <ChevronLeft className="h-4 w-4" />
            </>
          ) : (
            <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-medium transition-colors group border border-transparent hover:border-destructive/20",
            isExpanded ? "px-4 w-full" : "justify-center",
          )}
          title={!isExpanded ? "Log Out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
          {isExpanded && (
            <span className="text-sm truncate">Log out securely</span>
          )}
        </button>
      </div>
    </div>
  );
}
