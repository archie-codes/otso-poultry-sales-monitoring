"use server";

import { db } from "../../../src";
import {
  loads,
  harvestRecords,
  users,
  dailyRecords,
  expenses,
  buildings,
  feedAllocations,
  feedDeliveries,
} from "../../../src/db/schema";
import { revalidatePath } from "next/cache";
import { eq, sum, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { getLoadTotalCosts } from "@/lib/finance-logic";

// --- HELPER: GET AUTH USER ID ---
async function getAuthUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const dbUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  return dbUser[0]?.id || null;
}

// // ==========================================
// // ADD NEW LOAD
// // ==========================================
// export async function addLoad(formData: FormData) {
//   try {
//     const buildingId = Number(formData.get("buildingId"));
//     const name = (formData.get("name") as string).trim();
//     const customerName = formData.get("customerName") as string;
//     const chickType = formData.get("chickType") as string;
//     const loadDate = formData.get("loadDate") as string;
//     const harvestDate = formData.get("harvestDate") as string | null;
//     const actualQuantityLoad = Number(formData.get("actualQuantityLoad"));
//     const pricePerChick = Number(formData.get("pricePerChick"));
//     const sellingPrice = Number(formData.get("sellingPrice"));
//     const initialCapital = Number(formData.get("initialCapital"));

//     const existingBatch = await db
//       .select()
//       .from(loads)
//       .where(and(eq(loads.buildingId, buildingId), eq(loads.name, name)))
//       .limit(1);

//     if (existingBatch.length > 0) {
//       return {
//         error: `The batch name "${name}" has already been used for this building in the past.`,
//       };
//     }

//     const [newLoad] = await db
//       .insert(loads)
//       .values({
//         buildingId,
//         name,
//         customerName,
//         chickType,
//         loadDate,
//         harvestDate,
//         actualQuantityLoad,
//         actualCostPerChick: pricePerChick.toString(),
//         sellingPrice: sellingPrice.toString(),
//         initialCapital: initialCapital.toString(),
//         isActive: true,
//       })
//       .returning({ id: loads.id });

//     const userId = await getAuthUserId();

//     const buildingData = await db
//       .select({ farmId: buildings.farmId })
//       .from(buildings)
//       .where(eq(buildings.id, buildingId))
//       .limit(1);

//     if (buildingData[0]?.farmId && userId) {
//       await db.insert(expenses).values({
//         farmId: buildingData[0].farmId,
//         loadId: newLoad.id,
//         amount: initialCapital.toString(),
//         expenseType: "chick_purchase",
//         expenseDate: loadDate,
//         recordedBy: userId,
//         remarks: `Initial Load: ${actualQuantityLoad.toLocaleString()} heads @ ₱${pricePerChick.toLocaleString()}/head`,
//       });
//     }

//     revalidatePath("/production/loading");
//     return { success: true, id: newLoad.id };
//   } catch (error) {
//     console.error("Error adding load:", error);
//     return { error: "Failed to add load to database." };
//   }
// }

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

    // ---> NEW: Extract split quantities <---
    const paidQuantity = Number(formData.get("paidQuantity")) || 0;
    const allowanceQuantity = Number(formData.get("allowanceQuantity")) || 0;
    const pricePerChick = Number(formData.get("pricePerChick")) || 0;
    const sellingPrice = Number(formData.get("sellingPrice")) || 0;

    // ---> NEW: Accurate Math <---
    // Total for mortality/harvest tracking (e.g., 10,600)
    const actualQuantityLoad = paidQuantity + allowanceQuantity;

    // Capital ONLY accounts for paid chicks (e.g., 10,000 * 40 = 400,000)
    const initialCapital = paidQuantity * pricePerChick;

    const existingBatch = await db
      .select()
      .from(loads)
      .where(and(eq(loads.buildingId, buildingId), eq(loads.name, name)))
      .limit(1);

    if (existingBatch.length > 0) {
      return {
        error: `The batch name "${name}" has already been used for this building in the past.`,
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

        // Pass the new specific quantities to the database
        paidQuantity,
        allowanceQuantity,
        actualQuantityLoad,

        actualCostPerChick: pricePerChick.toString(),
        sellingPrice: sellingPrice.toString(),
        initialCapital: initialCapital.toString(),
        isActive: true,
      })
      .returning({ id: loads.id });

    const userId = await getAuthUserId();

    const buildingData = await db
      .select({ farmId: buildings.farmId })
      .from(buildings)
      .where(eq(buildings.id, buildingId))
      .limit(1);

    if (buildingData[0]?.farmId && userId) {
      // Update the expense log remark so Ma'am Lani sees exactly what she paid for
      await db.insert(expenses).values({
        farmId: buildingData[0].farmId,
        loadId: newLoad.id,
        amount: initialCapital.toString(),
        expenseType: "chick_purchase",
        expenseDate: loadDate,
        recordedBy: userId,
        remarks: `Initial Load: Paid ${paidQuantity.toLocaleString()} heads (+${allowanceQuantity} free) @ ₱${pricePerChick.toLocaleString()}/head. Total Loaded: ${actualQuantityLoad.toLocaleString()}`,
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

  // ---> NEW: Extract split quantities <---
  const paidQuantity = Number(formData.get("paidQuantity")) || 0;
  const allowanceQuantity = Number(formData.get("allowanceQuantity")) || 0;
  const actualQuantityLoad = paidQuantity + allowanceQuantity;

  const customerName = formData.get("customerName") as string;
  const chickType = formData.get("chickType") as string;

  const initialCapital = Number(formData.get("initialCapital")) || 0;
  const sellingPrice = formData.get("sellingPrice") as string;

  if (!id) return { error: "Load ID is missing. Cannot update." };

  // Keep the per-chick price accurate if they edit the capital or quantity
  const actualCostPerChick =
    paidQuantity > 0 ? initialCapital / paidQuantity : 0;

  try {
    await db
      .update(loads)
      .set({
        loadDate: loadDate,
        harvestDate: harvestDate || null,

        // Push the separated quantities
        paidQuantity: paidQuantity,
        allowanceQuantity: allowanceQuantity,
        actualQuantityLoad: actualQuantityLoad,

        customerName: customerName || null,
        ...(chickType ? { chickType } : {}),
        initialCapital: initialCapital.toString(),
        actualCostPerChick: actualCostPerChick.toString(),
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
// GET EXACT LIVE BIRD COUNT
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
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized" };

  const loadId = Number(formData.get("loadId"));
  const harvestDate = formData.get("harvestDate") as string;
  const quantity = Number(formData.get("quantity"));
  const sellingPrice = formData.get("sellingPrice") as string;
  const customerName = formData.get("customerName") as string;
  const remarks = formData.get("remarks") as string;
  const isFinalHarvest = formData.get("isFinalHarvest") === "on";

  const leftoverResolution = formData.get("leftoverResolution") as string;
  const targetLoadId = Number(formData.get("targetLoadId"));

  if (!loadId || !harvestDate || !quantity || !sellingPrice) {
    return { error: "Please fill in all required fields." };
  }

  try {
    const loadData = await db
      .select({
        actualQuantityLoad: loads.actualQuantityLoad,
        buildingName: buildings.name,
      })
      .from(loads)
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .where(eq(loads.id, loadId))
      .limit(1);

    if (loadData.length === 0) return { error: "Load not found." };
    const originalQuantity = loadData[0].actualQuantityLoad;
    const sourceBuildingName = loadData[0].buildingName;

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

    // 1. Log the Harvest Record
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

    // 2. If completely harvested, mark load as closed
    if (isClosed) {
      await db
        .update(loads)
        .set({ isActive: false, harvestDate: harvestDate })
        .where(eq(loads.id, loadId));

      // 3. Handle Leftover Feeds safely!
      if (leftoverResolution === "transfer" && targetLoadId) {
        const activeFeeds = await db
          .select()
          .from(feedAllocations)
          .where(eq(feedAllocations.loadId, loadId));

        for (const feed of activeFeeds) {
          const leftoverQty = Number(feed.remainingInBuilding);

          if (leftoverQty > 0) {
            // A. Move physical stock to new building
            await db.insert(feedAllocations).values({
              loadId: targetLoadId,
              deliveryId: feed.deliveryId,
              feedType: feed.feedType,
              allocatedQuantity: String(leftoverQty),
              remainingInBuilding: String(leftoverQty),
              allocatedDate: harvestDate,
              recordedBy: userId,
              isInternalTransfer: true,
              sourceBuilding: sourceBuildingName,
            });

            // B. Zero out old building stock
            const newAllocatedQty =
              Number(feed.allocatedQuantity) - leftoverQty;
            await db
              .update(feedAllocations)
              .set({
                remainingInBuilding: "0",
                allocatedQuantity: String(Math.max(0, newAllocatedQty)),
              })
              .where(eq(feedAllocations.id, feed.id));
          }
        }
      }
    }

    revalidatePath("/production/loading");
    revalidatePath("/inventory");
    revalidatePath("/inventory/building-stocks");

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
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized" };

  const loadId = Number(formData.get("loadId"));
  const dateAdded = formData.get("dateAdded") as string;

  // ---> NEW: Extract split quantities <---
  const paidQuantity = Number(formData.get("paidQuantity")) || 0;
  const allowanceQuantity = Number(formData.get("allowanceQuantity")) || 0;
  const newPricePerChick = Number(formData.get("newPricePerChick")) || 0;

  const totalAddedQty = paidQuantity + allowanceQuantity;
  const addedCapital = paidQuantity * newPricePerChick;

  if (!loadId || totalAddedQty <= 0 || newPricePerChick <= 0 || !dateAdded) {
    return { error: "Please fill in all required fields." };
  }

  try {
    const loadData = await db
      .select({
        currentQty: loads.actualQuantityLoad,
        currentPaidQty: loads.paidQuantity,
        currentAllowanceQty: loads.allowanceQuantity,
        currentCapital: loads.initialCapital,
        farmId: buildings.farmId,
      })
      .from(loads)
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .where(eq(loads.id, loadId))
      .limit(1);

    if (loadData.length === 0) return { error: "Load not found." };

    const currentQty = loadData[0].currentQty;
    const currentPaidQty = loadData[0].currentPaidQty;
    const currentAllowanceQty = loadData[0].currentAllowanceQty;
    const currentCapital = Number(loadData[0].currentCapital) || 0;
    const farmId = loadData[0].farmId;

    // Calculate the new totals
    const newTotalQty = currentQty + totalAddedQty;
    const newPaidQty = currentPaidQty + paidQuantity;
    const newAllowanceQty = currentAllowanceQty + allowanceQuantity;
    const newTotalCapital = currentCapital + addedCapital;

    // Average price is based ONLY on paid chicks
    const newAveragePrice = newPaidQty > 0 ? newTotalCapital / newPaidQty : 0;

    await db
      .update(loads)
      .set({
        actualQuantityLoad: newTotalQty,
        paidQuantity: newPaidQty,
        allowanceQuantity: newAllowanceQty,
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
      remarks: `Top-Up: Paid ${paidQuantity.toLocaleString()} heads (+${allowanceQuantity} free) @ ₱${newPricePerChick.toLocaleString()}/head. Total Added: ${totalAddedQty.toLocaleString()}`,
    });

    revalidatePath("/production/loading");
    return { success: true };
  } catch (error) {
    console.error("Error adding more chicks:", error);
    return { error: "Failed to add chicks to load." };
  }
}

// ==========================================
// FETCH UNIFIED LOAD TIMELINE
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
