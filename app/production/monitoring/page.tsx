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
  feedTransactions,
} from "../../../src/db/schema";
// Added 'sql' to drizzle-orm imports
import { desc, eq, and, sql } from "drizzle-orm";
import MonitoringTableClient from "./MonitoringTableClient";
import LogMortalityModal from "./LogMortalityModal";
import LogFeedsModal from "./LogFeedsModal";

export default async function DailyMonitoringPage(props: {
  searchParams: Promise<{
    farm?: string;
    building?: string;
    date?: string;
    page?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userRole = (session.user as any)?.role || "staff";
  const searchParams = await props.searchParams;

  const selectedFarm = searchParams?.farm;
  const selectedBuilding = searchParams?.building;
  const selectedDate = searchParams?.date;
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // ==============================================================================
  // 1. FETCH ALL LOADS & CALCULATE LIVE FEED STOCK
  // ==============================================================================
  const allLoadsRaw = await db
    .select({
      id: loads.id,
      quantity: loads.actualQuantityLoad,
      buildingName: buildings.name,
      farmName: farms.name,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const allFeedTrans = await db.select().from(feedTransactions);

  const mappedLoads = allLoadsRaw.map((load) => {
    const feedStock = allFeedTrans
      .filter((ft) => ft.loadId === load.id)
      .reduce(
        (acc, ft) => {
          const type = ft.feedType;
          if (type) {
            acc[type] = (acc[type] || 0) + Number(ft.quantity);
          }
          return acc;
        },
        {} as Record<string, number>,
      );

    return { ...load, feedStock };
  });

  const loadsWithStock = mappedLoads.filter((load) =>
    Object.values(load.feedStock).some((qty) => qty > 0),
  );

  const activeLoads = mappedLoads.filter((load) => load.isActive);

  // ==============================================================================
  // 2. SETUP CASCADING FILTERS INFRASTRUCTURE
  // ==============================================================================
  const infrastructure = await db
    .select({ farmName: farms.name, buildingName: buildings.name })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const uniqueFarmNames = Array.from(
    new Set(infrastructure.map((i) => i.farmName)),
  );
  const availableBuildingsForFilter =
    selectedFarm && selectedFarm !== "all"
      ? Array.from(
          new Set(
            infrastructure
              .filter((i) => i.farmName === selectedFarm)
              .map((i) => i.buildingName),
          ),
        )
      : [];

  // ==============================================================================
  // 3. BUILD DYNAMIC SQL FILTERS
  // ==============================================================================
  const filterConditions = [];
  if (selectedFarm && selectedFarm !== "all")
    filterConditions.push(eq(farms.name, selectedFarm));
  if (selectedBuilding && selectedBuilding !== "all")
    filterConditions.push(eq(buildings.name, selectedBuilding));
  if (selectedDate && selectedDate !== "all")
    filterConditions.push(eq(dailyRecords.recordDate, selectedDate));

  const finalCondition =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  // ==============================================================================
  // 4. PAGINATION MATH
  // ==============================================================================
  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyRecords)
    .innerJoin(loads, eq(dailyRecords.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(finalCondition);

  const totalItems = Number(countQuery[0].count);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ==============================================================================
  // 5. FETCH HISTORY (FIXED THE SQL FAN-OUT BUG)
  // ==============================================================================
  const history = await db
    .select({
      id: dailyRecords.id,
      loadId: dailyRecords.loadId,
      date: dailyRecords.recordDate,
      mortality: dailyRecords.mortality,
      feeds: dailyRecords.feedsConsumed,
      feedType: feedTransactions.feedType,
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
    // THE FIX: Strictly link the Daily Record ID to the secret remark in Feed Transactions!
    .leftJoin(
      feedTransactions,
      eq(
        feedTransactions.remarks,
        sql`CONCAT('DAILY_LOG_', ${dailyRecords.id})`,
      ),
    )
    .where(finalCondition)
    .orderBy(desc(dailyRecords.recordDate), desc(dailyRecords.id))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border/50 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
            Daily Monitoring
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Log mortality and feed consumption for active buildings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <LogMortalityModal activeLoads={activeLoads} />
          <LogFeedsModal activeLoads={activeLoads} />
        </div>
      </div>

      <MonitoringTableClient
        history={history}
        farms={uniqueFarmNames}
        buildings={availableBuildingsForFilter}
        totalPages={totalPages}
        currentPage={currentPage}
        userRole={userRole}
      />
    </div>
  );
}
