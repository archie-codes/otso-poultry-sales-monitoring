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
  Layers, // <--- Imported for the "Total Loads" icon
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
        buildingName: buildings.name,
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

  // Trend Data (Last 6 Months)
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

  // Donut Chart Data
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

  // THE FIX: Farm Progress Bars (Survival Rate)
  const farmStatsMap = new Map<string, { live: number; original: number }>();
  for (const load of activeLoads) {
    const loadMortality = allDailyRecords
      .filter((r) => r.loadId === load.id)
      .reduce((s, r) => s + r.mortality, 0);
    const harvestedBirds = allHarvests
      .filter((h) => h.loadId === load.id)
      .reduce((s, h) => s + h.quantity, 0);
    const currentLive = Math.max(
      0,
      load.quantity - loadMortality - harvestedBirds,
    );

    const existing = farmStatsMap.get(load.farmName) || {
      live: 0,
      original: 0,
    };
    farmStatsMap.set(load.farmName, {
      live: existing.live + currentLive,
      original: existing.original + load.quantity,
    });
  }
  const farmBirdData = Array.from(farmStatsMap.entries())
    .map(([name, stats]) => ({
      name,
      count: stats.live,
      original: stats.original,
    }))
    .sort((a, b) => b.count - a.count);

  // User Role Data
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
        {/* THE FIX: Replaced "Total Net" with "Total Active Capital" */}
        <div className="bg-card border border-border/50 rounded-lg px-5 py-3 shadow-sm flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Active Capital
            </span>
            <span className="text-lg font-black text-indigo-500">
              <AnimatedCounter value={totalCapital} formatType="peso" />
            </span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
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

      {/* BENTO GRID LEVEL 3: INFRASTRUCTURE & FARMS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* THE FIX: Infrastructure & Users Stats (Added Total Loads!) */}
        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-black tracking-tight text-foreground">
              System & Users
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Active platform entities
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
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
                Buildings
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 border border-border/50">
              <Layers className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-lg font-black">
                <AnimatedCounter value={allLoads.length} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Loads
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

          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-black uppercase tracking-wider text-foreground">
                  Team Roles
                </span>
              </div>
            </div>
            <UserRoleChart data={userRoleData} />
          </div>
        </div>

        {/* Farm Progress Bars */}
        <div className="bg-card border border-border/50 rounded-lg p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground">
                Survival Rate by Farm
              </h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">
                Live birds remaining vs original load
              </p>
            </div>
            <Link
              href="/production/loading"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors shadow-sm shrink-0"
            >
              View All Loads <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-6 flex-1">
            {farmBirdData.length > 0 ? (
              farmBirdData.map((farm, idx) => {
                // THE FIX: Math calculates survival rate instead of distribution!
                const percentage =
                  farm.original > 0 ? (farm.count / farm.original) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-black uppercase tracking-wider text-foreground">
                        {farm.name}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-black text-foreground">
                          {new Intl.NumberFormat("en-US").format(farm.count)}{" "}
                          birds
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground ml-2">
                          ({percentage.toFixed(1)}% Survival)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden border border-border/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          percentage < 80
                            ? "bg-rose-500"
                            : percentage < 90
                              ? "bg-amber-500"
                              : "bg-indigo-500",
                        )}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-secondary/30 text-sm font-bold text-muted-foreground">
                No active birds to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
