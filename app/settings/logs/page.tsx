import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth"; // Adjust path if needed
import { redirect } from "next/navigation";
import { db } from "../../../src";
import { notifications } from "../../../src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import SystemLogsClient from "./SystemLogsClient";

export default async function SystemLogsPage(props: {
  searchParams: Promise<{ page?: string }> | { page?: string };
}) {
  const session = await getServerSession(authOptions);

  // 1. Strict Security: Kick out anyone who isn't the owner
  if (!session || (session.user as any).role !== "owner") {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const adminId = Number((session.user as any).id);

  // 2. Pagination Math
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 15;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 3. Count total logs for this admin
  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(eq(notifications.recipientId, adminId));

  const totalItems = Number(countQuery[0].count);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 4. Fetch only the specific page of logs
  const logs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, adminId))
    .orderBy(desc(notifications.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-card border border-border/50 p-6 lg:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
            <ShieldAlert className="h-9 w-9 sm:h-10 sm:w-10 text-blue-500 shrink-0" />
            System Audit Logs
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm">
            A complete, permanent record of all staff logins and system
            activity.
          </p>
        </div>
        <div className="shrink-0 mt-2 md:mt-0 text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Total Lifetime Events
          </p>
          <p className="text-3xl font-black text-foreground">{totalItems}</p>
        </div>
      </div>

      {/* THE CLIENT TABLE */}
      <SystemLogsClient
        logs={logs}
        totalPages={totalPages}
        currentPage={currentPage}
      />
    </div>
  );
}
