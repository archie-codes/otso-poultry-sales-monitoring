import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import { expenses, farms, loads, buildings, users } from "../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { TrendingDown, Calendar, Users } from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch dropdown data
  const allFarms = await db.select().from(farms);
  const activeLoads = await db
    .select({
      id: loads.id,
      farmId: farms.id,
      buildingName: buildings.name,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true));

  // Fetch recent history
  const history = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      type: expenses.expenseType,
      amount: expenses.amount,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
    })
    .from(expenses)
    .innerJoin(farms, eq(expenses.farmId, farms.id))
    .leftJoin(loads, eq(expenses.loadId, loads.id))
    .leftJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(users, eq(expenses.recordedBy, users.id))
    .orderBy(desc(expenses.expenseDate))
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="h-8 w-8 text-red-500" />
            Expenses
          </h1>
          <p className="text-muted-foreground mt-1">
            Track direct costs and shared farm labor.
          </p>
        </div>

        <AddExpenseModal farms={allFarms} activeLoads={activeLoads} />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center">
          <h2 className="font-bold text-foreground">
            Recent Financial Records
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/10 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Location / Target
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">
                  Amount (₱)
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{record.farmName}</span>
                      <span className="block text-xs mt-0.5">
                        {record.buildingName ? (
                          <span className="text-muted-foreground">
                            Direct: {record.buildingName}
                          </span>
                        ) : (
                          <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Users className="w-3 h-3" /> Shared Across Farm
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                      <span className="bg-secondary px-2 py-1 rounded-md">
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400 text-right text-base">
                      {Number(record.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase">
                      {record.staffName || "Unknown"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
