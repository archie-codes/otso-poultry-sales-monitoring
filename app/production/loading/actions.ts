"use server";

import { db } from "../../../src";
import {
  loads,
  harvestRecords,
  users,
  dailyRecords,
  expenses,
  buildings,
} from "../../../src/db/schema"; // <--- REMOVED feedTransactions!
import { revalidatePath } from "next/cache";
import { eq, sum, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { getLoadTotalCosts } from "@/lib/finance-logic";

// ==========================================
// ADD NEW LOAD
// ==========================================
export async function addLoad(formData: FormData) {
  try {
    const buildingId = Number(formData.get("buildingId"));
    const name = (formData.get("name") as string).trim();
    const customerName = formData.get("customerName") as string;
    const chickType = formData.get("chickType") as string;
    const loadDate = formData.get("loadDate") as string;
    const harvestDate = formData.get("harvestDate") as string | null;
    const actualQuantityLoad = Number(formData.get("actualQuantityLoad"));
    const pricePerChick = Number(formData.get("pricePerChick"));
    const sellingPrice = Number(formData.get("sellingPrice"));
    const initialCapital = Number(formData.get("initialCapital"));

    // DUPLICATE BATCH NAME CHECKER
    const existingBatch = await db
      .select()
      .from(loads)
      .where(and(eq(loads.buildingId, buildingId), eq(loads.name, name)))
      .limit(1);

    if (existingBatch.length > 0) {
      return {
        error: `The name "${name}" has already been used for this building in the past. Please use a unique batch name (e.g., Loading 2).`,
      };
    }

    const [newLoad] = await db
      .insert(loads)
      .values({
        buildingId,
        name,
        customerName,
        chickType,
        loadDate,
        harvestDate,
        actualQuantityLoad,
        actualCostPerChick: pricePerChick.toString(),
        sellingPrice: sellingPrice.toString(),
        initialCapital: initialCapital.toString(),
        isActive: true,
      })
      .returning({ id: loads.id });

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const buildingData = await db
      .select({ farmId: buildings.farmId })
      .from(buildings)
      .where(eq(buildings.id, buildingId))
      .limit(1);

    if (buildingData[0]?.farmId && userId) {
      await db.insert(expenses).values({
        farmId: buildingData[0].farmId,
        loadId: newLoad.id,
        amount: initialCapital.toString(),
        expenseType: "chick_purchase",
        expenseDate: loadDate,
        recordedBy: userId,
        remarks: `Initial Load: ${actualQuantityLoad.toLocaleString()} heads @ ₱${pricePerChick.toLocaleString()}/head`,
      });
    }

    revalidatePath("/production/loading");
    return { success: true, id: newLoad.id };
  } catch (error) {
    console.error("Error adding load:", error);
    return { error: "Failed to add load to database." };
  }
}

// ==========================================
// UPDATE EXISTING LOAD (Correction Feature)
// ==========================================
export async function updateLoad(formData: FormData) {
  const id = Number(formData.get("id"));
  const loadDate = formData.get("loadDate") as string;
  const harvestDate = formData.get("harvestDate") as string;
  const quantity = Number(formData.get("quantity"));
  const customerName = formData.get("customerName") as string;
  const chickType = formData.get("chickType") as string;
  const initialCapital = formData.get("initialCapital") as string;
  const sellingPrice = formData.get("sellingPrice") as string;

  if (!id) {
    return { error: "Load ID is missing. Cannot update." };
  }

  try {
    await db
      .update(loads)
      .set({
        loadDate: loadDate,
        harvestDate: harvestDate || null,
        actualQuantityLoad: quantity,
        customerName: customerName || null,
        ...(chickType ? { chickType } : {}),
        initialCapital: initialCapital || "0",
        sellingPrice: sellingPrice || "0",
      })
      .where(eq(loads.id, id));

    revalidatePath("/production/loading");
    revalidatePath("/farms");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating load:", error);
    return { error: error.message || "Failed to update load details." };
  }
}

// ==========================================
// GET EXACT LIVE BIRD COUNT (For the Modal)
// ==========================================
export async function getLiveBirdCount(loadId: number) {
  try {
    const loadData = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);
    if (loadData.length === 0) return 0;
    const originalQuantity = loadData[0].actualQuantityLoad;

    const mortalityData = await db
      .select({ total: sum(dailyRecords.mortality) })
      .from(dailyRecords)
      .where(eq(dailyRecords.loadId, loadId));
    const totalMortality = Number(mortalityData[0]?.total) || 0;

    const previousHarvests = await db
      .select({ total: sum(harvestRecords.quantity) })
      .from(harvestRecords)
      .where(eq(harvestRecords.loadId, loadId));
    const totalPreviouslyHarvested = Number(previousHarvests[0]?.total) || 0;

    return originalQuantity - totalMortality - totalPreviouslyHarvested;
  } catch (error) {
    console.error("Error fetching live bird count:", error);
    return 0;
  }
}

// ==========================================
// LOG PARTIAL OR FINAL HARVEST
// ==========================================
export async function logHarvest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  let userId = (session.user as any).id;
  if (!userId && session.user.email) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (dbUser.length > 0) userId = dbUser[0].id;
  }

  const loadId = Number(formData.get("loadId"));
  const harvestDate = formData.get("harvestDate") as string;
  const quantity = Number(formData.get("quantity"));
  const sellingPrice = formData.get("sellingPrice") as string;
  const customerName = formData.get("customerName") as string;
  const remarks = formData.get("remarks") as string;
  const isFinalHarvest = formData.get("isFinalHarvest") === "on";

  if (!loadId || !harvestDate || !quantity || !sellingPrice) {
    return { error: "Please fill in all required fields." };
  }

  try {
    const loadData = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);
    if (loadData.length === 0) return { error: "Load not found." };
    const originalQuantity = loadData[0].actualQuantityLoad;

    const mortalityData = await db
      .select({ total: sum(dailyRecords.mortality) })
      .from(dailyRecords)
      .where(eq(dailyRecords.loadId, loadId));
    const totalMortality = Number(mortalityData[0]?.total) || 0;

    const previousHarvests = await db
      .select({ total: sum(harvestRecords.quantity) })
      .from(harvestRecords)
      .where(eq(harvestRecords.loadId, loadId));
    const totalPreviouslyHarvested = Number(previousHarvests[0]?.total) || 0;

    const remainingLiveBirds =
      originalQuantity - totalMortality - totalPreviouslyHarvested;

    if (quantity > remainingLiveBirds) {
      return {
        error: `Invalid quantity! You only have ${remainingLiveBirds.toLocaleString()} live birds left.`,
      };
    }

    await db.insert(harvestRecords).values({
      loadId,
      harvestDate,
      quantity,
      sellingPrice,
      customerName: customerName || null,
      remarks: remarks || null,
      recordedBy: userId,
    });

    const isClosed = isFinalHarvest || quantity === remainingLiveBirds;

    if (isClosed) {
      await db
        .update(loads)
        .set({
          isActive: false,
          harvestDate: harvestDate,
        })
        .where(eq(loads.id, loadId));
    }

    return {
      success: true,
      harvested: quantity,
      previousAvailable: remainingLiveBirds,
      remainingNow: remainingLiveBirds - quantity,
      isClosed: isClosed,
    };
  } catch (error) {
    console.error("Error logging harvest:", error);
    return { error: "Failed to log harvest. Please try again." };
  }
}

// ==========================================
// GET EXPENSES FOR HARVEST
// ==========================================
export async function getLoadTotalExpensesForHarvest(loadId: number) {
  try {
    const costs = await getLoadTotalCosts(loadId);
    return costs.total;
  } catch (error) {
    console.error("Failed to fetch total expenses:", error);
    return 0;
  }
}

// ==========================================
// ADD MORE CHICKS TO EXISTING LOAD (TOP-UP)
// ==========================================
export async function addMoreChicksToLoad(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  let userId = (session.user as any).id;
  if (!userId && session.user.email) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (dbUser.length > 0) userId = dbUser[0].id;
  }

  const loadId = Number(formData.get("loadId"));
  const addedQuantity = Number(formData.get("addedQuantity"));
  const newPricePerChick = Number(formData.get("newPricePerChick"));
  const addedCapital = Number(formData.get("addedCapital"));
  const dateAdded = formData.get("dateAdded") as string;

  if (!loadId || !addedQuantity || !newPricePerChick || !dateAdded) {
    return { error: "Please fill in all required fields." };
  }

  try {
    const loadData = await db
      .select({
        currentQty: loads.actualQuantityLoad,
        currentCapital: loads.initialCapital,
        farmId: buildings.farmId,
      })
      .from(loads)
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .where(eq(loads.id, loadId))
      .limit(1);

    if (loadData.length === 0) return { error: "Load not found." };

    const currentQty = loadData[0].currentQty;
    const currentCapital = Number(loadData[0].currentCapital) || 0;
    const farmId = loadData[0].farmId;

    const newTotalQty = currentQty + addedQuantity;
    const newTotalCapital = currentCapital + addedCapital;
    const newAveragePrice = newTotalCapital / newTotalQty;

    await db
      .update(loads)
      .set({
        actualQuantityLoad: newTotalQty,
        initialCapital: String(newTotalCapital),
        actualCostPerChick: String(newAveragePrice),
      })
      .where(eq(loads.id, loadId));

    await db.insert(expenses).values({
      farmId,
      loadId,
      amount: String(addedCapital),
      expenseType: "chick_purchase",
      expenseDate: dateAdded,
      recordedBy: userId,
      remarks: `Top-Up: ${addedQuantity.toLocaleString()} heads @ ₱${newPricePerChick.toLocaleString()}/head`,
    });

    revalidatePath("/production/loading");
    return { success: true };
  } catch (error) {
    console.error("Error adding more chicks:", error);
    return { error: "Failed to add chicks to load." };
  }
}

// ==========================================
// FETCH UNIFIED LOAD TIMELINE (EXECUTIVE MILESTONES)
// ==========================================
export async function getLoadTimeline(loadId: number) {
  try {
    const harvests = await db
      .select()
      .from(harvestRecords)
      .where(eq(harvestRecords.loadId, loadId));

    const chickPurchases = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.loadId, loadId),
          eq(expenses.expenseType, "chick_purchase"),
        ),
      );

    const timeline: any[] = [];

    harvests.forEach((h) => {
      timeline.push({
        id: `harvest_${h.id}`,
        date: h.harvestDate,
        type: "HARVEST",
        title: "Harvested Birds",
        description: `Sold ${h.quantity.toLocaleString()} birds to ${h.customerName || "Customer"} at ₱${Number(h.sellingPrice).toLocaleString()}/head.`,
      });
    });

    chickPurchases.forEach((c) => {
      const isInitial = c.remarks?.startsWith("Initial");

      timeline.push({
        id: `chicks_${c.id}`,
        date: c.expenseDate,
        type: isInitial ? "INITIAL_LOAD" : "TOP_UP",
        title: isInitial ? "Flock Started" : "Chick Top-Up",
        description:
          c.remarks ||
          `Capital recorded: ₱${Number(c.amount).toLocaleString()}`,
      });
    });

    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return [];
  }
}
