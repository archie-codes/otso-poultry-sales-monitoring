// "use client";
// import { Bell, Moon, Sun, User } from "lucide-react";
// import { useTheme } from "next-themes";

// export default function Navbar() {
//   const { theme, setTheme } = useTheme();

//   return (
//     <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
//       <div className="flex items-center gap-4">
//         <h2 className="text-lg font-semibold tracking-tight hidden sm:block">
//           Otso Poultry Farm Accounting
//         </h2>
//       </div>

//       <div className="flex items-center gap-4">
//         <button
//           onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//           className="p-2 rounded-full hover:bg-secondary transition-colors"
//         >
//           <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//           <Moon className="absolute top-5 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//           <span className="sr-only">Toggle theme</span>
//         </button>

//         <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
//           <Bell className="h-5 w-5 text-muted-foreground" />
//           <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
//         </button>

//         <div className="h-9 w-9 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white shadow-md cursor-pointer hover:opacity-90 transition-opacity">
//           <User className="h-5 w-5" />
//         </div>
//       </div>
//     </header>
//   );
// }

"use client";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

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

  // Helper function to get initials (e.g., "Archie Bauzon" -> "AB")
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold tracking-tight hidden sm:block dark:text-white text-black">
          Sales Monitoring System
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          // FIX 1: Added `relative`, `flex items-center justify-center`, and explicit text colors!
          className="relative flex items-center justify-center p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-secondary transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

          {/* FIX 2: Removed "top-5" so it stays perfectly centered over the Sun */}
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
        </button>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 border-l border-border/50 pl-5 ml-1">
          <div className="flex flex-col text-right sm:flex">
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
