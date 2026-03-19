"use server";

import { db } from "../../src";
import {
  feedDeliveries,
  feedAllocations,
  loads,
  buildings,
  expenses,
  users,
} from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";

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

// ==========================================
// 1. LOG NEW WAREHOUSE DELIVERY
// ==========================================
export async function logFeedDelivery(formData: FormData) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    const supplierName = formData.get("supplierName") as string;
    const deliveryDate = formData.get("deliveryDate") as string;
    const feedType = formData.get("feedType") as string;
    const quantity = Number(formData.get("quantity"));
    const unitPrice = formData.get("unitPrice") as string;
    const cashBond = (formData.get("cashBond") as string) || "0";

    if (
      !supplierName ||
      !deliveryDate ||
      !feedType ||
      !quantity ||
      !unitPrice
    ) {
      return { error: "Please fill in all required fields." };
    }

    await db.insert(feedDeliveries).values({
      supplierName: supplierName.toUpperCase(),
      deliveryDate,
      feedType: feedType.toUpperCase(),
      // ---> FIX: Safely cast to String for Drizzle numeric schema <---
      quantity: String(quantity),
      remainingQuantity: String(quantity),
      unitPrice,
      cashBond,
      recordedBy: userId,
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Delivery Error:", error);
    return { error: "Failed to log delivery." };
  }
}

// ==========================================
// 2. ALLOCATE FEEDS TO BUILDING
// ==========================================
export async function allocateFeeds(formData: FormData) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    const deliveryId = Number(formData.get("deliveryId"));
    const loadId = Number(formData.get("loadId"));
    const allocatedDate = formData.get("allocatedDate") as string;
    const allocatedQuantity = Number(formData.get("quantity"));

    if (!deliveryId || !loadId || !allocatedDate || !allocatedQuantity) {
      return { error: "Missing required fields." };
    }

    // 1. Verify Warehouse Stock
    const delivery = await db
      .select()
      .from(feedDeliveries)
      .where(eq(feedDeliveries.id, deliveryId))
      .limit(1);
    if (delivery.length === 0) return { error: "Delivery record not found." };

    // ---> FIX: Convert DB string back to Number for safe math <---
    const currentRemaining = Number(delivery[0].remainingQuantity);

    if (currentRemaining < allocatedQuantity) {
      return {
        error: `Not enough stock. Only ${currentRemaining} sacks left in this delivery.`,
      };
    }

    // 2. Get Building/Farm details to log the financial expense
    const loadInfo = await db
      .select({ farmId: buildings.farmId, buildingName: buildings.name })
      .from(loads)
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .where(eq(loads.id, loadId))
      .limit(1);

    if (loadInfo.length === 0) return { error: "Target load not found." };

    // 3. THE MATH
    const totalCost = allocatedQuantity * Number(delivery[0].unitPrice);

    // 4. Deduct from Warehouse
    await db
      .update(feedDeliveries)
      .set({
        // ---> FIX: Cast math back to String <---
        remainingQuantity: String(currentRemaining - allocatedQuantity),
      })
      .where(eq(feedDeliveries.id, deliveryId));

    // 5. Add to Building Sub-Inventory
    await db.insert(feedAllocations).values({
      deliveryId,
      loadId,
      allocatedDate,
      feedType: delivery[0].feedType,
      // ---> FIX: Cast quantities to String <---
      allocatedQuantity: String(allocatedQuantity),
      remainingInBuilding: String(allocatedQuantity),
      recordedBy: userId,
    });

    // 6. Log the Financial Expense precisely!
    await db.insert(expenses).values({
      farmId: loadInfo[0].farmId,
      loadId,
      expenseType: "feeds",
      amount: String(totalCost),
      expenseDate: allocatedDate,
      recordedBy: userId,
      remarks: `Allocated ${allocatedQuantity} sacks of ${delivery[0].feedType} from ${delivery[0].supplierName}`,
    });

    revalidatePath("/inventory");
    revalidatePath("/production/loading");
    revalidatePath("/production/monitoring");

    return { success: true };
  } catch (error) {
    console.error("Allocation Error:", error);
    return { error: "Failed to allocate feeds." };
  }
}

// ==========================================
// 3. SAFE DELETE WAREHOUSE DELIVERY
// ==========================================
export async function deleteFeedDelivery(id: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    const delivery = await db
      .select()
      .from(feedDeliveries)
      .where(eq(feedDeliveries.id, id))
      .limit(1);

    if (delivery.length === 0) return { error: "Delivery not found." };

    // STRICT SAFETY LOCK: Ensure no feeds have been transferred yet!
    if (
      Number(delivery[0].quantity) !== Number(delivery[0].remainingQuantity)
    ) {
      return {
        error:
          "Cannot delete: Feeds from this batch have already been transferred. Please delete the transfer logs first.",
      };
    }

    await db.delete(feedDeliveries).where(eq(feedDeliveries.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Delete Delivery Error:", error);
    return { error: "Failed to delete delivery." };
  }
}

// ==========================================
// 4. SAFE EDIT WAREHOUSE DELIVERY
// ==========================================
export async function updateFeedDelivery(id: number, formData: FormData) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    const delivery = await db
      .select()
      .from(feedDeliveries)
      .where(eq(feedDeliveries.id, id))
      .limit(1);

    if (delivery.length === 0) return { error: "Delivery not found." };

    const newSupplier = formData.get("supplierName") as string;
    const newDate = formData.get("deliveryDate") as string;
    const newFeedType = formData.get("feedType") as string;
    const newQty = Number(formData.get("quantity"));
    const newUnitPrice = formData.get("unitPrice") as string;
    const newCashBond = (formData.get("cashBond") as string) || "0";

    const oldQty = Number(delivery[0].quantity);
    const oldRemaining = Number(delivery[0].remainingQuantity);

    // Calculate how many sacks were ALREADY transferred to buildings
    const consumed = oldQty - oldRemaining;

    // STRICT SAFETY LOCK: Prevent lowering quantity below what was already moved
    if (newQty < consumed) {
      return {
        error: `Invalid Quantity! You have already transferred ${consumed} sacks to buildings. You cannot set the total below ${consumed}.`,
      };
    }

    // Calculate the newly adjusted remaining quantity
    const newRemaining = newQty - consumed;

    await db
      .update(feedDeliveries)
      .set({
        supplierName: newSupplier.toUpperCase(),
        deliveryDate: newDate,
        feedType: newFeedType.toUpperCase(),
        quantity: String(newQty),
        remainingQuantity: String(newRemaining),
        unitPrice: newUnitPrice,
        cashBond: newCashBond,
      })
      .where(eq(feedDeliveries.id, id));

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Update Delivery Error:", error);
    return { error: "Failed to update delivery." };
  }
}

// ==========================================
// 5. REVERSE / DELETE A TRANSFER
// ==========================================
export async function deleteFeedTransfer(id: number) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { error: "Unauthorized" };

    const transfer = await db
      .select()
      .from(feedAllocations)
      .where(eq(feedAllocations.id, id))
      .limit(1);

    if (transfer.length === 0) return { error: "Transfer not found." };

    // 1. Find the original delivery batch
    const delivery = await db
      .select()
      .from(feedDeliveries)
      .where(eq(feedDeliveries.id, transfer[0].deliveryId))
      .limit(1);

    // 2. Refund the feeds back to the warehouse!
    if (delivery.length > 0) {
      await db
        .update(feedDeliveries)
        .set({
          remainingQuantity: String(
            Number(delivery[0].remainingQuantity) +
              Number(transfer[0].allocatedQuantity),
          ),
        })
        .where(eq(feedDeliveries.id, transfer[0].deliveryId));
    }

    // 3. Delete the transfer record (which removes it from the building inventory)
    await db.delete(feedAllocations).where(eq(feedAllocations.id, id));

    revalidatePath("/inventory");
    revalidatePath("/production/loading");
    return { success: true };
  } catch (error) {
    console.error("Delete Transfer Error:", error);
    return { error: "Failed to reverse transfer." };
  }
}
