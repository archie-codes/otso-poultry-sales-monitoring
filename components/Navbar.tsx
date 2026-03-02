"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

// Merged Icons needed for both Navbar and Mobile Menu
import {
  Bell,
  Moon,
  Sun,
  Menu,
  LayoutDashboard,
  TrendingDown,
  Settings,
  LogOut,
  Egg,
  Activity,
  Tractor,
  FileBarChart,
} from "lucide-react";

// Shadcn Sheet components for the slide-out drawer
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

// 1. EXACT SAME GROUPS FROM YOUR SIDEBAR
const ownerGroups = [
  {
    label: "Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Farm Setup", href: "/farms", icon: Tractor },
      { name: "Chick Loading", href: "/production/loading", icon: Egg },
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
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

const staffGroups = [
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

export default function Navbar({
  userName,
  role,
  imageUrl,
}: {
  userName?: string;
  role?: string;
  imageUrl?: string;
}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // State to control the mobile menu drawer
  const [isOpen, setIsOpen] = useState(false);

  // Determine which links to show based on the user's role
  const navGroups = role === "owner" ? ownerGroups : staffGroups;

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      {/* LEFT SIDE: Hamburger Menu + System Title */}
      <div className="flex items-center gap-4">
        {/* MOBILE HAMBURGER MENU (Hidden on Desktop) */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden relative flex items-center justify-center p-2 -ml-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-secondary transition-colors">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle mobile menu</span>
            </button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[280px] p-0 flex flex-col border-r border-border/40 bg-card"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            {/* Mobile Brand Header */}
            <div className="h-16 flex items-center px-6 border-b border-border/40">
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

            {/* Mobile Navigation Links */}
            <div className="flex-1 py-6 flex flex-col gap-6 px-4 overflow-y-auto custom-scrollbar">
              {navGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <h3 className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
                    {group.label}
                  </h3>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    const isStrictActive =
                      item.href === "/" ? pathname === "/" : isActive;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)} // IMPORTANT: Closes the drawer when a link is clicked
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isStrictActive
                            ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
                            : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
                        }`}
                      >
                        <item.icon
                          className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${
                            isStrictActive
                              ? "text-slate-900 dark:text-white"
                              : ""
                          }`}
                        />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Mobile Logout */}
            <div className="p-4 border-t border-border/40 bg-card/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-500 font-medium transition-colors group"
              >
                <LogOut className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Log out securely</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Title (Hidden on tiny mobile screens to avoid text overlapping the hamburger icon) */}
        <h2 className="text-lg font-semibold tracking-tight hidden sm:block dark:text-white text-black">
          Sales Monitoring System
        </h2>
      </div>

      {/* RIGHT SIDE: Theme, Notifications, Profile */}
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative flex items-center justify-center p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-secondary transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
        </button>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 border-l border-border/50 pl-4 sm:pl-5 ml-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold leading-none dark:text-white text-black">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground capitalize mt-1 font-medium">
              {role === "owner" ? "Farm Owner" : "Staff Member"}
            </span>
          </div>

          {/* Dynamic Initials Avatar */}
          <div className="h-9 w-9 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white shadow-md font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden relative border border-border/50">
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
