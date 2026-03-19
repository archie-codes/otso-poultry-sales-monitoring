import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import {
  loads,
  buildings,
  farms,
  dailyRecords,
  expenses,
  harvestRecords,
  feedAllocations,
  feedDeliveries,
} from "../../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Archive, MapPin, Warehouse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---> NEW: The Paginated Container <---
import BuildingHistoryClient from "./BuildingHistoryClient";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch ONLY INACTIVE Loads
  const historicalLoadsData = await db
    .select({
      id: loads.id,
      name: loads.name,
      farmId: farms.id,
      farmName: farms.name,
      buildingName: buildings.name,
      chickType: loads.chickType,
      quantity: loads.actualQuantityLoad,
      sellingPrice: loads.sellingPrice,
      initialCapital: loads.initialCapital,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      customerName: loads.customerName,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, false))
    .orderBy(asc(farms.name), asc(buildings.name), desc(loads.harvestDate));

  // 2. Fetch raw datasets for Math Engine
  const allDailyRecords = await db.select().from(dailyRecords);
  const allExpenses = await db.select().from(expenses);
  const allHarvests = await db.select().from(harvestRecords);
  const allAllocations = await db
    .select({
      loadId: feedAllocations.loadId,
      feedType: feedAllocations.feedType,
      allocatedDate: feedAllocations.allocatedDate,
      allocatedQuantity: feedAllocations.allocatedQuantity,
      unitPrice: feedDeliveries.unitPrice,
    })
    .from(feedAllocations)
    .innerJoin(
      feedDeliveries,
      eq(feedAllocations.deliveryId, feedDeliveries.id),
    );

  // 3. Fetch ALL Loads to calculate overlapping dates
  const allLoadsWithFarm = await db
    .select({
      id: loads.id,
      farmId: buildings.farmId,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id));

  const allLoadsWithTrueTimeline = allLoadsWithFarm.map((l) => {
    const loadHarvests = allHarvests.filter((h) => h.loadId === l.id);
    const trueHarvestDate =
      loadHarvests.length > 0
        ? loadHarvests[loadHarvests.length - 1].harvestDate
        : l.harvestDate;

    const startTime = new Date(l.loadDate).getTime();
    const endTime = trueHarvestDate
      ? new Date(trueHarvestDate).getTime()
      : new Date().getTime();

    return {
      farmId: l.farmId,
      isActive: l.isActive,
      startTime: startTime,
      endTime: l.isActive ? Infinity : endTime,
    };
  });

  // 4. THE MATH ENGINE
  const reports = historicalLoadsData.map((load) => {
    const actualQuantityLoad = Number(load.quantity) || 0;
    const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
    const farmMortality = loadRecords.reduce(
      (sum, r) => sum + Number(r.mortality),
      0,
    );
    const loadHarvests = allHarvests.filter((h) => h.loadId === load.id);
    const actualHarvest = loadHarvests.reduce(
      (sum, h) => sum + Number(h.quantity),
      0,
    );

    const totalRtlAmount = loadHarvests.reduce(
      (sum, h) => sum + Number(h.quantity) * Number(h.sellingPrice),
      0,
    );

    const actualHarvestDate =
      loadHarvests.length > 0
        ? loadHarvests[loadHarvests.length - 1].harvestDate
        : load.harvestDate;

    const avgSellingPrice =
      actualHarvest > 0 ? totalRtlAmount / actualHarvest : 0;
    const percentHarvest =
      actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

    const uniqueCustomers = Array.from(
      new Set(loadHarvests.map((h) => h.customerName).filter(Boolean)),
    );
    const displayCustomer =
      uniqueCustomers.length > 1
        ? "Multiple Buyers"
        : uniqueCustomers[0] || load.customerName || "None";

    const loadStartTime = new Date(load.loadDate).getTime();
    const loadEndTime = actualHarvestDate
      ? new Date(actualHarvestDate).getTime()
      : new Date().getTime();

    const loadDirectExpenses = allExpenses.filter((e) => e.loadId === load.id);
    const directExpenses = loadDirectExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const loadFeedAllocations = allAllocations.filter(
      (fa) => fa.loadId === load.id,
    );
    const feedExpenses = loadFeedAllocations.reduce(
      (sum, fa) => sum + Number(fa.allocatedQuantity) * Number(fa.unitPrice),
      0,
    );

    const sharedExpenseShare = allExpenses
      .filter((e) => {
        if (e.farmId !== load.farmId || e.loadId !== null) return false;
        // @ts-ignore
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
        return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
      })
      .reduce((sum, e) => {
        // @ts-ignore
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
        const activeBatchesOnThisDay = allLoadsWithTrueTimeline.filter(
          (timeline) => {
            if (timeline.farmId !== load.farmId) return false;
            return (
              expenseTime >= timeline.startTime &&
              expenseTime <= timeline.endTime
            );
          },
        ).length;

        const divisor = activeBatchesOnThisDay > 0 ? activeBatchesOnThisDay : 1;
        return sum + Number(e.amount) / divisor;
      }, 0);

    const initialCapital = Number(load.initialCapital || 0);
    const totalGrossCost =
      initialCapital + directExpenses + sharedExpenseShare + feedExpenses;
    const actualCostPerChick =
      actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;
    const totalNetSales = totalRtlAmount - totalGrossCost;

    const loadDateObj = new Date(load.loadDate);
    const harvestDateObj = actualHarvestDate
      ? new Date(actualHarvestDate)
      : new Date();

    const ageInDays = Math.max(
      1,
      Math.floor(
        (harvestDateObj.getTime() - loadDateObj.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    return {
      ...load,
      farmMortality,
      actualHarvest,
      actualHarvestDate: actualHarvestDate
        ? new Date(actualHarvestDate).toLocaleDateString()
        : "TBD",
      percentHarvest,
      avgSellingPrice,
      displayCustomer,
      totalGrossCost,
      actualCostPerChick,
      totalRtlAmount,
      totalNetSales,
      ageInDays,
      loadDateStr: new Date(load.loadDate).toLocaleDateString(),
      pdfPayload: {
        feeds: loadFeedAllocations.map((fa) => ({
          date: fa.allocatedDate,
          type: fa.feedType,
          qty: Number(fa.allocatedQuantity),
          cost: Number(fa.allocatedQuantity) * Number(fa.unitPrice),
        })),
        expenses: loadDirectExpenses.map((e) => ({
          date: e.expenseDate,
          type: e.expenseType,
          remarks: e.remarks,
          amount: Number(e.amount),
        })),
        sharedExpenseShare,
      },
    };
  });

  // 5. GROUP BY FARM -> BUILDING
  const groupedHistory = reports.reduce(
    (acc, report) => {
      const farm = report.farmName;
      const building = report.buildingName;
      if (!acc[farm]) acc[farm] = {};
      if (!acc[farm][building]) acc[farm][building] = [];
      acc[farm][building].push(report);
      return acc;
    },
    {} as Record<string, Record<string, typeof reports>>,
  );

  const farmNames = Object.keys(groupedHistory);

  return (
    // FIX: Reduced space-y from 10 to 4 to tighten everything up!
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* 1. HEADER */}
      <div className="bg-card border border-border/50 p-6 lg:p-8 rounded-lg shadow-sm relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-foreground uppercase">
          <Archive className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600 shrink-0" />
          Historical Ledger
        </h1>
        <p className="text-muted-foreground font-medium mt-2 text-sm max-w-2xl">
          Review past performance and financials for every building. Extract
          full End-of-Flock PDF audits for your records.
        </p>
      </div>

      {/* 2. HISTORY DATA TABS */}
      {farmNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border/50 rounded-[2rem]">
          <Archive className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Historical Data</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            You haven't completed any harvests yet. Once a building is fully
            harvested, it will appear here.
          </p>
        </div>
      ) : (
        <Tabs defaultValue={farmNames[0]} className="w-full space-y-4">
          {/* ---> OUTER TABS: FARMS <--- */}
          <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
            <TabsList className="flex h-auto w-max items-center justify-start gap-2 bg-transparent p-0 border-none">
              {farmNames.map((farmName) => (
                <TabsTrigger
                  key={farmName}
                  value={farmName}
                  className="flex items-center gap-2 px-6 py-3.5 text-sm font-black uppercase tracking-widest rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/50 hover:bg-slate-100 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:border-slate-800 data-[state=active]:shadow-md transition-all"
                >
                  <MapPin className="w-4 h-4 shrink-0 opacity-70 data-[state=active]:opacity-100" />
                  <span className="truncate">{farmName}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* FARMS CONTENT */}
          {farmNames.map((farmName) => {
            const buildingNames = Object.keys(groupedHistory[farmName]);

            return (
              // FIX: Removed default mt-2 from TabsContent
              <TabsContent
                key={farmName}
                value={farmName}
                className="outline-none animate-in fade-in zoom-in-95 duration-300 mt-0"
              >
                {/* ---> INNER TABS: BUILDINGS <--- */}
                <Tabs
                  defaultValue={buildingNames[0]}
                  className="w-full space-y-4"
                >
                  {/* BUILDING TAB PILLS */}
                  <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
                    <TabsList className="flex h-auto w-max items-center justify-start gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-[1rem]">
                      {buildingNames.map((buildingName) => (
                        <TabsTrigger
                          key={buildingName}
                          value={buildingName}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all"
                        >
                          <Warehouse className="w-3.5 h-3.5 opacity-70" />
                          {buildingName}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* BUILDINGS CONTENT (THE PAGINATED LOADS) */}
                  {buildingNames.map((buildingName) => {
                    const pastBatches = groupedHistory[farmName][buildingName];

                    return (
                      <TabsContent
                        key={buildingName}
                        value={buildingName}
                        className="outline-none animate-in fade-in duration-500 mt-0"
                      >
                        {/* ---> NEW: Using the Paginated Client Component! <--- */}
                        <BuildingHistoryClient
                          buildingName={buildingName}
                          pastBatches={pastBatches}
                        />
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
