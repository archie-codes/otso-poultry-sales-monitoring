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
} from "../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { FileBarChart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import KPISection from "./KPISection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActiveBatchCard from "./ActiveBatchCard";

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

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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
    .where(eq(loads.isActive, true))
    .orderBy(asc(farms.name), asc(buildings.name), desc(loads.loadDate));

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

    const loadStartTime = getMidnight(load.loadDate);
    const loadEndTime = load.isActive
      ? Infinity
      : getEndOfDay(load.harvestDate || new Date());

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

      if (report.actualHarvest > 0)
        globalTotals.totalNetSales += report.totalNetSales;

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
                <div className="flex items-center gap-3 pb-2 border-b-[3px] border-blue-600/30">
                  <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-foreground">
                    {farmName}
                  </h2>
                </div>

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
