import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import {
  loads,
  buildings,
  farms,
  dailyRecords,
  harvestRecords,
  feedAllocations, // <--- NEW TIER 2 INVENTORY IMPORT
} from "../../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { MapPin, Warehouse } from "lucide-react";
import Image from "next/image";
import henIcon from "@/public/hen.svg";
import AddLoadModal from "./AddLoadModal";
import LoadCard from "./LoadCard";
import { cn } from "@/lib/utils";

// SHADCN TABS
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default async function LoadingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch all Buildings for the selection dropdowns
  const allBuildingsRaw = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      farmName: farms.name,
      city: farms.city,
      barangay: farms.barangay,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  // ---> THE FIX: Fetch the most recent harvest dates for every building <---
  const closedLoads = await db
    .select({
      buildingId: loads.buildingId,
      harvestDate: loads.harvestDate,
    })
    .from(loads)
    .where(eq(loads.isActive, false))
    .orderBy(desc(loads.harvestDate));

  const latestHarvestMap = new Map<number, string>();
  closedLoads.forEach((l) => {
    if (l.harvestDate && !latestHarvestMap.has(l.buildingId)) {
      latestHarvestMap.set(l.buildingId, l.harvestDate);
    }
  });

  // Attach the lastHarvestDate to the building list
  const allBuildings = allBuildingsRaw.map((b) => ({
    ...b,
    lastHarvestDate: latestHarvestMap.get(b.id) || null,
  }));

  // 2. Fetch Active Loads with Farm/Building details
  const activeLoadsRaw = await db
    .select({
      id: loads.id,
      name: loads.name,
      buildingId: loads.buildingId,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      quantity: loads.actualQuantityLoad,
      customer: loads.customerName,
      initialCapital: loads.initialCapital,
      chickType: loads.chickType,
      buildingName: buildings.name,
      farmName: farms.name,
      province: farms.province,
      city: farms.city,
      sellingPrice: loads.sellingPrice,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true))
    .orderBy(
      desc(loads.isActive),
      asc(farms.name),
      asc(buildings.name),
      desc(loads.loadDate),
    );

  // 3. FETCH RAW DATA FOR MATH
  const allDailyRecords = await db.select().from(dailyRecords);
  const allHarvests = await db.select().from(harvestRecords);

  // ---> NEW: Fetch Sub-Inventory for buildings <---
  const allBuildingFeeds = await db.select().from(feedAllocations);

  // 4. MAP THE MATH INTO THE LOADS (Birds + Feeds)
  const activeLoads = activeLoadsRaw.map((load) => {
    // Bird Math
    const mortality = allDailyRecords
      .filter((r) => r.loadId === load.id)
      .reduce((sum, r) => sum + Number(r.mortality), 0);

    const harvested = allHarvests
      .filter((h) => h.loadId === load.id)
      .reduce((sum, h) => sum + Number(h.quantity), 0);

    const remaining = Number(load.quantity) - mortality - harvested;

    // --- Feed Inventory Math (Upgraded to Two-Tier!) ---
    const remainingFeeds = allBuildingFeeds
      .filter((fa) => fa.loadId === load.id)
      .reduce((sum, fa) => sum + Number(fa.remainingInBuilding), 0);

    return {
      ...load,
      mortality,
      harvested,
      remaining,
      remainingFeeds,
    };
  });

  // 5. Filter out busy buildings (for AddLoadModal)
  const busyBuildingIds = activeLoads.map((load) => load.buildingId);
  const trulyAvailableBuildings = allBuildings.filter(
    (building) => !busyBuildingIds.includes(building.id),
  );

  // 6. Group by Location for the UI layout
  const groupedByProvinceAndFarm = activeLoads.reduce(
    (acc, load) => {
      const province = load.province || "UNASSIGNED REGION";
      const farm = load.farmName || "Unknown Farm";

      if (!acc[province]) acc[province] = {};
      if (!acc[province][farm]) acc[province][farm] = [];

      acc[province][farm].push(load);
      return acc;
    },
    {} as Record<string, Record<string, typeof activeLoads>>,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-background/50 backdrop-blur-xl p-6 sm:p-8 rounded-lg border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
            <HenIcon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            <span className="truncate uppercase">Production Hub</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Monitor birds, track feed inventory, and manage regional farm sites.
          </p>
        </div>

        {/* CASCADING BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Load New Chicks */}
          <AddLoadModal availableBuildings={trulyAvailableBuildings} />
        </div>
      </div>

      {/* RENDER NESTED GROUPED LOADS */}
      {Object.keys(groupedByProvinceAndFarm).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-card border border-dashed border-border/50 rounded-3xl px-4">
          <HenIcon className="h-12 w-12 sm:h-16 sm:w-16 mb-4 opacity-20 text-muted-foreground" />
          <h3 className="text-lg sm:text-xl font-bold text-center">
            No Active Loads
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 text-center max-w-sm">
            Everything is quiet. Click "Load New Chicks" to start a new batch.
          </p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-16">
          {Object.entries(groupedByProvinceAndFarm).map(
            ([province, farmsInProvince]) => (
              <div key={province} className="space-y-3">
                {/* PROVINCE LEVEL HEADER */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-border/50">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <h2 className="text-2xl sm:text-2xl font-black tracking-tight uppercase text-foreground truncate">
                    {province}
                  </h2>
                </div>

                {/* FARM CATEGORIES */}
                <div className="space-y-10 pl-2 sm:pl-6 border-l-2 bg-background shadow-sm p-5 border-slate-100 dark:border-slate-800 rounded-lg">
                  {Object.entries(farmsInProvince).map(
                    ([farmName, loadsInFarm]) => (
                      <div key={farmName} className="space-y-5">
                        {/* FARM HEADER */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="hidden sm:block h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20 -ml-[29px] relative z-10"></div>
                          <h3 className="text-xl font-bold tracking-tight text-foreground uppercase">
                            {farmName}
                          </h3>
                          <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                            {loadsInFarm.length} ACTIVE{" "}
                            {loadsInFarm.length === 1 ? "BATCH" : "BATCHES"}
                          </span>
                        </div>

                        {/* ---> CORRECTED SCROLLABLE TABS IMPLEMENTATION <--- */}
                        <div className="w-full max-w-full overflow-hidden">
                          <Tabs
                            defaultValue={String(loadsInFarm[0]?.id)}
                            className="w-full"
                          >
                            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                              {/* Removed min-w-full, added clean transparent container */}
                              <TabsList className="flex h-auto w-max items-center justify-start gap-2 sm:gap-3 bg-transparent p-0 border-none">
                                {loadsInFarm.map((load) => (
                                  <TabsTrigger
                                    key={load.id}
                                    value={String(load.id)}
                                    className={cn(
                                      "shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border border-border/50 transition-all",
                                      "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800",
                                      "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 data-[state=active]:border-blue-600",
                                      "data-[state=active]:shadow-md",
                                    )}
                                  >
                                    <Warehouse className="w-4 h-4 shrink-0 opacity-70 data-[state=active]:opacity-100" />
                                    {load.buildingName}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                            </div>

                            {/* TABS CONTENT (The LoadCard) */}
                            {loadsInFarm.map((load) => (
                              <TabsContent
                                key={load.id}
                                value={String(load.id)}
                                className="mt-2 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in zoom-in-95 duration-300"
                              >
                                <LoadCard load={load} />
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
