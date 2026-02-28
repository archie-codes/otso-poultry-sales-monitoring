import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import {
  dailyRecords,
  loads,
  buildings,
  farms,
  users,
} from "../../../src/db/schema";
import { desc, eq } from "drizzle-orm";
import { Activity, Calendar } from "lucide-react";
import AddDailyRecordModal from "./AddDailyRecordModal";

export default async function DailyMonitoringPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch Active Loads so staff know WHERE they can put data
  const activeLoads = await db
    .select({
      id: loads.id,
      quantity: loads.actualQuantityLoad,
      buildingName: buildings.name,
      farmName: farms.name,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true));

  // Fetch the recent history table with all the joined data
  const history = await db
    .select({
      id: dailyRecords.id,
      date: dailyRecords.recordDate,
      mortality: dailyRecords.mortality,
      feeds: dailyRecords.feedsConsumed,
      eggs: dailyRecords.eggCount,
      remarks: dailyRecords.remarks,
      staffName: users.name,
      buildingName: buildings.name,
      farmName: farms.name,
    })
    .from(dailyRecords)
    .innerJoin(loads, eq(dailyRecords.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .leftJoin(users, eq(dailyRecords.recordedBy, users.id))
    .orderBy(desc(dailyRecords.recordDate))
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Daily Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Log mortality, feed consumption, and egg production.
          </p>
        </div>

        <AddDailyRecordModal activeLoads={activeLoads} />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center">
          <h2 className="font-bold text-foreground">Recent Activity Logs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/10 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                <th className="px-6 py-4 font-bold tracking-wider text-red-500">
                  Mortality
                </th>
                <th className="px-6 py-4 font-bold tracking-wider text-amber-500">
                  Feeds
                </th>
                <th className="px-6 py-4 font-bold tracking-wider text-emerald-500">
                  Eggs
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
                    colSpan={6}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    No daily records found. Start logging data above!
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{record.buildingName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {record.farmName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                      {record.mortality}
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-500">
                      {record.feeds} kg
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-500">
                      {record.eggs}
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
