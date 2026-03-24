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
} from "../../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Archive, MapPin, Warehouse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuildingHistoryClient from "./BuildingHistoryClient";

// ---> STRICT TIMEZONE HELPERS <---
const getMidnight = (dateInput: string | Date | null) => {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getEndOfDay = (dateInput: string | Date | null) => {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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

  const allDailyRecords = await db.select().from(dailyRecords);
  const allExpenses = await db.select().from(expenses);
  const allHarvests = await db.select().from(harvestRecords);

  const allLoadsWithFarm = await db
    .select({
      id: loads.id,
      farmId: buildings.farmId,
      buildingName: buildings.name,
      name: loads.name,
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

    return {
      farmId: l.farmId,
      buildingName: l.buildingName,
      name: l.name,
      isActive: l.isActive,
      startTime: getMidnight(l.loadDate),
      endTime: l.isActive
        ? Infinity
        : getEndOfDay(trueHarvestDate || new Date()),
    };
  });

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

    const loadStartTime = getMidnight(load.loadDate);
    const loadEndTime = getEndOfDay(actualHarvestDate || new Date());

    const loadDirectExpenses = allExpenses.filter((e) => e.loadId === load.id);
    const directExpensesAmount = loadDirectExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const sharedExpensesList = allExpenses
      .filter((e) => {
        if (e.farmId !== load.farmId || e.loadId !== null) return false;
        const expenseTime = getMidnight(e.expenseDate || e.createdAt);
        return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
      })
      .map((e) => {
        const expenseTime = getMidnight(e.expenseDate || e.createdAt);
        const activeBatchesOnThisDay = allLoadsWithTrueTimeline.filter(
          (timeline) => {
            if (timeline.farmId !== load.farmId) return false;
            return (
              expenseTime >= timeline.startTime &&
              expenseTime <= timeline.endTime
            );
          },
        );

        const divisor =
          activeBatchesOnThisDay.length > 0 ? activeBatchesOnThisDay.length : 1;
        const sharedDetails = activeBatchesOnThisDay
          .map((b) => `${b.buildingName} [${b.name || "Unnamed"}]`)
          .join(", ");

        return {
          date: e.expenseDate,
          type: e.expenseType,
          remarks: `[Split 1/${divisor}] ${e.remarks || ""} (Shared across: ${sharedDetails})`,
          amount: Number(e.amount) / divisor,
        };
      });

    const sharedExpenseShare = sharedExpensesList.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const totalGrossCost = directExpensesAmount + sharedExpenseShare;

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

    const feedExpenseRecords = loadDirectExpenses.filter(
      (e) => e.expenseType === "feeds",
    );
    const otherExpenseRecords = loadDirectExpenses.filter(
      (e) => e.expenseType !== "feeds",
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
        feeds: feedExpenseRecords.map((e) => ({
          date: e.expenseDate,
          type: e.remarks?.split("of ")[1] || "FEEDS",
          qty: e.remarks?.match(/Consumed ([\d.]+) sacks/)?.[1] || "0",
          cost: Number(e.amount),
        })),
        expenses: [
          ...otherExpenseRecords.map((e) => ({
            date: e.expenseDate,
            type: e.expenseType,
            remarks: e.remarks,
            amount: Number(e.amount),
          })),
          ...sharedExpensesList,
        ],
        sharedExpenseShare,
      },
    };
  });

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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
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

          {farmNames.map((farmName) => {
            const buildingNames = Object.keys(groupedHistory[farmName]);

            return (
              <TabsContent
                key={farmName}
                value={farmName}
                className="outline-none animate-in fade-in zoom-in-95 duration-300 mt-0"
              >
                <Tabs
                  defaultValue={buildingNames[0]}
                  className="w-full space-y-4"
                >
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

                  {buildingNames.map((buildingName) => {
                    const pastBatches = groupedHistory[farmName][buildingName];

                    return (
                      <TabsContent
                        key={buildingName}
                        value={buildingName}
                        className="outline-none animate-in fade-in duration-500 mt-0"
                      >
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
