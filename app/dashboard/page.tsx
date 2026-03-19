import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src";
import {
  buildings,
  dailyRecords,
  expenses,
  farms,
  harvestRecords,
  loads,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Egg,
  Landmark,
  MapPin,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { FarmBarChart, TrendAreaChart } from "./DashboardCharts";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const compactPesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatPeso(amount: number) {
  return pesoFormatter.format(amount);
}

function formatCompactPeso(amount: number) {
  return compactPesoFormatter.format(amount);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDateLabel(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function differenceInDays(startDate: string | Date, endDate: string | Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (!session) {
    redirect("/login");
  }

  if (userRole === "staff") {
    redirect("/production/monitoring");
  }

  const [allLoads, allDailyRecords, allExpenses, allHarvests] =
    await Promise.all([
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
          customerName: loads.customerName,
          isActive: loads.isActive,
        })
        .from(loads)
        .innerJoin(buildings, eq(loads.buildingId, buildings.id))
        .innerJoin(farms, eq(buildings.farmId, farms.id)),
      db.select().from(dailyRecords),
      db.select().from(expenses),
      db.select().from(harvestRecords),
    ]);

  const activeLoads = allLoads.filter((load) => load.isActive);
  const loadLookup = new Map(allLoads.map((load) => [load.id, load]));
  const farmLookup = new Map(
    allLoads.map((load) => [load.farmId, load.farmName]),
  );

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = today.getFullYear();
  const monthWindow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (5 - index),
      1,
    );
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const totalSales = allHarvests.reduce(
    (sum, harvest) => sum + harvest.quantity * Number(harvest.sellingPrice),
    0,
  );
  const totalExpenses = allExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  const totalCapital = activeLoads.reduce(
    (sum, load) => sum + Number(load.initialCapital || 0),
    0,
  );
  const totalMortality = allDailyRecords.reduce(
    (sum, record) => sum + record.mortality,
    0,
  );
  const todayMortality = allDailyRecords
    .filter((record) => record.recordDate === todayKey)
    .reduce((sum, record) => sum + record.mortality, 0);

  const liveBirds = activeLoads.reduce((sum, load) => {
    const loadMortality = allDailyRecords
      .filter((record) => record.loadId === load.id)
      .reduce((recordSum, record) => recordSum + record.mortality, 0);
    const harvestedBirds = allHarvests
      .filter((harvest) => harvest.loadId === load.id)
      .reduce((harvestSum, harvest) => harvestSum + harvest.quantity, 0);

    return sum + Math.max(0, load.quantity - loadMortality - harvestedBirds);
  }, 0);

  const monthlyTrendMap = new Map<
    string,
    { month: string; sales: number; expenses: number; net: number }
  >();

  for (const month of monthWindow) {
    monthlyTrendMap.set(month, {
      month: formatMonthLabel(month),
      sales: 0,
      expenses: 0,
      net: 0,
    });
  }

  for (const harvest of allHarvests) {
    const monthKey = harvest.harvestDate.slice(0, 7);
    const target = monthlyTrendMap.get(monthKey);
    if (target) {
      target.sales += harvest.quantity * Number(harvest.sellingPrice);
    }
  }

  for (const expense of allExpenses) {
    const monthKey = expense.expenseDate.slice(0, 7);
    const target = monthlyTrendMap.get(monthKey);
    if (target) {
      target.expenses += Number(expense.amount);
    }
  }

  const monthlyTrendData = Array.from(monthlyTrendMap.values()).map(
    (entry) => ({
      ...entry,
      net: entry.sales - entry.expenses,
    }),
  );

  const currentMonthData = monthlyTrendData[monthlyTrendData.length - 1] || {
    month: formatMonthLabel(currentMonthKey),
    sales: 0,
    expenses: 0,
    net: 0,
  };

  const previousMonthData = monthlyTrendData[monthlyTrendData.length - 2] || {
    month: "Prev",
    sales: 0,
    expenses: 0,
    net: 0,
  };

  const monthlyGrowth =
    previousMonthData.sales > 0
      ? ((currentMonthData.sales - previousMonthData.sales) /
          previousMonthData.sales) *
        100
      : currentMonthData.sales > 0
        ? 100
        : 0;

  const todaySales = allHarvests
    .filter((harvest) => harvest.harvestDate === todayKey)
    .reduce(
      (sum, harvest) => sum + harvest.quantity * Number(harvest.sellingPrice),
      0,
    );

  const todayExpenses = allExpenses
    .filter((expense) => expense.expenseDate === todayKey)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const farmSalesMap = new Map<string, number>();
  const farmExpenseMap = new Map<string, number>();

  for (const harvest of allHarvests) {
    const farmName = loadLookup.get(harvest.loadId)?.farmName;
    if (!farmName) continue;
    farmSalesMap.set(
      farmName,
      (farmSalesMap.get(farmName) || 0) +
        harvest.quantity * Number(harvest.sellingPrice),
    );
  }

  for (const expense of allExpenses) {
    const farmName = farmLookup.get(expense.farmId);
    if (!farmName) continue;
    farmExpenseMap.set(
      farmName,
      (farmExpenseMap.get(farmName) || 0) + Number(expense.amount),
    );
  }

  const farmPerformance = Array.from(
    new Set([
      ...farmSalesMap.keys(),
      ...farmExpenseMap.keys(),
      ...allLoads.map((load) => load.farmName),
    ]),
  )
    .map((farmName) => ({
      farm: farmName,
      sales: farmSalesMap.get(farmName) || 0,
      expenses: farmExpenseMap.get(farmName) || 0,
      net:
        (farmSalesMap.get(farmName) || 0) - (farmExpenseMap.get(farmName) || 0),
      activeLoads: activeLoads.filter((load) => load.farmName === farmName)
        .length,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const topFarm = farmPerformance[0];

  const urgentLoads = activeLoads
    .map((load) => {
      const daysActive = differenceInDays(load.loadDate, today);
      const daysToHarvest = load.harvestDate
        ? differenceInDays(today, load.harvestDate)
        : null;
      const loadMortality = allDailyRecords
        .filter((record) => record.loadId === load.id)
        .reduce((sum, record) => sum + record.mortality, 0);
      const mortalityRate =
        load.quantity > 0 ? (loadMortality / load.quantity) * 100 : 0;
      const urgencyScore =
        (daysToHarvest !== null && daysToHarvest <= 3 ? 3 : 0) +
        (mortalityRate >= 5 ? 2 : 0);

      return {
        ...load,
        daysActive,
        daysToHarvest,
        mortalityRate,
        loadMortality,
        urgencyScore,
      };
    })
    .filter((load) => load.daysToHarvest !== null || load.mortalityRate > 0)
    .sort(
      (a, b) =>
        b.urgencyScore - a.urgencyScore ||
        (a.daysToHarvest ?? 999) - (b.daysToHarvest ?? 999),
    )
    .slice(0, 4);

  const recentHarvests = [...allHarvests]
    .sort(
      (a, b) =>
        new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime(),
    )
    .slice(0, 5)
    .map((harvest) => {
      const load = loadLookup.get(harvest.loadId);
      return {
        id: harvest.id,
        harvestDate: harvest.harvestDate,
        quantity: harvest.quantity,
        customerName: harvest.customerName,
        sales: harvest.quantity * Number(harvest.sellingPrice),
        loadName: load?.buildingName || `Load #${harvest.loadId}`,
        farmName: load?.farmName || "Archived Farm",
      };
    });

  const salesRunRate =
    currentMonthData.net > 0 && today.getDate() > 0
      ? (currentMonthData.net / today.getDate()) *
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      : 0;

  const yearToDateSales = allHarvests
    .filter(
      (harvest) => new Date(harvest.harvestDate).getFullYear() === currentYear,
    )
    .reduce(
      (sum, harvest) => sum + harvest.quantity * Number(harvest.sellingPrice),
      0,
    );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_35%),linear-gradient(135deg,#0f172a_0%,#052e2b_52%,#ecfdf5_160%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-8 lg:p-10">
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-50 backdrop-blur">
              <Target className="h-3.5 w-3.5" />
              Sales Command Center
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Main dashboard for revenue, cost pressure, and flock momentum.
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-6 text-emerald-50/82 sm:text-base">
                Executive view of live operations across farms, showing how
                active loads, harvest revenue, and expense drag are shaping the
                month.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-50/70">
                  This Month Sales
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight">
                  {formatCompactPeso(currentMonthData.sales)}
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-50/75">
                  {monthlyGrowth >= 0 ? "+" : ""}
                  {monthlyGrowth.toFixed(1)}% vs {previousMonthData.month}
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-50/70">
                  Net Position
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight">
                  {formatCompactPeso(totalSales - totalExpenses)}
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-50/75">
                  {formatCompactPeso(salesRunRate)} projected month-end net
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-50/70">
                  Live Birds
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight">
                  {formatNumber(liveBirds)}
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-50/75">
                  {activeLoads.length} active loads under watch
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/12 bg-slate-950/30 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                  Top Farm
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight">
                  {topFarm?.farm || "No data"}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-50/75">
                  {topFarm
                    ? `${formatPeso(topFarm.sales)} gross sales`
                    : "Waiting for recorded harvests"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-400/18 p-3 text-emerald-100">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                  Harvests Today
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatCompactPeso(todaySales)}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/65">
                  Same-day sales captured from harvest logs
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                  Expenses Today
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatCompactPeso(todayExpenses)}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/65">
                  Current day cash-out pressure
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Sales",
            value: formatPeso(totalSales),
            note: `${formatCompactPeso(currentMonthData.sales)} closed this month`,
            icon: TrendingUp,
            tone: "from-emerald-500/18 to-emerald-100",
            iconTone: "bg-emerald-500 text-white",
          },
          {
            title: "Total Expenses",
            value: formatPeso(totalExpenses),
            note: `${formatCompactPeso(currentMonthData.expenses)} booked this month`,
            icon: TrendingDown,
            tone: "from-orange-500/18 to-orange-100",
            iconTone: "bg-orange-500 text-white",
          },
          {
            title: "Working Capital",
            value: formatPeso(totalCapital),
            note: `${activeLoads.length} live batches funded`,
            icon: Landmark,
            tone: "from-sky-500/18 to-sky-100",
            iconTone: "bg-sky-500 text-white",
          },
          {
            title: "Mortality Logged",
            value: formatNumber(totalMortality),
            note: `${formatNumber(todayMortality)} birds reported today`,
            icon: ShieldAlert,
            tone: "from-rose-500/18 to-rose-100",
            iconTone: "bg-rose-500 text-white",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm"
          >
            <div
              className={`absolute inset-x-0 top-0 h-28 bg-glinear-to-br ${item.tone} opacity-90`}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-foreground lg:text-3xl">
                  {item.value}
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {item.note}
                </p>
              </div>
              <div className={`rounded-2xl p-3 shadow-lg ${item.iconTone}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">
                Revenue vs spend
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
                Six-month trendline
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sales and expense movement based on harvest and expense records.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right dark:bg-emerald-950/30">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-700 dark:text-emerald-400">
                Current month net
              </p>
              <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-400">
                {formatPeso(currentMonthData.net)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <TrendAreaChart data={monthlyTrendData} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-700">
                Farm ranking
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
                Best sales contributors
              </h2>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5">
            {farmPerformance.length > 0 ? (
              <FarmBarChart
                data={farmPerformance.map((farm) => ({
                  farm: farm.farm,
                  sales: farm.sales,
                }))}
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-secondary/30 text-sm font-semibold text-muted-foreground">
                No farm sales data yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-700">
                Operational pressure
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
                Loads needing attention
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Priority loads based on harvest deadlines and mortality
                pressure.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              <CalendarClock className="h-3.5 w-3.5" />
              Live Monitoring
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {urgentLoads.length > 0 ? (
              urgentLoads.map((load) => (
                <div
                  key={load.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.8),rgba(255,255,255,1))] p-4 dark:bg-none dark:bg-secondary/20 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black tracking-tight text-foreground">
                        {load.farmName}
                      </p>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {load.buildingName}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Day {load.daysActive} in cycle with{" "}
                      {formatNumber(load.quantity)} birds originally loaded.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[390px]">
                    <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700 dark:text-amber-400">
                        Days to harvest
                      </p>
                      <p className="mt-1 text-xl font-black text-amber-700 dark:text-amber-400">
                        {load.daysToHarvest ?? "TBD"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/20">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-700 dark:text-rose-400">
                        Mortality rate
                      </p>
                      <p className="mt-1 text-xl font-black text-rose-700 dark:text-rose-400">
                        {load.mortalityRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
                        Total mortality
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
                        {formatNumber(load.loadMortality)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-52 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-secondary/30 text-sm font-semibold text-muted-foreground">
                No urgent loads detected from current records.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">
                Recent cash events
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
                Latest harvest sales
              </h2>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {recentHarvests.length > 0 ? (
              recentHarvests.map((harvest) => (
                <div
                  key={harvest.id}
                  className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-border/60 bg-secondary/25 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-foreground">
                      {harvest.farmName}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
                      {harvest.loadName} •{" "}
                      {harvest.customerName || "Walk-in buyer"}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDateLabel(harvest.harvestDate)} •{" "}
                      {formatNumber(harvest.quantity)} birds
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {formatPeso(harvest.sales)}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                      Closed
                      <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-52 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-secondary/30 text-sm font-semibold text-muted-foreground">
                No harvest sales recorded yet.
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-3 rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                  Year-to-date sales
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatCompactPeso(yearToDateSales)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Egg className="h-5 w-5 text-amber-200" />
              </div>
            </div>
            <p className="text-sm font-medium leading-6 text-white/68">
              Based on recorded harvest batches and sale prices captured in the
              system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
