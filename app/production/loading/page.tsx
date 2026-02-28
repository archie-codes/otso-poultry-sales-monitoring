import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import { loads, buildings, farms } from "../../../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Egg, Calendar, MapPin, Users } from "lucide-react";
import AddLoadModal from "./AddLoadModal";

export default async function LoadingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch all Buildings and join their Farm names
  const allBuildings = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      farmName: farms.name,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  // 2. Fetch all Currently Active Loads to display on the dashboard
  const activeLoads = await db
    .select({
      id: loads.id,
      buildingId: loads.buildingId, // <-- NEW: We need to know exactly which building is busy
      loadDate: loads.loadDate,
      quantity: loads.actualQuantityLoad,
      customer: loads.customerName,
      buildingName: buildings.name,
      farmName: farms.name,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true))
    .orderBy(desc(loads.loadDate));

  // 3. THE FIX: Filter out buildings that already have an active load!
  const busyBuildingIds = activeLoads.map((load) => load.buildingId);
  const trulyAvailableBuildings = allBuildings.filter(
    (building) => !busyBuildingIds.includes(building.id),
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Egg className="h-8 w-8 text-amber-500" />
            Chick Loading
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage active flocks and load new batches into your buildings.
          </p>
        </div>

        {/* Pass ONLY the empty buildings to the Modal */}
        <AddLoadModal availableBuildings={trulyAvailableBuildings} />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4 px-1">Currently Active Loads</h2>

        {activeLoads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/50 border border-dashed border-border/50 rounded-2xl">
            <Egg className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold">No Active Flocks</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-sm">
              You haven't loaded any chicks yet. Click the button above to start
              your first batch!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeLoads.map((load) => (
              <div
                key={load.id}
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-5 right-5 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Egg className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {load.quantity.toLocaleString()} Chicks
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {load.farmName} -{" "}
                      {load.buildingName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      Load Date
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(load.loadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      Customer
                    </p>
                    <p className="text-sm font-medium flex items-center gap-1.5 truncate">
                      <Users className="w-4 h-4 text-primary" />
                      {load.customer || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
