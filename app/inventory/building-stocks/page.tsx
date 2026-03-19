import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import {
  loads,
  buildings,
  farms,
  feedAllocations,
} from "../../../src/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  Building2,
  MapPin,
  PackageOpen,
  CalendarDays,
  Wheat,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---> NEW: BROUGHT IN THE FRACTION FORMATTER FOR CONSISTENCY <---
const formatSacks = (val: number | string | null | undefined) => {
  const num = Number(val);
  if (!num || num === 0) return "0";

  const whole = Math.floor(num);
  const frac = num - whole;

  let fracSymbol = "";
  if (Math.abs(frac - 0.25) < 0.01) fracSymbol = "¼";
  else if (Math.abs(frac - 0.5) < 0.01) fracSymbol = "½";
  else if (Math.abs(frac - 0.75) < 0.01) fracSymbol = "¾";
  else if (frac > 0) fracSymbol = frac.toFixed(2).substring(1);

  if (whole > 0 && fracSymbol) return `${whole} ${fracSymbol}`;
  if (whole === 0 && fracSymbol) return fracSymbol;
  return whole.toLocaleString();
};

export default async function BuildingStocksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch all ACTIVE loads (buildings currently raising chickens)
  const activeLoadsRaw = await db
    .select({
      id: loads.id,
      name: loads.name,
      loadDate: loads.loadDate,
      buildingName: buildings.name,
      farmName: farms.name,
      birdQuantity: loads.actualQuantityLoad,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true))
    .orderBy(asc(farms.name), asc(buildings.name));

  // 2. Fetch all feed allocations to calculate live sub-inventory
  const allAllocations = await db.select().from(feedAllocations);

  // 3. Map the feeds to their specific active buildings
  const loadsWithFeeds = activeLoadsRaw.map((load) => {
    const loadFeeds = allAllocations.filter((a) => a.loadId === load.id);

    // Sum up the remaining sacks grouped by feed type (Starter, Grower, etc.)
    const feedStock = loadFeeds.reduce(
      (acc, curr) => {
        const type = curr.feedType || "UNKNOWN";
        // ---> FIX: Wrapped curr.remainingInBuilding in Number()! <---
        acc[type] = (acc[type] || 0) + Number(curr.remainingInBuilding);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Filter out empty stocks so we only show what they actually have
    const activeStocks = Object.entries(feedStock).filter(
      ([_, quantity]) => quantity > 0,
    );

    const totalSacks = activeStocks.reduce((sum, [_, qty]) => sum + qty, 0);

    return { ...load, activeStocks, totalSacks };
  });

  // 4. Group by Farm Name for a clean UI layout
  const groupedByFarm = loadsWithFeeds.reduce(
    (acc, load) => {
      if (!acc[load.farmName]) acc[load.farmName] = [];
      acc[load.farmName].push(load);
      return acc;
    },
    {} as Record<string, typeof loadsWithFeeds>,
  );

  const farmNames = Object.keys(groupedByFarm);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="bg-card border border-border/50 p-6 lg:p-8 rounded-lg shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-2xl sm:text-2xl font-black tracking-tight flex items-center gap-3 text-foreground uppercase">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 shrink-0" />
            Building Stocks
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm max-w-xl">
            Live sub-inventory radar. Select a farm to monitor the exact
            quantity of feed sacks currently sitting inside each active
            building.
          </p>
        </div>
      </div>

      {/* RENDER FARMS & BUILDINGS USING TABS */}
      {farmNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card border border-dashed border-border/50 rounded-[2rem]">
          <PackageOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Active Buildings</h3>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            There are no active flocks right now to monitor feed stocks for.
          </p>
        </div>
      ) : (
        <Tabs defaultValue={farmNames[0]} className="w-full">
          {/* ---> UPGRADED HORIZONTALLY SCROLLABLE TABS LIST <--- */}
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <TabsList className="flex h-auto w-max items-center justify-start gap-2 bg-transparent p-0 border-none">
              {farmNames.map((farmName) => (
                <TabsTrigger
                  key={farmName}
                  value={farmName}
                  title={farmName}
                  className="flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl max-w-[200px] sm:max-w-[250px] bg-slate-50 dark:bg-slate-900 border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-800 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:border-emerald-600 data-[state=active]:shadow-md transition-all"
                >
                  <MapPin className="w-4 h-4 shrink-0 opacity-70 data-[state=active]:opacity-100" />
                  <span className="truncate">{farmName}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ---> TAB CONTENT (THE BUILDINGS GRID) <--- */}
          {farmNames.map((farmName) => {
            const buildingsInFarm = groupedByFarm[farmName];

            return (
              <TabsContent
                key={farmName}
                value={farmName}
                className="mt-4 outline-none animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="space-y-6">
                  {/* Selected Farm Sub-Header */}
                  <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-600/20">
                    <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">
                      Active Buildings
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
                      {buildingsInFarm.length} Total
                    </span>
                  </div>

                  {/* Buildings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildingsInFarm.map((building) => (
                      <div
                        key={building.id}
                        className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md"
                      >
                        {/* Card Header */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-b border-border/50">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-lg font-black uppercase text-foreground">
                                {building.buildingName}
                              </h3>
                              <p className="text-xs font-bold text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span className="bg-white dark:bg-slate-950 border border-border/50 px-2 py-0.5 rounded shadow-sm">
                                  {building.name || "Unnamed Batch"}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Total Sacks
                              </p>
                              <p
                                className={cn(
                                  "text-xl font-black",
                                  building.totalSacks > 0
                                    ? "text-emerald-600"
                                    : "text-red-500",
                                )}
                              >
                                {/* ---> UPGRADED TOTAL SACKS <--- */}
                                {formatSacks(building.totalSacks)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {new Date(building.loadDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                              <img
                                src="/hen.svg"
                                alt="Bird"
                                className="w-3.5 h-3.5 dark:invert opacity-70"
                              />
                              {building.birdQuantity.toLocaleString()} birds
                            </div>
                          </div>
                        </div>

                        {/* Card Body - Feed Stocks */}
                        <div className="p-5 flex-1 bg-white dark:bg-slate-950">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Wheat className="w-3.5 h-3.5" /> Current Stock
                            Levels
                          </p>

                          {building.activeStocks.length === 0 ? (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                              <div>
                                <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wide">
                                  Out of Stock
                                </p>
                                <p className="text-[10px] font-medium text-red-600/80 dark:text-red-400/80 mt-0.5">
                                  This building has completely run out of feeds.
                                  Transfer feeds from the warehouse immediately.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {building.activeStocks.map(
                                ([feedType, quantity]) => {
                                  const isLowStock = quantity < 10;

                                  return (
                                    <div
                                      key={feedType}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-colors",
                                        isLowStock
                                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                                          : "bg-slate-50 dark:bg-slate-900/30 border-border/50",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "text-xs font-black uppercase tracking-widest",
                                          isLowStock
                                            ? "text-amber-700 dark:text-amber-500"
                                            : "text-slate-700 dark:text-slate-300",
                                        )}
                                      >
                                        {feedType}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {isLowStock && (
                                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                                            Low
                                          </span>
                                        )}
                                        <span
                                          className={cn(
                                            "text-sm font-black",
                                            isLowStock
                                              ? "text-amber-700 dark:text-amber-400"
                                              : "text-foreground",
                                          )}
                                        >
                                          {/* ---> UPGRADED INDIVIDUAL SACKS <--- */}
                                          {formatSacks(quantity)} sacks
                                        </span>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
