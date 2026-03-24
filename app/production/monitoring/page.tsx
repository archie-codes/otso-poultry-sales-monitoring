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
  feedAllocations,
  feedDeliveries,
} from "../../../src/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import MonitoringTableClient from "./MonitoringTableClient";
import LogDailyRecordModal from "./LogDailyRecordModal";

export default async function DailyMonitoringPage(props: {
  searchParams: Promise<{
    farm?: string;
    building?: string;
    load?: string;
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
  const selectedLoad = searchParams?.load;
  const selectedDate = searchParams?.date;
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. FETCH ALL LOADS
  const allLoadsRaw = await db
    .select({
      id: loads.id,
      quantity: loads.actualQuantityLoad,
      buildingName: buildings.name,
      farmName: farms.name,
      isActive: loads.isActive,
      loadDate: loads.loadDate, // <--- ADDED: Needed for the Date Blocker in the Modal
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const allBuildingFeeds = await db
    .select({
      loadId: feedAllocations.loadId,
      feedType: feedAllocations.feedType,
      remainingInBuilding: feedAllocations.remainingInBuilding,
      unitPrice: feedDeliveries.unitPrice,
    })
    .from(feedAllocations)
    .leftJoin(
      feedDeliveries,
      eq(feedAllocations.deliveryId, feedDeliveries.id),
    );

  const mappedLoads = allLoadsRaw.map((load) => {
    const feedStock = allBuildingFeeds
      .filter((fa) => fa.loadId === load.id)
      .reduce(
        (acc, fa) => {
          const type = fa.feedType;
          if (type) {
            if (!acc[type]) {
              acc[type] = { qty: 0, price: Number(fa.unitPrice) || 0 };
            }
            acc[type].qty += Number(fa.remainingInBuilding);
          }
          return acc;
        },
        {} as Record<string, { qty: number; price: number }>,
      );

    return { ...load, feedStock };
  });

  const activeLoads = mappedLoads.filter((load) => load.isActive);

  // 2. FILTERS
  const infrastructure = await db
    .select({
      farmName: farms.name,
      buildingName: buildings.name,
      loadId: loads.id,
      loadName: loads.name,
    })
    .from(dailyRecords)
    .innerJoin(loads, eq(dailyRecords.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const uniqueFarmNames = Array.from(
    new Set(infrastructure.map((i) => i.farmName)),
  );

  const filteredBuildings =
    selectedFarm && selectedFarm !== "all"
      ? Array.from(
          new Set(
            infrastructure
              .filter((i) => i.farmName === selectedFarm)
              .map((i) => i.buildingName),
          ),
        )
      : [];

  const filteredInfra = infrastructure.filter((i) => {
    if (selectedFarm && selectedFarm !== "all" && i.farmName !== selectedFarm)
      return false;
    if (
      selectedBuilding &&
      selectedBuilding !== "all" &&
      i.buildingName !== selectedBuilding
    )
      return false;
    return true;
  });

  const loadMap = new Map<number, string>();
  filteredInfra.forEach((i) =>
    loadMap.set(i.loadId, i.loadName || `Load ${i.loadId}`),
  );

  const availableLoads = Array.from(loadMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => b.id - a.id);

  // 3. BUILD DATABASE QUERY CONDITIONS
  const filterConditions = [];
  if (selectedFarm && selectedFarm !== "all")
    filterConditions.push(eq(farms.name, selectedFarm));
  if (selectedBuilding && selectedBuilding !== "all")
    filterConditions.push(eq(buildings.name, selectedBuilding));
  if (selectedLoad && selectedLoad !== "all")
    filterConditions.push(eq(loads.id, Number(selectedLoad)));
  if (selectedDate && selectedDate !== "all")
    filterConditions.push(eq(dailyRecords.recordDate, selectedDate));

  const finalCondition =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyRecords)
    .innerJoin(loads, eq(dailyRecords.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(finalCondition);

  const totalItems = Number(countQuery[0].count);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 4. FETCH HISTORY
  const history = await db
    .select({
      id: dailyRecords.id,
      loadId: dailyRecords.loadId,
      loadName: loads.name,
      date: dailyRecords.recordDate,
      mortalityAm: dailyRecords.mortalityAm,
      mortalityPm: dailyRecords.mortalityPm,
      mortality: dailyRecords.mortality,
      feedsAm: dailyRecords.feedsConsumedAm,
      feedsPm: dailyRecords.feedsConsumedPm,
      feeds: dailyRecords.feedsConsumed,
      feedType: dailyRecords.feedType,
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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border/50 p-8 rounded-lg shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Daily Monitoring
          </h1>
          <p className="text-muted-foreground font-sm mt-1">
            Log mortality and feed consumption for active buildings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <LogDailyRecordModal activeLoads={activeLoads} />
        </div>
      </div>

      <MonitoringTableClient
        history={history}
        farms={uniqueFarmNames}
        buildings={filteredBuildings}
        loads={availableLoads}
        totalPages={totalPages}
        currentPage={currentPage}
        userRole={userRole}
      />
    </div>
  );
}
