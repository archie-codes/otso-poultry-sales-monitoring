// "use client";
// import { usePathname } from "next/navigation";
// import Sidebar from "./Sidebar";
// import Navbar from "./Navbar";

// export default function AppLayout({
//   children,
//   role,
//   userName,
//   imageUrl,
//   userId, // <-- NEW: Added userId here
// }: {
//   children: React.ReactNode;
//   role: string;
//   userName: string;
//   imageUrl: string;
//   userId: string; // <-- NEW: Added to type definition
// }) {
//   const pathname = usePathname();
//   const isLogin = pathname === "/login";

//   if (isLogin) {
//     return <div className="min-h-screen bg-background">{children}</div>;
//   }

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       <Sidebar role={role} />
//       <div className="flex flex-col flex-1 overflow-hidden border-l border-border/40">
//         {/* Pass the userId to the Navbar so the Bell works! */}
//         <Navbar
//           userId={userId}
//           userName={userName}
//           role={role}
//           imageUrl={imageUrl}
//         />

//         {/* ADDED: A subtle canvas background to the main area! */}
//         {/* In light mode it will be a soft gray, in dark mode it stays sleek. */}
//         <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background p-4 md:p-6 lg:p-8">
//           <div className="mx-auto max-w-7xl dark:text-white text-black">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout({
  children,
  role,
  userName,
  imageUrl,
  userId,
}: {
  children: React.ReactNode;
  role: string;
  userName: string;
  imageUrl: string;
  userId: string;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  // ---> NEW: State to track if sidebar is expanded or collapsed <---
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-indigo-50 dark:bg-background">
      {/* ---> NEW: Pass the state and toggle function to the Sidebar <--- */}
      <Sidebar
        role={role}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />

      <div className="flex flex-col flex-1 overflow-hidden border-l border-border/40 relative">
        <Navbar
          userId={userId}
          userName={userName}
          role={role}
          imageUrl={imageUrl}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl dark:text-white text-black transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
