"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout({
  children,
  role,
  userName,
  imageUrl,
}: {
  children: React.ReactNode;
  role: string;
  userName: string;
  imageUrl: string;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 overflow-hidden border-l border-border/40">
        <Navbar userName={userName} role={role} imageUrl={imageUrl} />

        {/* ADDED: A subtle canvas background to the main area! */}
        {/* In light mode it will be a soft gray, in dark mode it stays sleek. */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl dark:text-white text-black">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
