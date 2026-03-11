import { db } from "../src";
import {
  expenses,
  loads,
  buildings,
  dailyRecords,
  feedTransactions,
} from "../src/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export async function getLoadTotalCosts(loadId: number) {
  // 1. Get basic info
  const loadData = await db
    .select({ farmId: buildings.farmId })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .where(eq(loads.id, loadId))
    .limit(1);

  if (loadData.length === 0)
    return { directCosts: 0, sharedCosts: 0, feedCosts: 0, total: 0 };
  const farmId = loadData[0].farmId;

  // 2. DIRECT COSTS (Vaccines, etc. from Expenses Table)
  const directResult = await db
    .select({ total: sql<number>`sum(cast(${expenses.amount} as numeric))` })
    .from(expenses)
    .where(eq(expenses.loadId, loadId));
  const directCosts = Number(directResult[0]?.total || 0);

  // 3. SHARED COSTS (Electricity, etc. divided by active buildings)
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

  // 4. FEED COSTS (Fetched from Daily Monitoring + Inventory Price)
  // We sum (sacks consumed * cost per sack) from the monitoring records
  const feedResult = await db
    .select({
      total: sql<number>`sum(cast(${dailyRecords.feedsConsumed} as numeric) * cast(${feedTransactions.costPerBag} as numeric))`,
    })
    .from(dailyRecords)
    .innerJoin(
      feedTransactions,
      eq(dailyRecords.loadId, feedTransactions.loadId),
    )
    // Note: This logic assumes the price comes from the latest delivery for that load
    .where(eq(dailyRecords.loadId, loadId));

  const feedCosts = Number(feedResult[0]?.total || 0);

  return {
    directCosts,
    sharedCosts,
    feedCosts,
    total: directCosts + sharedCosts + feedCosts,
  };
}
