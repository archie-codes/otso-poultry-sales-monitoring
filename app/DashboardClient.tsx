"use client";

import { useState } from "react";
import {
  Wallet,
  Warehouse,
  TrendingUp,
  ArrowRight,
  Filter,
  AlertCircle,
  CalendarCheck,
  MapPin,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Image from "next/image";
import henIcon from "@/public/hen.png";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Custom Hen Component ---
const HenIcon = ({ className }: { className?: string }) => (
  <span className={`relative block shrink-0 ${className ?? ""}`}>
    <Image
      src={henIcon}
      alt="Hen"
      fill
      sizes="64px"
      className="object-contain dark:brightness-0 dark:invert"
    />
  </span>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-white font-black text-lg">
          {payload[0].value.toLocaleString()}{" "}
          <span className="text-blue-400 text-sm">Birds</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardClient({
  userName,
  imageUrl,
  metrics,
  chartData,
  upcomingHarvests,
  provinces = [],
  farms = [],
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Combobox States ---
  const [openProvince, setOpenProvince] = useState(false);
  const [openFarm, setOpenFarm] = useState(false);

  const selectedProvince = searchParams.get("province") || "all";
  const selectedFarm = searchParams.get("farm") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
      if (key === "province") params.delete("farm");
    } else {
      params.set(key, value);
      if (key === "province") params.delete("farm");
    }

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "U"
    );
  };

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
      {/* 1. WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 to-indigo-800 p-8 sm:p-10 shadow-lg border border-blue-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="hidden sm:flex h-16 w-16 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md border border-white/20 shadow-inner overflow-hidden relative shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={userName || "User"}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-white">
                {getInitials(userName)}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="text-blue-100 font-medium text-lg max-w-xl">
              Here is what's happening across the network. You have{" "}
              <strong className="text-white">
                {metrics.activeLoadsCount} active loads
              </strong>{" "}
              in production.
            </p>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-card border border-border/50 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center text-muted-foreground mr-2 shrink-0 px-2">
          <Filter className="w-5 h-5 mr-2 text-blue-500" />
          <span className="text-xs font-black uppercase tracking-widest">
            Filters
          </span>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* --- COMBOBOX: PROVINCE --- */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/50 transition-shadow">
            <Popover open={openProvince} onOpenChange={setOpenProvince}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={openProvince}
                  className="w-full justify-between h-14 hover:bg-transparent hover:text-foreground rounded-2xl"
                >
                  <div className="flex items-center text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 mr-3 shrink-0" />
                    <span className="font-bold text-foreground uppercase tracking-wider truncate">
                      {selectedProvince === "all"
                        ? "ALL REGIONS"
                        : selectedProvince}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-xl">
                <Command>
                  <CommandInput placeholder="Search region..." />
                  <CommandList className="max-h-[250px] custom-scrollbar">
                    <CommandEmpty>No region found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("province", "all");
                          setOpenProvince(false);
                        }}
                        className="font-bold uppercase tracking-wider cursor-pointer py-3"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProvince === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        ALL REGIONS
                      </CommandItem>
                      {provinces.map((p: string) => (
                        <CommandItem
                          key={p}
                          value={p}
                          onSelect={() => {
                            updateFilter("province", p);
                            setOpenProvince(false);
                          }}
                          className="font-bold uppercase tracking-wider cursor-pointer py-3"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProvince === p
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {p}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* --- COMBOBOX: FARM --- */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/50 transition-shadow">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={openFarm}
                  className="w-full justify-between h-14 hover:bg-transparent hover:text-foreground rounded-2xl"
                >
                  <div className="flex items-center text-slate-500 dark:text-slate-400">
                    <Warehouse className="w-4 h-4 mr-3 shrink-0" />
                    <span className="font-bold text-foreground uppercase tracking-wider truncate">
                      {selectedFarm === "all" ? "ALL FARMS" : selectedFarm}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-xl">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList className="max-h-[250px] custom-scrollbar">
                    <CommandEmpty>No farm found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("farm", "all");
                          setOpenFarm(false);
                        }}
                        className="font-bold uppercase tracking-wider cursor-pointer py-3"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFarm === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        ALL FARMS
                      </CommandItem>
                      {farms.map((f: string) => (
                        <CommandItem
                          key={f}
                          value={f}
                          onSelect={() => {
                            updateFilter("farm", f);
                            setOpenFarm(false);
                          }}
                          className="font-bold uppercase tracking-wider cursor-pointer py-3"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFarm === f ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {f}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 3. KPI BENTO BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1 */}
        <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:scale-110 transition-transform">
              <HenIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="min-w-0 w-full relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 truncate">
              Total Active Birds
            </p>
            <h2
              className="text-2xl xl:text-3xl font-black text-foreground truncate tracking-tighter"
              title={metrics.totalBirds.toLocaleString()}
            >
              {metrics.totalBirds.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between">
          <div
            className={cn(
              "absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 blur-2xl transition-colors",
              metrics.pendingCapitalCount > 0
                ? "bg-amber-500/10 group-hover:bg-amber-500/20"
                : "bg-emerald-500/5 group-hover:bg-emerald-500/10",
            )}
          ></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            {metrics.pendingCapitalCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-full animate-pulse border border-amber-200 dark:border-amber-900 shrink-0 ml-2">
                <AlertCircle className="w-3 h-3" />{" "}
                {metrics.pendingCapitalCount} PENDING
              </span>
            )}
          </div>
          <div className="min-w-0 w-full relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 truncate">
              Active Capital (Chicks)
            </p>
            <h2
              className="text-2xl xl:text-3xl font-black text-foreground truncate tracking-tighter"
              title={`₱${metrics.totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            >
              ₱
              {metrics.totalCapital.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h2>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="min-w-0 w-full relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 truncate">
              Active Loads
            </p>
            <div className="flex items-baseline gap-2 truncate">
              <h2 className="text-2xl xl:text-3xl font-black text-foreground tracking-tighter">
                {metrics.activeLoadsCount}
              </h2>
              <span className="text-sm font-semibold text-muted-foreground">
                Batches
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Infrastructure Status */}
        <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Warehouse className="w-6 h-6" />
            </div>
          </div>
          <div className="min-w-0 w-full relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 truncate">
              Infrastructure Status
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-2xl xl:text-3xl font-black text-foreground tracking-tighter">
                  {metrics.totalFarmsCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                  Farms
                </span>
              </div>
              <div className="flex flex-col border-l border-border/50 pl-2">
                <span className="text-2xl xl:text-3xl font-black text-emerald-500 dark:text-emerald-400 tracking-tighter">
                  {metrics.activeBuildingsCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70 tracking-widest">
                  Active
                </span>
              </div>
              <div className="flex flex-col border-l border-border/50 pl-2">
                <span className="text-2xl xl:text-3xl font-black text-slate-400 dark:text-slate-500 tracking-tighter">
                  {metrics.emptyBuildingsCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                  Empty
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS & TIMELINE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black tracking-tight">
                Population by Farm
              </h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Live bird distribution across regions
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="birds" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-semibold border-2 border-dashed border-border/50 rounded-2xl">
                No active load data for this filter.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black tracking-tight">
              Upcoming Harvests
            </h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="grow space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {upcomingHarvests.length > 0 ? (
              upcomingHarvests.map((load: any) => {
                // --- FIXED MATH: Calculate exactly Harvest Date - Load Date ---
                const harvestDateObj = new Date(load.harvestDate);
                const loadDateObj = new Date(load.loadDate);

                // Using UTC prevents Daylight Savings Time offsets from returning fractions (like 121.9 days)
                const hDate = Date.UTC(
                  harvestDateObj.getFullYear(),
                  harvestDateObj.getMonth(),
                  harvestDateObj.getDate(),
                );
                const lDate = Date.UTC(
                  loadDateObj.getFullYear(),
                  loadDateObj.getMonth(),
                  loadDateObj.getDate(),
                );
                const tDate = Date.UTC(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate(),
                );

                // Total cycle length (e.g. March 3 to July 3 = 122 days)
                const totalDaysCycle = Math.round(
                  (hDate - lDate) / (1000 * 60 * 60 * 24),
                );

                // We keep the countdown logic strictly for triggering the Amber "Urgent" color
                const daysLeft = Math.round(
                  (hDate - tDate) / (1000 * 60 * 60 * 24),
                );
                const isUrgent = daysLeft <= 3 && daysLeft >= 0;

                return (
                  <div
                    key={load.id}
                    className="group bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-sm text-foreground mb-0.5 truncate">
                        {load.farmName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        <span className="truncate">{load.buildingName}</span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0">
                          {load.quantity.toLocaleString()} Birds
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {daysLeft < 0 ? (
                        <span className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md uppercase tracking-wider">
                          Overdue
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "text-lg font-black leading-none",
                              isUrgent
                                ? "text-amber-500"
                                : "text-blue-600 dark:text-blue-500",
                            )}
                          >
                            {totalDaysCycle}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mt-1">
                            Total Days
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-10">
                <CalendarCheck className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm font-bold">No harvests scheduled.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest transition-colors group">
            View All Loads{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
