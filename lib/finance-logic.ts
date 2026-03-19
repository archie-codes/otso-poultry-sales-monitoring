import { db } from "../src";
import {
  expenses,
  loads,
  buildings,
  feedAllocations, // <--- NEW TIER 2
  feedDeliveries, // <--- NEW TIER 1
} from "../src/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export async function getLoadTotalCosts(loadId: number) {
  // 1. Get basic info & Initial Capital (Chicks)
  const loadData = await db
    .select({
      farmId: buildings.farmId,
      initialCapital: loads.initialCapital,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .where(eq(loads.id, loadId))
    .limit(1);

  if (loadData.length === 0)
    return {
      directCosts: 0,
      sharedCosts: 0,
      feedCosts: 0,
      initialCapital: 0,
      total: 0,
    };

  const farmId = loadData[0].farmId;
  const initialCapital = Number(loadData[0].initialCapital) || 0;

  // 2. DIRECT COSTS (Vaccines, Labor, etc.)
  // We exclude 'chick_purchase' because those are already counted in initialCapital!
  const directResult = await db
    .select({ total: sql<number>`sum(cast(${expenses.amount} as numeric))` })
    .from(expenses)
    .where(
      and(
        eq(expenses.loadId, loadId),
        sql`${expenses.expenseType} != 'chick_purchase'`,
      ),
    );
  const directCosts = Number(directResult[0]?.total || 0);

  // 3. SHARED COSTS (Electricity, Water, divided by active buildings)
  const sharedFarmResult = await db
    .select({ total: sql<number>`sum(cast(${expenses.amount} as numeric))` })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), isNull(expenses.loadId)));

  const activeLoadsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .where(and(eq(buildings.farmId, farmId), eq(loads.isActive, true)));

  const divisor = Number(activeLoadsCount[0]?.count || 1);
  const sharedCosts = Number(sharedFarmResult[0]?.total || 0) / divisor;

  // 4. EXACT FEED COSTS (NEW TWO-TIER SYSTEM)
  // Sacks allocated to this building * Original Supplier Unit Price
  const allocations = await db
    .select({
      allocatedQty: feedAllocations.allocatedQuantity,
      unitPrice: feedDeliveries.unitPrice,
    })
    .from(feedAllocations)
    .innerJoin(
      feedDeliveries,
      eq(feedAllocations.deliveryId, feedDeliveries.id),
    )
    .where(eq(feedAllocations.loadId, loadId));

  const feedCosts = allocations.reduce(
    (sum, a) => sum + a.allocatedQty * Number(a.unitPrice),
    0,
  );

  // 5. THE GRAND TOTAL FOR MA'AM LANI
  return {
    directCosts,
    sharedCosts,
    feedCosts,
    initialCapital,
    total: initialCapital + directCosts + sharedCosts + feedCosts,
  };
}
