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
  feedTransactions, // <--- NEW IMPORT
} from "../../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { MapPin } from "lucide-react";
import Image from "next/image";
import henIcon from "@/public/hen.svg";
import AddLoadModal from "./AddLoadModal";
import LogFeedDeliveryModal from "./LogFeedDeliveryModal"; // <--- NEW MODAL
import LoadCard from "./LoadCard";

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
  const allBuildings = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      farmName: farms.name,
      city: farms.city,
      barangay: farms.barangay,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  // 2. Fetch Active Loads with Farm/Building details
  const activeLoadsRaw = await db
    .select({
      id: loads.id,
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
  const allFeedTrans = await db.select().from(feedTransactions); // <--- FETCH ALL FEED LOGS

  // 4. MAP THE MATH INTO THE LOADS (Birds + Feeds)
  const activeLoads = activeLoadsRaw.map((load) => {
    // Bird Math
    const mortality = allDailyRecords
      .filter((r) => r.loadId === load.id)
      .reduce((sum, r) => sum + r.mortality, 0);

    const harvested = allHarvests
      .filter((h) => h.loadId === load.id)
      .reduce((sum, h) => sum + h.quantity, 0);

    const remaining = load.quantity - mortality - harvested;

    // --- NEW: Feed Inventory Math ---
    // Sum up every movement (Deliveries are +, Consumptions/Transfers-out are -)
    const remainingFeeds = allFeedTrans
      .filter((ft) => ft.loadId === load.id)
      .reduce((sum, ft) => sum + Number(ft.quantity), 0);

    return {
      ...load,
      mortality,
      harvested,
      remaining,
      remainingFeeds, // <--- This now goes to the LoadCard!
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
      {/* HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-background/50 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
            <HenIcon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            <span className="truncate uppercase">Production Hub</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Monitor birds, track feed inventory, and manage regional farm sites.
          </p>
        </div>

        {/* CASCADING BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Feed Delivery (Now Global) */}
          <LogFeedDeliveryModal activeLoads={activeLoads} />

          {/* Load New Chicks */}
          <AddLoadModal availableBuildings={trulyAvailableBuildings} />
        </div>
      </div>

      {/* RENDER NESTED GROUPED LOADS */}
      {Object.keys(groupedByProvinceAndFarm).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-card/50 border border-dashed border-border/50 rounded-3xl px-4">
          <HenIcon className="h-12 w-12 sm:h-16 sm:w-16 mb-4 opacity-20" />
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
              <div key={province} className="space-y-6">
                {/* PROVINCE LEVEL HEADER */}
                <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b-2 border-blue-600/20">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-foreground truncate">
                    {province}
                  </h2>
                </div>

                {/* FARM LEVEL CATEGORIES */}
                <div className="space-y-10 pl-2 sm:pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                  {Object.entries(farmsInProvince).map(
                    ([farmName, loadsInFarm]) => (
                      <div key={farmName} className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-700 dark:text-slate-300 uppercase">
                              {farmName}
                            </h3>
                            <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {loadsInFarm.length} ACTIVE BATCHES
                            </span>
                          </div>
                        </div>

                        {/* RENDER THE CARDS */}
                        <div className="flex flex-col gap-4 sm:gap-5">
                          {loadsInFarm.map((load) => (
                            <LoadCard key={load.id} load={load} />
                          ))}
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
