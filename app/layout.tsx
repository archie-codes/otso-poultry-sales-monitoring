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
  // 1. Fetch the session
  const session = await getServerSession(authOptions);

  // 2. Extract role and name safely
  const role = (session?.user as any)?.role ?? "staff";
  const name = session?.user?.name ?? "Farm Staff";
  const imageUrl = (session?.user as any)?.imageUrl ?? null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppLayout role={role} userName={name} imageUrl={imageUrl}>
              {children}
            </AppLayout>
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
