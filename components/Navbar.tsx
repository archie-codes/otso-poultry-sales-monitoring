"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import henIcon from "@/public/hen.svg";

import {
  Moon,
  Sun,
  Menu,
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
  LineChart,
  Warehouse,
  Building2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

import NotificationBell from "./NotificationBell";
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

// ---> UPGRADED NAVIGATION GROUPS <---
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

export default function Navbar({
  userId,
  userName,
  role,
  imageUrl,
}: {
  userId?: string;
  userName?: string;
  role?: string;
  imageUrl?: string;
}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Settings: pathname.startsWith("/settings"),
    "Feed Inventory": pathname.startsWith("/inventory"),
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const navGroups = role === "owner" ? ownerGroups : staffGroups;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200/60 dark:border-[#1e293b]/80 bg-background dark:bg-[#0B1121]/80 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* MOBILE HAMBURGER MENU */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden relative flex items-center justify-center p-2 -ml-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-secondary transition-colors">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle mobile menu</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[280px] p-0 flex flex-col border-r border-slate-200/60 dark:border-[#1e293b]/80 bg-background dark:bg-[#0B1121]"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

            {/* ---> BRAND HEADER (Matches Sidebar) <--- */}
            <div className="h-16 flex items-center px-6 border-b border-border hover:bg-muted/50 transition-colors shrink-0 overflow-hidden">
              <div className="relative h-8 w-8 shrink-0 flex items-center justify-center mr-3">
                <Image
                  src="/logo.png"
                  alt="Otso Poultry Logo"
                  fill
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>
              <span className="font-black text-lg tracking-tight text-foreground whitespace-nowrap drop-shadow-sm">
                Otso Poultry
              </span>
            </div>

            {/* ---> NAVIGATION LINKS <--- */}
            <div className="flex-1 py-6 flex flex-col gap-6 px-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
              {navGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1 w-full">
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1 truncate transition-opacity duration-300">
                    {group.label}
                  </h3>

                  <div className="px-1 flex flex-col gap-1">
                    {group.items.map((item) => {
                      if (item.subItems) {
                        const isMenuOpen = openMenus[item.name];
                        const isAnySubActive = item.subItems.some(
                          (sub) =>
                            pathname === sub.href ||
                            pathname.startsWith(sub.href + "/"),
                        );

                        return (
                          <div
                            key={item.name}
                            className="flex flex-col gap-1 mt-1 w-full"
                          >
                            <button
                              onClick={() => toggleMenu(item.name)}
                              className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group w-full outline-none",
                                isAnySubActive
                                  ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold shadow-md"
                                  : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium",
                              )}
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
                                <span className="text-sm truncate transition-transform duration-300 group-hover:translate-x-1">
                                  {item.name}
                                </span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200 opacity-70",
                                  isMenuOpen ? "rotate-180 text-white dark:text-indigo-400" : "group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
                                )}
                              />
                            </button>

                            {/* Sub Items */}
                            {isMenuOpen && (
                              <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-border ml-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                {item.subItems.map((subItem) => {
                                  const isStrictActive =
                                    pathname === subItem.href;
                                  return (
                                    <Link
                                      key={subItem.name}
                                      href={subItem.href}
                                      onClick={() => setIsOpen(false)}
                                      className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                        isStrictActive
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

                      // NORMAL ITEMS
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
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative border",
                            isStrictActive
                              ? "bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 font-bold border-indigo-500 dark:border-indigo-500/30 shadow-md"
                              : "border-transparent text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                              isStrictActive ? "text-white dark:text-indigo-400" : "opacity-90 group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
                            )}
                          />
                          <span className="text-sm truncate transition-transform duration-300 group-hover:translate-x-1">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ---> FOOTER <--- */}
            <div className="p-3 border-t border-border bg-muted/30 shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive font-medium transition-colors group border border-transparent hover:border-destructive/20"
              >
                <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm truncate">Log out securely</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <h2 className="text-lg font-semibold tracking-tight hidden sm:block dark:text-white text-black">
          Sales Monitoring System
        </h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex items-center justify-center p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-secondary transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        {userId && role === "owner" && (
          <NotificationBell userId={Number(userId)} />
        )}

        <div className="flex items-center gap-3 border-l border-border/50 pl-4 sm:pl-5 ml-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold leading-none dark:text-white text-black">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground capitalize mt-1 font-medium">
              {role === "owner" ? "Farm Owner" : "Staff Member"}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center text-white shadow-md font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden relative border border-border/50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={userName || "User"}
                fill
                className="object-cover"
              />
            ) : userName ? (
              getInitials(userName)
            ) : (
              "U"
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
