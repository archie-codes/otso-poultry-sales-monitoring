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
import {
  FileBarChart,
  MapPin,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import KPISection from "./KPISection";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch ONLY ACTIVE Loads for the Executive Ledger
  const allLoadsData = await db
    .select({
      id: loads.id,
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

  // 2. THE UPGRADED NUMBER CRUNCHING ENGINE
  const reports = allLoadsData.map((load) => {
    const actualQuantityLoad = load.quantity;

    const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
    const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

    const loadHarvests = allHarvests.filter((h) => h.loadId === load.id);
    const actualHarvest = loadHarvests.reduce((sum, h) => sum + h.quantity, 0);
    const totalRtlAmount = loadHarvests.reduce(
      (sum, h) => sum + h.quantity * Number(h.sellingPrice),
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
    start.setHours(0, 0, 0, 0); // Force strictly to start of day
    const loadStartTime = start.getTime();

    const end = load.harvestDate ? new Date(load.harvestDate) : new Date();
    end.setHours(23, 59, 59, 999); // Force strictly to end of day
    const loadEndTime = end.getTime();

    // Calculate Direct Building Expenses (Strictly from the database)
    const directExpensesAmount = allExpenses
      .filter((e) => e.loadId === load.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate Shared Farm Expenses strictly within timeline
    const farmActiveLoadsCount =
      allLoadsData.filter((l) => l.farmId === load.farmId && l.isActive)
        .length || 1;

    const sharedExpensesTotal = allExpenses
      .filter((e) => {
        // Must be a shared expense (no specific building attached)
        if (e.farmId !== load.farmId || e.loadId !== null) return false;

        // Strict Time-gate
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
        return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const sharedExpenseShare = sharedExpensesTotal / farmActiveLoadsCount;
    // -----------------------------------------

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

      globalTotals.totalNetSales += report.totalNetSales;
      globalTotals.totalCapital += Number(report.initialCapital);
      globalTotals.totalMortality += report.farmMortality;

      if (report.isActive) {
        const currentLiveBirds =
          report.quantity - report.farmMortality - report.actualHarvest;
        globalTotals.activeBirds += Math.max(0, currentLiveBirds);
      }
      return acc;
    },
    {} as Record<string, typeof reports>,
  );

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. EXECUTIVE HEADER & GLOBAL KPIs */}
      <div className="flex flex-col xl:flex-row gap-6 mb-8">
        <div className="w-full xl:w-[35%] shrink-0 bg-card border border-border/50 p-6 lg:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

          <h1 className="text-3xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-foreground uppercase">
            <FileBarChart className="h-9 w-9 sm:h-10 sm:w-10 text-blue-600 shrink-0" />
            Executive Ledger
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm">
            Master overview structured by Farm Area and individual Building
            performance.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <KPISection globalTotals={globalTotals} reports={reports} />
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
          {Object.entries(groupedData).map(([farmName, loadsInFarm]) => (
            <div key={farmName} className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b-[3px] border-blue-600/30">
                <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                <h2 className="text-2xl sm:text-3xl md:text-3xl font-black tracking-tighter uppercase text-foreground">
                  {farmName}
                </h2>
              </div>

              <div className="pl-0 sm:pl-4 space-y-8 sm:border-l-2 sm:border-slate-200 dark:sm:border-slate-800">
                <div className="grid grid-cols-1 gap-8">
                  {loadsInFarm.map((report) => (
                    <div
                      key={report.id}
                      className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md"
                    >
                      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground">
                              {report.buildingName}
                            </h4>
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Active
                            </span>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                              Day {report.ageInDays}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Image
                              src="/hen.svg"
                              alt="Hen"
                              width={16}
                              height={16}
                              className="object-contain dark:invert opacity-80"
                            />
                            <p className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                              {report.chickType || "Standard Breed"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl w-fit">
                          <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Loaded:{" "}
                          {new Date(report.loadDate).toLocaleDateString()}
                        </div>
                      </div>

                      {/* CARD BODY: METRICS GRID */}
                      <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Target Harvest
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {report.harvestDate
                              ? new Date(
                                  report.harvestDate,
                                ).toLocaleDateString()
                              : "TBD"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Customer Name
                          </p>
                          <p
                            className="text-xs sm:text-sm font-bold text-foreground truncate"
                            title={report.displayCustomer}
                          >
                            {report.displayCustomer}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Percent Harvest
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-primary">
                            {report.percentHarvest.toFixed(1)}%
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Actual Qty Load
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {report.quantity.toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
                            Mortality
                          </p>
                          <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
                            {report.farmMortality.toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                            Actual Harvest
                          </p>
                          <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
                            {report.actualHarvest.toLocaleString()}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Actual Cost/Chick
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {formatMoney(report.actualCostPerChick)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500">
                            Selling Price
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatMoney(Number(report.sellingPrice))}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                            Total Gross (Expenses)
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500">
                            {formatMoney(report.totalGrossCost)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Total RTL Amount
                          </p>
                          <p className="text-xs sm:text-sm font-black text-foreground">
                            {formatMoney(report.totalRtlAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-100 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 rounded-b-[2.5rem]">
                        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-[1.5rem] border border-border/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Capital
                              </p>
                              <p className="text-lg sm:text-xl font-black text-foreground">
                                {formatMoney(Number(report.initialCapital))}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex items-center justify-between p-3 sm:p-4 rounded-[1.5rem] shadow-sm border",
                            report.totalNetSales >= 0
                              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                              : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2 sm:p-2.5 rounded-xl",
                                report.totalNetSales >= 0
                                  ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                                  : "bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-400",
                              )}
                            >
                              {report.totalNetSales >= 0 ? (
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                                  report.totalNetSales >= 0
                                    ? "text-emerald-700 dark:text-emerald-500"
                                    : "text-red-700 dark:text-red-500",
                                )}
                              >
                                Total Net Sales
                              </p>
                              <p
                                className={cn(
                                  "text-lg sm:text-xl md:text-2xl font-black",
                                  report.totalNetSales >= 0
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-red-700 dark:text-red-400",
                                )}
                              >
                                {formatMoney(report.totalNetSales)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
