// "use client";
// import {
//   LayoutDashboard,
//   Receipt,
//   TrendingDown,
//   FileBarChart,
//   Settings,
//   LogOut,
//   Egg,
//   Activity,
//   Tractor,
//   BookOpen,
// } from "lucide-react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { signOut } from "next-auth/react";
// import Image from "next/image";

// // 1. ADVANCED UX: Grouping items by business logic
// const ownerGroups = [
//   {
//     label: "Operations",
//     items: [
//       { name: "Dashboard", href: "/", icon: LayoutDashboard },
//       { name: "Farm Setup", href: "/farms", icon: Tractor },
//       { name: "Chick Loading", href: "/production/loading", icon: Egg },
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//     ],
//   },
//   {
//     label: "Finance & Analytics",
//     items: [
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//       { name: "Harvest & Sales", href: "/sales", icon: Receipt },
//       { name: "Reports", href: "/reports", icon: FileBarChart },
//     ],
//   },
//   {
//     label: "System",
//     items: [{ name: "Settings", href: "/settings", icon: Settings }],
//   },
// ];

// const staffGroups = [
//   {
//     label: "Farm Duties",
//     items: [
//       {
//         name: "Daily Monitoring",
//         href: "/production/monitoring",
//         icon: Activity,
//       },
//       { name: "Expenses", href: "/expenses", icon: TrendingDown },
//     ],
//   },
//   {
//     label: "Resources",
//     items: [{ name: "Manual Guide", href: "/guide", icon: BookOpen }],
//   },
// ];

// export default function Sidebar({ role }: { role: string }) {
//   const pathname = usePathname();
//   const navGroups = role === "owner" ? ownerGroups : staffGroups;

//   return (
//     <div className="w-[260px] border-r border-border/40 bg-card hidden md:flex flex-col h-full shadow-sm z-20 transition-all duration-300">
//       {/* Brand Header */}
//       <div className="h-16 flex items-center px-6 border-b border-border/40 hover:bg-secondary/20 transition-colors cursor-pointer">
//         {/* Next.js Image Container */}
//         <div className="relative h-8 w-8 mr-3 shrink-0 flex items-center justify-center">
//           <Image
//             src="/logo.png" /* <-- Change this to your exact file name in the public folder */
//             alt="Otso Poultry Logo"
//             fill
//             className="object-contain"
//             priority /* Loads the logo instantly */
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
//             {/* Tiny Category Header */}
//             <h3 className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
//               {group.label}
//             </h3>

//             {/* The Links */}
//             {group.items.map((item) => {
//               const isActive =
//                 pathname === item.href || pathname.startsWith(item.href + "/");
//               const isStrictActive =
//                 item.href === "/" ? pathname === "/" : isActive;

//               return (
//                 <Link
//                   key={item.name}
//                   href={item.href}
//                   className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
//                     isStrictActive
//                       ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
//                       : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
//                   }`}
//                 >
//                   <item.icon
//                     className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${isStrictActive ? "text-slate-900 dark:text-white" : ""}`}
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
"use client";
import {
  LayoutDashboard,
  TrendingDown,
  Settings,
  LogOut,
  Egg,
  Activity,
  Tractor,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";

// 1. ADVANCED UX: Grouping items by business logic
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

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const navGroups = role === "owner" ? ownerGroups : staffGroups;

  return (
    <div className="w-[260px] border-r border-border/40 bg-card hidden md:flex flex-col h-full shadow-sm z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/40 hover:bg-secondary/20 transition-colors cursor-pointer">
        {/* Next.js Image Container */}
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
            {/* Tiny Category Header */}
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-1">
              {group.label}
            </h3>

            {/* The Links */}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const isStrictActive =
                item.href === "/" ? pathname === "/" : isActive;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isStrictActive
                      ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white shadow-sm"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900 font-medium dark:hover:bg-slate-800/50 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${isStrictActive ? "text-slate-900 dark:text-white" : ""}`}
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
