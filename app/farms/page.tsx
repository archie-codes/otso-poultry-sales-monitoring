import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import { farms, buildings, loads } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { Tractor, Plus, Building2, Egg } from "lucide-react";
import AddFarmModal from "./AddFarmModal";
import AddBuildingModal from "./AddBuildingModal";

export default async function FarmsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch all Farms, Buildings, AND Currently Active Loads
  const allFarms = await db.select().from(farms);
  const allBuildings = await db.select().from(buildings);
  const activeLoads = await db
    .select()
    .from(loads)
    .where(eq(loads.isActive, true));

  // 2. Map everything together so the UI knows exactly what is inside each building
  const farmsWithBuildings = allFarms.map((farm) => {
    const farmBuildings = allBuildings.filter((b) => b.farmId === farm.id);

    const buildingsWithStatus = farmBuildings.map((building) => {
      // Find if this specific building has an active flock loaded into it
      const currentLoad = activeLoads.find((l) => l.buildingId === building.id);
      return { ...building, currentLoad };
    });

    return { ...farm, buildings: buildingsWithStatus };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tractor className="h-8 w-8 text-primary" />
            Farm Setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your farms, buildings, and active loads.
          </p>
        </div>

        <AddFarmModal />
      </div>

      {/* Empty State OR Farm Grid */}
      {farmsWithBuildings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/50 border border-dashed border-border/50 rounded-2xl">
          <Tractor className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Farms Found</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            You haven't set up any farms yet. Click "Add New Farm" to get
            started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {farmsWithBuildings.map((farm) => (
            <div
              key={farm.id}
              className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Farm Card Header */}
              <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-foreground">
                    {farm.name}
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground flex items-center mt-0.5">
                    {farm.barangay}, {farm.city}, {farm.province}
                  </p>
                </div>
                <AddBuildingModal farmId={farm.id} farmName={farm.name} />
              </div>

              {/* Building List inside the Farm */}
              <div className="p-6">
                {farm.buildings.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No buildings added to this farm yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {farm.buildings.map((building) => (
                      <div
                        key={building.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 transition-colors"
                      >
                        {/* Dynamic Icon Color based on Status */}
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${
                            building.currentLoad
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {building.currentLoad ? (
                            <Egg className="w-5 h-5" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-sm text-foreground leading-tight">
                            {building.name}
                          </p>

                          {/* Dynamic Status Text */}
                          {building.currentLoad ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <p className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-500 font-bold">
                                Active:{" "}
                                {building.currentLoad.actualQuantityLoad.toLocaleString()}{" "}
                                Chicks
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                              Empty / Ready
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
