import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import { loads, buildings, farms } from "../../../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { MapPin } from "lucide-react";
import Image from "next/image";
import henIcon from "@/public/hen.svg";
import AddLoadModal from "./AddLoadModal";
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

  // 1. Fetch all Buildings for the Modal
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

  // 2. Fetch Active Loads
  const activeLoads = await db
    .select({
      id: loads.id,
      buildingId: loads.buildingId,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      quantity: loads.actualQuantityLoad,
      customer: loads.customerName,
      initialCapital: loads.initialCapital,
      buildingName: buildings.name,
      farmName: farms.name,
      province: farms.province,
      city: farms.city,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true))
    .orderBy(desc(loads.loadDate), desc(loads.id));

  // 3. Filter out busy buildings
  const busyBuildingIds = activeLoads.map((load) => load.buildingId);
  const trulyAvailableBuildings = allBuildings.filter(
    (building) => !busyBuildingIds.includes(building.id),
  );

  // 4. NESTED GROUPING: PROVINCE -> FARM
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
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-background/50 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <HenIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="truncate">Active Loads</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Monitor load dates, timelines, and regional infrastructure.
          </p>
        </div>
        <div className="w-full md:w-auto mt-2 md:mt-0">
          <AddLoadModal availableBuildings={trulyAvailableBuildings} />
        </div>
      </div>

      {/* RENDER NESTED GROUPED LOADS */}
      {Object.keys(groupedByProvinceAndFarm).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-card/50 border border-dashed border-border/50 rounded-3xl px-4">
          <HenIcon className="h-12 w-12 sm:h-16 sm:w-16 mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-center">
            No Active Loads
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 text-center max-w-sm">
            You haven't loaded any chicks yet. Click the button above to start
            your first batch!
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
                        {/* FARM SUB-HEADER */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-700 dark:text-slate-300 uppercase">
                              {farmName}
                            </h3>
                            <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {loadsInFarm.length} Active
                            </span>
                          </div>
                        </div>

                        {/* GRID OF CARDS FOR THIS SPECIFIC FARM */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
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
