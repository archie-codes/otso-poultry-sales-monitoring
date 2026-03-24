// "use client";

// import { useState } from "react";
// import {
//   LayoutDashboard,
//   TrendingDown,
//   Settings,
//   LogOut,
//   Activity,
//   Tractor,
//   FileBarChart,
//   Archive,
//   Users,
//   ShieldAlert,
//   ChevronDown,
//   Package,
//   Warehouse, // <-- NEW
//   Building2, // <-- NEW
// } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { signOut } from "next-auth/react";
// import Image from "next/image";
// import henIcon from "@/public/hen.svg";

// const HenIcon = ({ className }: { className?: string }) => {
//   return (
//     <span
//       className={`relative block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
//     >
//       <Image
//         src={henIcon}
//         alt="Hen"
//         fill
//         sizes="18px"
//         className="object-contain dark:brightness-0 dark:invert"
//       />
//     </span>
//   );
// };

// type NavItem = {
//   name: string;
//   href?: string;
//   icon: any;
//   subItems?: {
//     name: string;
//     href: string;
//     icon: any;
//   }[];
// };

// type NavGroup = {
//   label: string;
//   items: NavItem[];
// };

// // ---> UPGRADED NAVIGATION GROUPS <---
// const ownerGroups: NavGroup[] = [
//   {
//     label: "Operations",
//     items: [
//       { name: "Dashboard", href: "/", icon: LayoutDashboard },
//       { name: "Farm Setup", href: "/farms", icon: Tractor },
//       { name: "Chick Loading", href: "/production/loading", icon: HenIcon },
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//       {
//         name: "Feed Inventory",
//         icon: Package,
//         subItems: [
//           { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
//           {
//             name: "Building Stocks",
//             href: "/inventory/building-stocks",
//             icon: Building2,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     label: "Finance",
//     items: [
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//       { name: "Master Reports", href: "/reports", icon: FileBarChart },
//       { name: "Historical Ledger", href: "/reports/history", icon: Archive },
//     ],
//   },
//   {
//     label: "System",
//     items: [
//       {
//         name: "Settings",
//         icon: Settings,
//         subItems: [
//           { name: "User Management", href: "/settings", icon: Users },
//           { name: "System Logs", href: "/settings/logs", icon: ShieldAlert },
//         ],
//       },
//     ],
//   },
// ];

// const staffGroups: NavGroup[] = [
//   {
//     label: "Farm Duties",
//     items: [
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//       {
//         name: "Feed Inventory",
//         icon: Package,
//         subItems: [
//           { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
//           {
//             name: "Building Stocks",
//             href: "/inventory/building-stocks",
//             icon: Building2,
//           },
//         ],
//       },
//     ],
//   },
// ];

// export default function Sidebar({ role }: { role: string }) {
//   const pathname = usePathname();
//   const navGroups = role === "owner" ? ownerGroups : staffGroups;

//   // ---> UPGRADED DYNAMIC MENU STATE <---
//   const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
//     Settings: pathname.startsWith("/settings"),
//     "Feed Inventory": pathname.startsWith("/inventory"),
//   });

//   const toggleMenu = (name: string) => {
//     setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
//   };

//   return (
//     <div className="w-[260px] border-r border-border/40 bg-card hidden md:flex flex-col h-full shadow-sm z-20 transition-all duration-300">
//       {/* Brand Header */}
//       <div className="h-16 flex items-center px-6 border-b border-border/40 hover:bg-secondary/20 transition-colors cursor-pointer">
//         <div className="relative h-8 w-8 mr-3 shrink-0 flex items-center justify-center">
//           <Image
//             src="/logo.png"
//             alt="Otso Poultry Logo"
//             fill
//             className="object-contain"
//             priority
//           />
//         </div>
//         <span className="font-bold text-lg tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
//           Otso Poultry
//         </span>
//       </div>

//       {/* Navigation Links with Category Headers */}
//       <div className="flex-1 py-6 flex flex-col gap-6 px-4 overflow-y-auto custom-scrollbar">
//         {navGroups.map((group) => (
//           <div key={group.label} className="flex flex-col gap-1">
//             <h3 className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
//               {group.label}
//             </h3>

//             {group.items.map((item) => {
//               // IF THIS ITEM HAS SUB-ITEMS
//               if (item.subItems) {
//                 const isOpen = openMenus[item.name];
//                 const isAnySubActive = item.subItems.some(
//                   (sub) =>
//                     pathname === sub.href ||
//                     pathname.startsWith(sub.href + "/"),
//                 );

//                 return (
//                   <div key={item.name} className="flex flex-col gap-1 mt-1">
//                     <button
//                       onClick={() => toggleMenu(item.name)}
//                       className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group w-full ${
//                         isAnySubActive
//                           ? "text-slate-900 font-bold dark:text-white"
//                           : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
//                       }`}
//                     >
//                       <div className="flex items-center gap-3">
//                         <item.icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
//                         <span className="text-sm">{item.name}</span>
//                       </div>
//                       <ChevronDown
//                         className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
//                       />
//                     </button>

//                     {isOpen && (
//                       <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-border/50 ml-5 animate-in slide-in-from-top-2 fade-in duration-200">
//                         {item.subItems.map((subItem) => {
//                           const isStrictActive = pathname === subItem.href;
//                           return (
//                             <Link
//                               key={subItem.name}
//                               href={subItem.href}
//                               className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
//                                 isStrictActive
//                                   ? "bg-slate-100 text-blue-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
//                                   : "text-muted-foreground hover:text-slate-900 text-sm font-medium dark:hover:text-white"
//                               }`}
//                             >
//                               <subItem.icon
//                                 className={`h-4 w-4 ${isStrictActive ? "text-slate-900 dark:text-white" : ""}`}
//                               />
//                               <span className="text-[13px]">
//                                 {subItem.name}
//                               </span>
//                             </Link>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 );
//               }

//               // NORMAL ITEMS
//               const itemHref = item.href || "";
//               const isActive =
//                 pathname === itemHref ||
//                 (pathname.startsWith(itemHref + "/") &&
//                   itemHref !== "/reports");
//               const isStrictActive =
//                 itemHref === "/" ? pathname === "/" : isActive;

//               return (
//                 <Link
//                   key={item.name}
//                   href={itemHref}
//                   className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
//                     isStrictActive
//                       ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
//                       : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
//                   }`}
//                 >
//                   <item.icon
//                     className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${
//                       isStrictActive ? "text-slate-900 dark:text-white" : ""
//                     }`}
//                   />
//                   <span className="text-sm">{item.name}</span>
//                 </Link>
//               );
//             })}
//           </div>
//         ))}
//       </div>

//       {/* Footer / Logout */}
//       <div className="p-4 border-t border-border/40 bg-card/50">
//         <button
//           onClick={() => signOut({ callbackUrl: "/login" })}
//           className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-500 font-medium transition-colors group"
//         >
//           <LogOut className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" />
//           <span className="text-sm">Log out securely</span>
//         </button>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useState } from "react";
// import {
//   LayoutDashboard,
//   TrendingDown,
//   Settings,
//   LogOut,
//   Activity,
//   Tractor,
//   FileBarChart,
//   Archive,
//   Users,
//   ShieldAlert,
//   ChevronDown,
//   Package,
//   Warehouse,
//   Building2,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { signOut } from "next-auth/react";
// import Image from "next/image";
// import henIcon from "@/public/hen.svg";
// import { cn } from "@/lib/utils";

// const HenIcon = ({ className }: { className?: string }) => {
//   return (
//     <span
//       className={`relative block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
//     >
//       <Image
//         src={henIcon}
//         alt="Hen"
//         fill
//         sizes="18px"
//         className="object-contain brightness-0 invert"
//       />
//     </span>
//   );
// };

// type NavItem = {
//   name: string;
//   href?: string;
//   icon: any;
//   subItems?: {
//     name: string;
//     href: string;
//     icon: any;
//   }[];
// };

// type NavGroup = {
//   label: string;
//   items: NavItem[];
// };

// const ownerGroups: NavGroup[] = [
//   {
//     label: "Operations",
//     items: [
//       { name: "Dashboard", href: "/", icon: LayoutDashboard },
//       { name: "Farm Setup", href: "/farms", icon: Tractor },
//       { name: "Chick Loading", href: "/production/loading", icon: HenIcon },
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//       {
//         name: "Feed Inventory",
//         icon: Package,
//         subItems: [
//           { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
//           {
//             name: "Building Stocks",
//             href: "/inventory/building-stocks",
//             icon: Building2,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     label: "Finance",
//     items: [
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//       { name: "Master Reports", href: "/reports", icon: FileBarChart },
//       { name: "Historical Ledger", href: "/reports/history", icon: Archive },
//     ],
//   },
//   {
//     label: "System",
//     items: [
//       {
//         name: "Settings",
//         icon: Settings,
//         subItems: [
//           { name: "User Management", href: "/settings", icon: Users },
//           { name: "System Logs", href: "/settings/logs", icon: ShieldAlert },
//         ],
//       },
//     ],
//   },
// ];

// const staffGroups: NavGroup[] = [
//   {
//     label: "Farm Duties",
//     items: [
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//       {
//         name: "Feed Inventory",
//         icon: Package,
//         subItems: [
//           { name: "Main Warehouse", href: "/inventory", icon: Warehouse },
//           {
//             name: "Building Stocks",
//             href: "/inventory/building-stocks",
//             icon: Building2,
//           },
//         ],
//       },
//     ],
//   },
// ];

// export default function Sidebar({
//   role,
//   isExpanded,
//   setIsExpanded,
// }: {
//   role: string;
//   isExpanded: boolean;
//   setIsExpanded: (val: boolean) => void;
// }) {
//   const pathname = usePathname();
//   const navGroups = role === "owner" ? ownerGroups : staffGroups;

//   const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
//     Settings: pathname.startsWith("/settings"),
//     "Feed Inventory": pathname.startsWith("/inventory"),
//   });

//   const toggleMenu = (name: string) => {
//     // If we click a dropdown while collapsed, force open the sidebar first!
//     if (!isExpanded) setIsExpanded(true);
//     setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
//   };

//   return (
//     <div
//       className={cn(
//         "hidden md:flex flex-col h-full shadow-2xl z-20 transition-all duration-300 ease-in-out relative border-r border-slate-800",
//         // ---> NEW DEEP ENTERPRISE COLOR <---
//         "bg-slate-950 text-slate-300",
//         isExpanded ? "w-[260px]" : "w-[80px]",
//       )}
//     >
//       {/* Brand Header */}
//       <div
//         className={cn(
//           "h-16 flex items-center border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors cursor-pointer shrink-0 overflow-hidden",
//           isExpanded ? "px-6" : "px-0 justify-center",
//         )}
//       >
//         <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
//           <Image
//             src="/logo.png"
//             alt="Logo"
//             fill
//             className="object-contain"
//             priority
//           />
//         </div>
//         <span
//           className={cn(
//             "font-bold text-lg tracking-tight text-white transition-opacity duration-300 whitespace-nowrap ml-3",
//             isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden",
//           )}
//         >
//           Otso Poultry
//         </span>
//       </div>

//       {/* Navigation Links */}
//       <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
//         {navGroups.map((group) => (
//           <div key={group.label} className="flex flex-col gap-1 w-full">
//             {/* Category Header */}
//             {isExpanded ? (
//               <h3 className="px-7 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 truncate transition-opacity duration-300">
//                 {group.label}
//               </h3>
//             ) : (
//               <div className="h-4 flex justify-center mb-1">
//                 <div className="w-4 h-0.5 bg-slate-800 rounded-full" />
//               </div>
//             )}

//             <div className="px-3 flex flex-col gap-1">
//               {group.items.map((item) => {
//                 const itemHref = item.href || "";
//                 const isActive =
//                   pathname === itemHref ||
//                   (pathname.startsWith(itemHref + "/") &&
//                     itemHref !== "/reports");
//                 const isStrictActive =
//                   itemHref === "/" ? pathname === "/" : isActive;
//                 const isMenuOpen = openMenus[item.name];

//                 if (item.subItems) {
//                   const isAnySubActive = item.subItems.some(
//                     (sub) =>
//                       pathname === sub.href ||
//                       pathname.startsWith(sub.href + "/"),
//                   );

//                   return (
//                     <div key={item.name} className="flex flex-col gap-1 w-full">
//                       <button
//                         onClick={() => toggleMenu(item.name)}
//                         className={cn(
//                           "flex items-center py-2.5 rounded-xl transition-all duration-200 group w-full outline-none",
//                           isExpanded
//                             ? "px-4 justify-between"
//                             : "px-0 justify-center",
//                           isAnySubActive
//                             ? "bg-slate-800 text-white font-bold"
//                             : "text-slate-400 hover:bg-slate-900 hover:text-white font-medium",
//                         )}
//                         title={!isExpanded ? item.name : undefined} // Tooltip when collapsed
//                       >
//                         <div className="flex items-center gap-3">
//                           <item.icon
//                             className={cn(
//                               "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
//                               isAnySubActive ? "text-blue-400" : "",
//                             )}
//                           />
//                           {isExpanded && (
//                             <span className="text-sm truncate">
//                               {item.name}
//                             </span>
//                           )}
//                         </div>
//                         {isExpanded && (
//                           <ChevronDown
//                             className={cn(
//                               "h-4 w-4 transition-transform duration-200 opacity-50",
//                               isMenuOpen ? "rotate-180" : "",
//                             )}
//                           />
//                         )}
//                       </button>

//                       {/* Sub Items (Only show if expanded AND open) */}
//                       {isExpanded && isMenuOpen && (
//                         <div className="flex flex-col gap-1 pl-4 mt-1 border-l border-slate-800 ml-6 animate-in slide-in-from-top-2 fade-in duration-200">
//                           {item.subItems.map((subItem) => {
//                             const subStrictActive = pathname === subItem.href;
//                             return (
//                               <Link
//                                 key={subItem.name}
//                                 href={subItem.href}
//                                 className={cn(
//                                   "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
//                                   subStrictActive
//                                     ? "bg-blue-600/10 text-blue-400 font-bold"
//                                     : "text-slate-500 hover:text-slate-300 text-sm font-medium hover:bg-slate-900/50",
//                                 )}
//                               >
//                                 <subItem.icon className="h-3.5 w-3.5" />
//                                 <span className="text-[13px] truncate">
//                                   {subItem.name}
//                                 </span>
//                               </Link>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 }

//                 // Normal Links
//                 return (
//                   <Link
//                     key={item.name}
//                     href={itemHref}
//                     className={cn(
//                       "flex items-center py-2.5 rounded-xl transition-all duration-200 group relative",
//                       isExpanded ? "px-4" : "px-0 justify-center",
//                       isStrictActive
//                         ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-900/20"
//                         : "text-slate-400 hover:bg-slate-900 hover:text-white font-medium",
//                     )}
//                     title={!isExpanded ? item.name : undefined}
//                   >
//                     <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
//                     {isExpanded && (
//                       <span className="text-sm ml-3 truncate">{item.name}</span>
//                     )}

//                     {/* Active Indicator Dot (Only shows when collapsed) */}
//                     {!isExpanded && isStrictActive && (
//                       <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
//                     )}
//                   </Link>
//                 );
//               })}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Footer / Toggle & Logout */}
//       <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2 shrink-0">
//         {/* Toggle Collapse Button */}
//         <button
//           onClick={() => setIsExpanded(!isExpanded)}
//           className={cn(
//             "flex items-center text-slate-500 hover:text-white hover:bg-slate-900 transition-colors py-2 rounded-xl group",
//             isExpanded ? "px-4 justify-between" : "justify-center",
//           )}
//         >
//           {isExpanded ? (
//             <>
//               <span className="text-[11px] font-bold uppercase tracking-widest">
//                 Collapse Menu
//               </span>
//               <ChevronLeft className="h-4 w-4" />
//             </>
//           ) : (
//             <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
//           )}
//         </button>

//         {/* Logout Button */}
//         <button
//           onClick={() => signOut({ callbackUrl: "/login" })}
//           className={cn(
//             "flex items-center gap-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 font-medium transition-colors group",
//             isExpanded ? "px-4 w-full" : "justify-center",
//           )}
//           title={!isExpanded ? "Log Out" : undefined}
//         >
//           <LogOut className="h-5 w-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
//           {isExpanded && (
//             <span className="text-sm truncate">Log out securely</span>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

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
    <span
      className={`relative block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}
    >
      <Image
        src={henIcon}
        alt="Hen"
        fill
        sizes="18px"
        className="object-contain brightness-0 invert"
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
        "hidden md:flex flex-col h-full shadow-2xl z-20 transition-all duration-300 ease-in-out relative border-r border-blue-900/30",
        // ---> BRAND COLORS: Dark Blue to Deep Green Gradient <---
        "bg-linear-to-b from-green-700 via-green-800 to-green-950 text-blue-50",
        isExpanded ? "w-[260px]" : "w-[80px]",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer shrink-0 overflow-hidden",
          isExpanded ? "px-6" : "px-0 justify-center",
        )}
      >
        <div className="relative h-8 w-8 shrink-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
        <span
          className={cn(
            // ---> TEXT GRADIENT: Emerald to Blue <---
            "font-black text-lg tracking-tight bg-linear-to-r from-white/80 to-white/80 bg-clip-text text-transparent transition-opacity duration-300 whitespace-nowrap ml-3",
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
              <h3 className="px-7 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/70 mb-1 truncate transition-opacity duration-300">
                {group.label}
              </h3>
            ) : (
              <div className="h-4 flex justify-center mb-1">
                <div className="w-4 h-0.5 bg-white/10 rounded-full" />
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
                          "flex items-center py-2.5 rounded-xl transition-all duration-200 group w-full outline-none border border-transparent",
                          isExpanded
                            ? "px-4 justify-between"
                            : "px-0 justify-center",
                          isAnySubActive
                            ? "bg-white/10 text-white font-bold border-white/5"
                            : "text-blue-100/70 hover:bg-white/5 hover:text-white font-medium",
                        )}
                        title={!isExpanded ? item.name : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                              isAnySubActive ? "text-emerald-400" : "",
                            )}
                          />
                          {isExpanded && (
                            <span className="text-sm truncate">
                              {item.name}
                            </span>
                          )}
                        </div>
                        {isExpanded && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200 opacity-50",
                              isMenuOpen ? "rotate-180 text-emerald-400" : "",
                            )}
                          />
                        )}
                      </button>

                      {/* Sub Items */}
                      {isExpanded && isMenuOpen && (
                        <div className="flex flex-col gap-1 pl-4 mt-1 border-l border-white/10 ml-6 animate-in slide-in-from-top-2 fade-in duration-200">
                          {item.subItems.map((subItem) => {
                            const subStrictActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                  subStrictActive
                                    ? "bg-emerald-500/20 text-emerald-400 font-bold"
                                    : "text-blue-100/60 hover:text-white text-sm font-medium hover:bg-white/5",
                                )}
                              >
                                <subItem.icon className="h-3.5 w-3.5" />
                                <span className="text-[13px] truncate">
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
                        ? "bg-linear-to-r from-emerald-500/20 to-blue-500/20 text-emerald-200 font-bold border-emerald-500/30 shadow-lg shadow-emerald-900/20"
                        : "border-transparent text-blue-100/70 hover:bg-white/5 hover:text-white font-medium",
                    )}
                    title={!isExpanded ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    {isExpanded && (
                      <span className="text-sm ml-3 truncate">{item.name}</span>
                    )}

                    {/* Active Indicator Dot (Only shows when collapsed) */}
                    {!isExpanded && isStrictActive && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-white/10 bg-black/20 flex flex-col gap-2 shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center text-blue-200/50 hover:text-white hover:bg-white/5 transition-colors py-2 rounded-xl group",
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
            "flex items-center gap-3 py-2.5 rounded-xl text-blue-200/60 hover:bg-red-500/20 hover:text-red-400 font-medium transition-colors group",
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
