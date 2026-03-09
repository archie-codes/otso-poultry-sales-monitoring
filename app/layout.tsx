import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import AppLayout from "../components/AppLayout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "../components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Otso Poultry Farm",
  description: "Poultry-Based Accounting Monitoring System",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch the session on the server to prevent layout shifts
  const session = await getServerSession(authOptions);

  // 2. Extract user data using your custom NextAuth types
  // This ensures the sidebar and header reflect the correct 'owner' or 'staff' role
  const role = (session?.user as any)?.role ?? "staff";
  const name = session?.user?.name ?? "Farm Staff";
  const imageUrl = (session?.user as any)?.imageUrl ?? null;

  // --- NEW: Extract the user ID ---
  const userId = (session?.user as any)?.id ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* AppLayout acts as the primary wrapper for your sidebar and header.
                Passing the session data here allows for immediate UI responsiveness.
            */}
            <AppLayout
              role={role}
              userName={name}
              imageUrl={imageUrl}
              userId={userId} // <-- NEW: Pass the ID into the layout!
            >
              <main className="min-h-screen">{children}</main>
            </AppLayout>
          </AuthProvider>

          {/* Toaster is positioned top-right to avoid overlapping with 
              mobile navigation elements or your action modals.
          */}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
