import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../src";
import { loads, buildings, farms } from "../src/db/schema";
import { eq, asc } from "drizzle-orm";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage(props: {
  searchParams:
    | Promise<{ province?: string; farm?: string }>
    | { province?: string; farm?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // --- THE TRAFFIC COP (SECURITY CHECK) ---
  const userRole = (session.user as any)?.role || "staff";

  if (userRole !== "owner") {
    // Instantly teleport staff to their workspace so they never see the financials
    redirect("/production/monitoring");
  }
  // ----------------------------------------

  const searchParams = await props.searchParams;
  const selectedProvince = searchParams?.province;
  const selectedFarm = searchParams?.farm;

  // 1. Fetch Filter Options & Infrastructure Base
  const allFarms = await db.select().from(farms);
  const uniqueProvinces = Array.from(
    new Set(allFarms.map((f) => f.province)),
  ).filter(Boolean);

  const dropdownFarms = selectedProvince
    ? allFarms.filter((f) => f.province === selectedProvince).map((f) => f.name)
    : allFarms.map((f) => f.name);

  // Fetch all buildings to calculate active vs empty status
  const allBuildings = await db
    .select({
      id: buildings.id,
      farmName: farms.name,
      province: farms.province,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  // 2. Fetch Active Loads
  const activeLoads = await db
    .select({
      id: loads.id,
      buildingId: loads.buildingId,
      quantity: loads.actualQuantityLoad,
      initialCapital: loads.initialCapital,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      farmName: farms.name,
      province: farms.province,
      buildingName: buildings.name,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true))
    .orderBy(asc(loads.loadDate));

  // 3. Dynamic Filtering Logic
  const filteredLoads = activeLoads.filter((load) => {
    const provinceMatch =
      !selectedProvince || load.province === selectedProvince;
    const farmMatch = !selectedFarm || load.farmName === selectedFarm;
    return provinceMatch && farmMatch;
  });

  const filteredBuildings = allBuildings.filter((b) => {
    const provinceMatch = !selectedProvince || b.province === selectedProvince;
    const farmMatch = !selectedFarm || b.farmName === selectedFarm;
    return provinceMatch && farmMatch;
  });

  const filteredFarms = allFarms.filter((f) => {
    const provinceMatch = !selectedProvince || f.province === selectedProvince;
    const farmMatch = !selectedFarm || f.name === selectedFarm;
    return provinceMatch && farmMatch;
  });

  // 4. Calculate Advanced Metrics
  const totalBirds = filteredLoads.reduce(
    (sum, l) => sum + Number(l.quantity),
    0,
  );
  const totalCapital = filteredLoads.reduce(
    (sum, l) => sum + Number(l.initialCapital || 0),
    0,
  );
  const pendingCapitalCount = filteredLoads.filter(
    (l) => !l.initialCapital || Number(l.initialCapital) === 0,
  ).length;

  // --- INFRASTRUCTURE METRICS ---
  const totalFarmsCount = filteredFarms.length;
  // A building is active if its ID appears in the filtered active loads
  const activeBuildingIds = new Set(filteredLoads.map((l) => l.buildingId));
  const activeBuildingsCount = activeBuildingIds.size;
  const emptyBuildingsCount = filteredBuildings.length - activeBuildingsCount;

  // 5. Prepare Chart Data
  const farmChartData = filteredLoads.reduce((acc: any, curr) => {
    const existing = acc.find((item: any) => item.name === curr.farmName);
    if (existing) {
      existing.birds += curr.quantity;
    } else {
      acc.push({ name: curr.farmName, birds: curr.quantity });
    }
    return acc;
  }, []);

  // 6. Upcoming Harvests
  const upcomingHarvests = filteredLoads
    .filter((l) => l.harvestDate)
    .sort(
      (a, b) =>
        new Date(a.harvestDate!).getTime() - new Date(b.harvestDate!).getTime(),
    )
    .slice(0, 5);

  return (
    <DashboardClient
      userName={session.user?.name}
      imageUrl={(session.user as any)?.imageUrl}
      loads={filteredLoads}
      provinces={uniqueProvinces}
      farms={dropdownFarms}
      chartData={farmChartData}
      upcomingHarvests={upcomingHarvests}
      metrics={{
        totalBirds,
        totalCapital,
        pendingCapitalCount,
        activeLoadsCount: filteredLoads.length,
        totalFarmsCount,
        activeBuildingsCount,
        emptyBuildingsCount,
      }}
    />
  );
}
