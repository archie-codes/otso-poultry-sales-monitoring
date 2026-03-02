import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import { users } from "../../src/db/schema";
import { desc } from "drizzle-orm"; // <-- Import sorting function
import { Users } from "lucide-react";
import AddUserModal from "./AddUserModal";
import UserCard from "./UserCard";
import { Suspense } from "react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "owner") redirect("/");

  // Fetch all users and sort by ID descending (newest first!)
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .orderBy(desc(users.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-12">
      {/* Header & Modal Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage farm operations and staff accounts.
          </p>
        </div>
        <AddUserModal />
      </div>

      <div className="flex items-center gap-4 py-2">
        <div className="h-px bg-border/50 flex-1"></div>
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          <Users className="w-4 h-4" /> Active System Users
        </div>
        <div className="h-px bg-border/50 flex-1"></div>
      </div>

      {/* Grid of Users (Wrapped in Suspense to allow URL tracking) */}
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground py-10 animate-pulse">
            Loading active accounts...
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              // 1. Pass down the currently logged-in email!
              currentUserEmail={session?.user?.email}
            />
          ))}
        </div>
      </Suspense>
    </div>
  );
}
