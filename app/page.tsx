import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/src";
import {
  buildings,
  dailyRecords,
  expenses,
  farms,
  harvestRecords,
  loads,
  users,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bird,
  Building2,
  MapPin,
  Users as UsersIcon,
  Wallet,
  Banknote,
  TrendingUp,
  ArrowRight,
  Layers,
  Warehouse,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import {
  FinancialAreaChart,
  ExpenseDonutChart,
  LiveClock,
  UserRoleChart,
  LiveGreeting,
  AnimatedCounter,
} from "./DashboardCharts";
import { cn } from "@/lib/utils";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const userName = session?.user?.name;

  if (!session) redirect("/login");
  if (userRole === "staff") redirect("/production/monitoring");

  // --- DATA FETCHING ---
  const [
    allLoads,
    allDailyRecords,
    allExpenses,
    allHarvests,
    allFarms,
    allBuildings,
    allUsers,
  ] = await Promise.all([
    db
      .select({
        id: loads.id,
        farmId: farms.id,
        farmName: farms.name,
        buildingId: buildings.id, // Needed for Fleet Overview
        buildingName: buildings.name,
        loadName: loads.name, // Needed for Fleet Overview
        loadDate: loads.loadDate,
        harvestDate: loads.harvestDate,
        quantity: loads.actualQuantityLoad,
        initialCapital: loads.initialCapital,
        isActive: loads.isActive,
      })
      .from(loads)
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .innerJoin(farms, eq(buildings.farmId, farms.id)),
    db.select().from(dailyRecords),
    db.select().from(expenses),
    db.select().from(harvestRecords),
    db.select().from(farms),
    db.select().from(buildings),
    db.select().from(users),
  ]);

  const activeLoads = allLoads.filter((load) => load.isActive);

  // --- MATH & AGGREGATIONS ---
  const totalSales = allHarvests.reduce(
    (sum, h) => sum + h.quantity * Number(h.sellingPrice),
    0,
  );
  const totalExpenses = allExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const totalCapital = activeLoads.reduce(
    (sum, l) => sum + Number(l.initialCapital || 0),
    0,
  );

  const liveBirds = activeLoads.reduce((sum, load) => {
    const loadMortality = allDailyRecords
      .filter((r) => r.loadId === load.id)
      .reduce((s, r) => s + r.mortality, 0);
    const harvestedBirds = allHarvests
      .filter((h) => h.loadId === load.id)
      .reduce((s, h) => s + h.quantity, 0);
    return sum + Math.max(0, load.quantity - loadMortality - harvestedBirds);
  }, 0);

  // --- FLEET OVERVIEW DATA STRUCTURE ---
  const allInfra = await db
    .select({
      farmId: farms.id,
      farmName: farms.name,
      buildingId: buildings.id,
      buildingName: buildings.name,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const fleetData = allInfra.reduce(
    (acc, infra) => {
      if (!acc[infra.farmName]) {
        acc[infra.farmName] = { farmId: infra.farmId, buildings: [] };
      }

      const activeBatch = activeLoads.find(
        (l) => l.buildingId === infra.buildingId,
      );
      let currentLive = 0;
      let currentMortality = 0;
      let ageInDays = 0;

      if (activeBatch) {
        const batchRecords = allDailyRecords.filter(
          (r) => r.loadId === activeBatch.id,
        );
        currentMortality = batchRecords.reduce(
          (sum, r) => sum + Number(r.mortality),
          0,
        );
        currentLive = Math.max(
          0,
          (Number(activeBatch.quantity) || 0) - currentMortality,
        );

        const loadDateObj = new Date(activeBatch.loadDate);
        loadDateObj.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        ageInDays = Math.max(
          1,
          Math.floor(
            (today.getTime() - loadDateObj.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
      }

      acc[infra.farmName].buildings.push({
        buildingId: infra.buildingId,
        buildingName: infra.buildingName,
        activeBatch,
        liveBirds: currentLive,
        mortality: currentMortality,
        ageInDays,
      });

      return acc;
    },
    {} as Record<string, { farmId: number; buildings: any[] }>,
  );

  Object.keys(fleetData).forEach((farmName) => {
    fleetData[farmName].buildings.sort((a, b) =>
      a.buildingName.localeCompare(b.buildingName, undefined, {
        numeric: true,
      }),
    );
  });

  // --- TREND DATA (Last 6 Months) ---
  const today = new Date();
  const monthWindow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (5 - index),
      1,
    );
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthlyTrendMap = new Map<
    string,
    { month: string; sales: number; expenses: number; net: number }
  >();
  for (const month of monthWindow) {
    const [year, m] = month.split("-").map(Number);
    const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(year, m - 1, 1),
    );
    monthlyTrendMap.set(month, { month: label, sales: 0, expenses: 0, net: 0 });
  }

  for (const harvest of allHarvests) {
    const monthKey = harvest.harvestDate.slice(0, 7);
    const target = monthlyTrendMap.get(monthKey);
    if (target) target.sales += harvest.quantity * Number(harvest.sellingPrice);
  }

  for (const expense of allExpenses) {
    const monthKey = expense.expenseDate.slice(0, 7);
    const target = monthlyTrendMap.get(monthKey);
    if (target) target.expenses += Number(expense.amount);
  }

  const monthlyTrendData = Array.from(monthlyTrendMap.values()).map(
    (entry) => ({
      ...entry,
      net: entry.sales - entry.expenses,
    }),
  );

  const currentMonthData = monthlyTrendData[monthlyTrendData.length - 1];
  const prevMonthData = monthlyTrendData[monthlyTrendData.length - 2];
  const salesGrowth =
    prevMonthData.sales > 0
      ? ((currentMonthData.sales - prevMonthData.sales) / prevMonthData.sales) *
        100
      : 0;

  // --- DONUT CHART DATA ---
  const categoryMap = new Map<string, number>();
  for (const expense of allExpenses) {
    const amount = Number(expense.amount);
    categoryMap.set(
      expense.expenseType,
      (categoryMap.get(expense.expenseType) || 0) + amount,
    );
  }
  const expenseDonutData = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name: name.replace("_", " ").toUpperCase(),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const DONUT_COLORS = [
    "bg-indigo-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-purple-500",
  ];

  // --- USER ROLE DATA ---
  const userRolesMap = new Map<string, number>();
  for (const u of allUsers) {
    const r = (u.role as string) || "user";
    userRolesMap.set(r, (userRolesMap.get(r) || 0) + 1);
  }
  const userRoleData = Array.from(userRolesMap.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* HEADER WITH DYNAMIC GREETING & CLOCK */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <LiveGreeting userName={userName} />
          <LiveClock />
        </div>
        <div className="bg-card border border-border/50 rounded-lg px-5 py-3 shadow-sm flex items-center justify-between w-full md:w-auto md:min-w-[300px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Active Capital
            </span>
            <span className="text-lg font-black text-indigo-500">
              <AnimatedCounter value={totalCapital} formatType="peso" />
            </span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 text-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BENTO GRID LEVEL 1: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Gross Revenue",
            value: totalSales,
            format: "compact" as const,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            trend: salesGrowth,
          },
          {
            label: "Gross Expenses",
            value: totalExpenses,
            format: "compact" as const,
            icon: Banknote,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            trend: null,
          },
          {
            label: "Active Capital",
            value: totalCapital,
            format: "compact" as const,
            icon: Wallet,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            trend: null,
          },
          {
            label: "Live Population",
            value: liveBirds,
            format: "number" as const,
            icon: Bird,
            color: "text-sky-500",
            bg: "bg-sky-500/10",
            trend: null,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border/50 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend !== null && (
                <div
                  className={cn(
                    "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
                    stat.trend >= 0
                      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                      : "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
                  )}
                >
                  {stat.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(stat.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-lg font-black tracking-tight text-foreground">
                <AnimatedCounter value={stat.value} formatType={stat.format} />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* BENTO GRID LEVEL 2: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Area Chart */}
        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-black tracking-tight text-foreground">
              Revenue vs. Spend
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              6-Month Trailing Comparison
            </p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <FinancialAreaChart data={monthlyTrendData} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-black tracking-tight text-foreground">
              Cost Distribution
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Lifetime expense breakdown
            </p>
          </div>
          <ExpenseDonutChart data={expenseDonutData} />
          <div className="mt-4 space-y-3">
            {expenseDonutData.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${DONUT_COLORS[idx % DONUT_COLORS.length]}`}
                  ></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[100px]">
                    {cat.name}
                  </span>
                </div>
                <span className="text-sm font-black text-foreground">
                  ₱
                  {new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: THE FLEET OVERVIEW (FARM HIERARCHY) */}
      <div className="pt-6 border-t border-border/50 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Fleet Overview
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Real-time status of all farms, buildings, and active flocks.
            </p>
          </div>
        </div>

        {Object.entries(fleetData).map(([farmName, farmData]) => {
          const totalBuildings = farmData.buildings.length;
          const activeCount = farmData.buildings.filter(
            (b) => b.activeBatch,
          ).length;
          const farmUtilization =
            totalBuildings > 0 ? (activeCount / totalBuildings) * 100 : 0;

          return (
            <div key={farmName} className="space-y-4">
              {/* Farm Header */}
              <div className="flex items-center justify-between pb-2 border-b-[3px] border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-xl">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-foreground">
                    {farmName}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
                    Utilization:
                  </span>
                  <span
                    className={cn(
                      "text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest",
                      farmUtilization === 100
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : farmUtilization > 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {activeCount} / {totalBuildings} Active
                  </span>
                </div>
              </div>

              {/* Buildings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {farmData.buildings.map((bldg) => (
                  <div
                    key={bldg.buildingId}
                    className={cn(
                      "rounded-[1.5rem] border shadow-sm transition-all duration-300 relative overflow-hidden group flex flex-col",
                      bldg.activeBatch
                        ? "bg-white dark:bg-slate-950 border-emerald-200/60 dark:border-emerald-900/30 hover:shadow-md"
                        : "bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-border hover:bg-slate-50 dark:hover:bg-slate-900/40",
                    )}
                  >
                    {/* Active Indicator Strip */}
                    {bldg.activeBatch && (
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-emerald-400 to-blue-500" />
                    )}

                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                            <Warehouse
                              className={cn(
                                "w-4 h-4",
                                bldg.activeBatch
                                  ? "text-emerald-600 dark:text-emerald-500"
                                  : "text-muted-foreground opacity-50",
                              )}
                            />
                            {bldg.buildingName}
                          </h4>
                          {bldg.activeBatch && (
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              Batch:{" "}
                              <span className="text-foreground">
                                {bldg.activeBatch.loadName || "Unnamed"}
                              </span>
                            </p>
                          )}
                        </div>

                        {bldg.activeBatch ? (
                          <div className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                            Day {bldg.ageInDays}
                          </div>
                        ) : (
                          <div className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                            Empty
                          </div>
                        )}
                      </div>

                      {bldg.activeBatch ? (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 block mb-1">
                              Live Birds
                            </span>
                            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                              {bldg.liveBirds.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-500 block mb-1">
                              Mortality
                            </span>
                            <span className="text-xl font-black text-red-700 dark:text-red-400">
                              {bldg.mortality.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center opacity-70 grayscale">
                          <AlertCircle className="w-8 h-8 text-muted-foreground mb-2 opacity-20" />
                          <p className="text-sm font-bold text-muted-foreground">
                            Ready for next cycle
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-3 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/20">
                      {bldg.activeBatch ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/production/monitoring"
                            className="flex items-center justify-center w-full py-2 bg-white dark:bg-slate-950 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:border-slate-400 transition-all"
                          >
                            <Activity className="w-3.5 h-3.5 mr-1.5" /> Monitor
                          </Link>
                          <Link
                            href="/reports"
                            className="flex items-center justify-center w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs font-bold transition-all"
                          >
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> View
                            Report
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href="/production/loading"
                          className="flex items-center justify-center w-full py-2 bg-white dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-all group"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5 opacity-50 group-hover:opacity-100" />{" "}
                          Load New Flock
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* BENTO GRID LEVEL 4: SYSTEM STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-black tracking-tight text-foreground">
              System Overview
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Total registered entities
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 border border-border/50">
              <MapPin className="w-5 h-5 text-indigo-500 mb-2" />
              <span className="text-lg font-black">
                <AnimatedCounter value={allFarms.length} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Farms
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 border border-border/50">
              <Building2 className="w-5 h-5 text-sky-500 mb-2" />
              <span className="text-lg font-black">
                <AnimatedCounter value={allBuildings.length} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Bldgs
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 border border-border/50">
              <Layers className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-lg font-black">
                <AnimatedCounter value={allLoads.length} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Loads
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 border border-border/50">
              <UsersIcon className="w-5 h-5 text-emerald-500 mb-2" />
              <span className="text-lg font-black">
                <AnimatedCounter value={allUsers.length} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Users
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-emerald-500" />
              <h3 className="text-base font-black tracking-tight text-foreground">
                Team Roles
              </h3>
            </div>
          </div>
          <UserRoleChart data={userRoleData} />
        </div>
      </div>
    </div>
  );
}
