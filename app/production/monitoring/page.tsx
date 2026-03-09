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
import { desc, eq, and, sql } from "drizzle-orm";
import AddDailyRecordModal from "./AddDailyRecordModal";
import MonitoringTableClient from "./MonitoringTableClient";

export default async function DailyMonitoringPage(props: {
  searchParams:
    | Promise<{
        farm?: string;
        building?: string;
        date?: string;
        page?: string;
      }>
    | { farm?: string; building?: string; date?: string; page?: string };
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

  // 1. Fetch Active Loads (For the Add Record Modal dropdown)
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

  // 2. Fetch all Farms and Buildings for the Filter Dropdowns
  const infrastructure = await db
    .select({
      farmName: farms.name,
      buildingName: buildings.name,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const uniqueFarmNames = Array.from(
    new Set(infrastructure.map((i) => i.farmName)),
  );

  // Only show buildings that belong to the currently selected farm
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

  // 3. Build the Database Filter Conditions dynamically
  const filterConditions = [];

  if (selectedFarm && selectedFarm !== "all") {
    filterConditions.push(eq(farms.name, selectedFarm));
  }

  if (selectedBuilding && selectedBuilding !== "all") {
    filterConditions.push(eq(buildings.name, selectedBuilding));
  }

  if (selectedDate && selectedDate !== "all") {
    filterConditions.push(eq(dailyRecords.recordDate, selectedDate));
  }

  const finalCondition =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  // 4. Fetch Total Count for Pagination Math
  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyRecords)
    .innerJoin(loads, eq(dailyRecords.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(finalCondition);

  const totalItems = Number(countQuery[0].count);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 5. Fetch the Paginated & Filtered History (Eggs Removed)
  const history = await db
    .select({
      id: dailyRecords.id,
      date: dailyRecords.recordDate,
      mortality: dailyRecords.mortality,
      feeds: dailyRecords.feedsConsumed,
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
    .where(finalCondition)
    .orderBy(desc(dailyRecords.recordDate), desc(dailyRecords.id))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* PREMIUM HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border/50 p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Daily Monitoring
          </h1>
          <p className="text-muted-foreground font-medium mt-2">
            Log mortality and feed consumption.
          </p>
        </div>
        <div className="shrink-0">
          <AddDailyRecordModal activeLoads={activeLoads} />
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
