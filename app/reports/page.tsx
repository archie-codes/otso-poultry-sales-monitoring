import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import {
  loads,
  buildings,
  farms,
  dailyRecords,
  expenses,
  harvestRecords,
  feedAllocations,
  feedDeliveries,
} from "../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { FileBarChart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import KPISection from "./KPISection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ActiveBatchCard from "./ActiveBatchCard";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch ONLY ACTIVE Loads for the UI Cards
  const allLoadsData = await db
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
    .where(eq(loads.isActive, true)) // STRICTLY ACTIVE LOADS ONLY
    .orderBy(asc(farms.name), asc(buildings.name), desc(loads.loadDate));

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

  // ---> THE FIX: Fetch ALL LOADS (Active & Inactive) to calculate precise overlap dates <---
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

  // 2. THE UPGRADED NUMBER CRUNCHING ENGINE
  const reports = allLoadsData.map((load) => {
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

    // --- SMART EXPENSE ENGINE (STRICT MIDNIGHT TIME-GATING) ---
    const start = new Date(load.loadDate);
    start.setHours(0, 0, 0, 0);
    const loadStartTime = start.getTime();

    const end = load.harvestDate ? new Date(load.harvestDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const loadEndTime = end.getTime();

    // Direct Building Expenses
    const loadDirectExpenses = allExpenses.filter((e) => e.loadId === load.id);
    const directExpensesAmount = loadDirectExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    // Exact Feed Expense Math
    const loadFeedAllocations = allAllocations.filter(
      (fa) => fa.loadId === load.id,
    );
    const feedExpenses = loadFeedAllocations.reduce(
      (sum, fa) => sum + Number(fa.allocatedQuantity) * Number(fa.unitPrice),
      0,
    );

    // ---> THE FIX: Calculate Shared Expenses based on EXACT DATE OVERLAP <---
    const sharedExpenseShare = allExpenses
      .filter((e) => {
        // Must be a shared expense (no specific building attached)
        if (e.farmId !== load.farmId || e.loadId !== null) return false;

        // Must happen within THIS flock's lifespan
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
        return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
      })
      .reduce((sum, e) => {
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();

        // Dynamic Divisor: How many batches were active on this EXACT day?
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
    // --------------------------------------------------------------------------

    const totalGrossCost =
      directExpensesAmount + sharedExpenseShare + feedExpenses;

    const actualCostPerChick =
      actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

    const totalNetSales = totalRtlAmount - totalGrossCost;

    const loadDateObj = new Date(load.loadDate);
    let ageInDays = 0;
    if (load.isActive) {
      const now = new Date();
      ageInDays = Math.max(
        1,
        Math.floor(
          (now.getTime() - loadDateObj.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
    } else if (load.harvestDate) {
      const harvestDateObj = new Date(load.harvestDate);
      ageInDays = Math.max(
        1,
        Math.floor(
          (harvestDateObj.getTime() - loadDateObj.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    }

    return {
      ...load,
      farmMortality,
      actualHarvest,
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

  // 3. EXECUTIVE GROUPING & TOTALS
  const globalTotals = {
    activeBirds: 0,
    totalCapital: 0,
    totalNetSales: 0,
    totalMortality: 0,
  };

  const groupedData = reports.reduce(
    (acc, report) => {
      const farm = report.farmName;
      if (!acc[farm]) acc[farm] = [];
      acc[farm].push(report);

      if (report.actualHarvest > 0) {
        globalTotals.totalNetSales += report.totalNetSales;
      }

      globalTotals.totalCapital += Number(report.initialCapital);
      globalTotals.totalMortality += report.farmMortality;

      if (report.isActive) {
        const currentLiveBirds =
          Number(report.quantity) - report.farmMortality - report.actualHarvest;
        globalTotals.activeBirds += Math.max(0, currentLiveBirds);
      }
      return acc;
    },
    {} as Record<string, typeof reports>,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* 1. EXECUTIVE HEADER & GLOBAL KPIs */}
      <div className="flex flex-col xl:flex-row gap-6 mb-8">
        <div className="w-full shrink-0 bg-card border border-border/50 p-6 lg:p-8 rounded-lg shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

          <h1 className="text-2xl sm:text-2xl font-black tracking-tight flex items-center gap-3 text-foreground uppercase">
            <FileBarChart className="h-9 w-9 sm:h-10 sm:w-10 text-blue-600 shrink-0" />
            Executive Ledger
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm">
            Master overview structured by Farm Area and individual Building
            performance.
          </p>
          <div className="flex-1 flex flex-col justify-center pt-5">
            <KPISection globalTotals={globalTotals} reports={reports} />
          </div>
        </div>
      </div>

      {/* 2. HIERARCHY: FARM -> BUILDINGS */}
      {Object.keys(groupedData).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border/50 rounded-3xl">
          <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Active Data</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            Load chicks into a building to start seeing automated reports.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedData).map(([farmName, loadsInFarm]) => {
            const defaultTab = loadsInFarm[0]?.id.toString();

            return (
              <div key={farmName} className="space-y-6">
                {/* FARM HEADER */}
                <div className="flex items-center gap-3 pb-2 border-b-[3px] border-blue-600/30">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-foreground">
                    {farmName}
                  </h2>
                </div>

                {/* BUILDING TABS */}
                <div className="w-full max-w-full overflow-hidden">
                  <Tabs defaultValue={defaultTab} className="w-full">
                    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                      <TabsList className="flex h-auto w-max items-center justify-start gap-2 sm:gap-3 bg-transparent p-0 border-none">
                        {loadsInFarm.map((report) => (
                          <TabsTrigger
                            key={`trigger-${report.id}`}
                            value={report.id.toString()}
                            className={cn(
                              "shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
                              "bg-secondary/50 border border-transparent hover:border-border/50 hover:bg-secondary",
                              "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600",
                              "data-[state=active]:shadow-md data-[state=active]:scale-[1.02]",
                            )}
                          >
                            {report.buildingName || "Unnamed"}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* TABS CONTENT: Render the Client Component */}
                    {loadsInFarm.map((report) => (
                      <TabsContent
                        key={`content-${report.id}`}
                        value={report.id.toString()}
                        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                      >
                        <ActiveBatchCard report={report} />
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
