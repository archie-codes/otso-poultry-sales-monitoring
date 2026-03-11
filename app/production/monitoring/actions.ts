"use server";

import { db } from "../../../src";
import {
  dailyRecords,
  users,
  feedTransactions,
  expenses,
  loads,
  buildings,
} from "../../../src/db/schema";
// Added 'inArray' for the Transfer Fix
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

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
// 1. ADD DAILY RECORD
// ==========================================
export async function addDailyRecord(formData: FormData) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized. Please log in." };

  const loadId = Number(formData.get("loadId"));
  const recordDate = formData.get("recordDate") as string;
  const mortality = Number(formData.get("mortality")) || 0;
  const feedsConsumed = formData.get("feedsConsumed") as string;
  const feedType = formData.get("feedType") as string;
  const remarks = formData.get("remarks") as string;

  if (!loadId || !recordDate) return { error: "Missing required fields." };

  try {
    // 1. SMART PRICE LOOKUP: Find the exact cost per bag from Delivery OR Transfer
    let lastDelivery = await db
      .select({
        costPerBag: feedTransactions.costPerBag,
        farmId: buildings.farmId,
      })
      .from(feedTransactions)
      .innerJoin(loads, eq(feedTransactions.loadId, loads.id))
      .innerJoin(buildings, eq(loads.buildingId, buildings.id))
      .where(
        and(
          eq(feedTransactions.loadId, loadId),
          eq(feedTransactions.feedType, feedType), // Try exact feed type first
          inArray(feedTransactions.transactionType, [
            "DELIVERY_IN",
            "TRANSFER_IN",
          ]), // <--- THE FIX
        ),
      )
      .orderBy(desc(feedTransactions.createdAt))
      .limit(1);

    // If exact match fails (e.g. they delivered 'BOOSTER' but logged 'STARTER'),
    // grab the latest delivery for that building regardless of type.
    if (lastDelivery.length === 0) {
      lastDelivery = await db
        .select({
          costPerBag: feedTransactions.costPerBag,
          farmId: buildings.farmId,
        })
        .from(feedTransactions)
        .innerJoin(loads, eq(feedTransactions.loadId, loads.id))
        .innerJoin(buildings, eq(loads.buildingId, buildings.id))
        .where(
          and(
            eq(feedTransactions.loadId, loadId),
            inArray(feedTransactions.transactionType, [
              "DELIVERY_IN",
              "TRANSFER_IN",
            ]), // <--- THE FIX
          ),
        )
        .orderBy(desc(feedTransactions.createdAt))
        .limit(1);
    }

    const costPerBag = Number(lastDelivery[0]?.costPerBag || 0); // E.g., 1100
    const farmId = lastDelivery[0]?.farmId;

    // 2. Insert Daily Record
    const [newRecord] = await db
      .insert(dailyRecords)
      .values({
        loadId,
        recordDate,
        mortality,
        feedsConsumed,
        remarks: remarks || null,
        recordedBy: userId,
      })
      .returning({ id: dailyRecords.id });

    // 3. Log Inventory & Accurate Expense
    const qtyNum = Number(feedsConsumed); // E.g., 2 bags
    if (qtyNum > 0 && feedType) {
      // Reduce Physical Sacks
      await db.insert(feedTransactions).values({
        loadId,
        feedType,
        transactionType: "DAILY_CONSUMPTION",
        quantity: -qtyNum,
        costPerBag: String(costPerBag),
        transactionDate: recordDate,
        recordedBy: userId,
        remarks: `DAILY_LOG_${newRecord.id}`,
      });

      // Log the Financial Expense (2 bags * 1100 = 2200)
      if (farmId && costPerBag > 0) {
        await db.insert(expenses).values({
          farmId,
          loadId, // <--- Locks this expense strictly to this flock!
          amount: String(qtyNum * costPerBag),
          expenseType: "feeds",
          expenseDate: recordDate,
          recordedBy: userId,
        });
      }
    }

    revalidatePath("/production/monitoring");
    return { success: true, newId: newRecord.id };
  } catch (error) {
    console.error("Save Error:", error);
    return { error: "Failed to save record." };
  }
}

// ==========================================
// 2. DELETE DAILY RECORD
// ==========================================
export async function deleteDailyRecord(id: number) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized." };

  try {
    // 1. Get the record details first to find the date/load
    const record = await db
      .select()
      .from(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .limit(1);
    if (record.length === 0) return { error: "Record not found" };

    const { loadId, recordDate } = record[0];

    // 2. Clean up physical inventory
    await db
      .delete(feedTransactions)
      .where(eq(feedTransactions.remarks, `DAILY_LOG_${id}`));

    // 3. Clean up financial expense
    // Since we don't have a description, we filter by load, date, and type
    await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.loadId, loadId),
          eq(expenses.expenseDate, recordDate),
          eq(expenses.expenseType, "feeds"),
        ),
      );

    // 4. Delete the actual record
    await db.delete(dailyRecords).where(eq(dailyRecords.id, id));

    revalidatePath("/production/monitoring");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete record." };
  }
}

// ==========================================
// 3. UPDATE DAILY RECORD
// ==========================================
export async function updateDailyRecord(id: number, formData: FormData) {
  try {
    const mortality = Number(formData.get("mortality")) || 0;
    const feedsConsumed = (formData.get("feedsConsumed") as string) || "0";
    const remarks = formData.get("remarks") as string;

    await db
      .update(dailyRecords)
      .set({ mortality, feedsConsumed, remarks: remarks || null })
      .where(eq(dailyRecords.id, id));

    revalidatePath("/production/monitoring");
    return { success: true, updatedId: id };
  } catch (error) {
    return { error: "Failed to update record." };
  }
}

// ==========================================
// 4. NEW: TRANSFER FEED STOCK ACTION
// ==========================================
export async function transferFeedStock(formData: FormData) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized." };

  const sourceLoadId = Number(formData.get("sourceLoadId"));
  const targetLoadId = Number(formData.get("targetLoadId"));
  const feedType = formData.get("feedType") as string;
  const quantity = Number(formData.get("quantity"));
  const transferDate = formData.get("transferDate") as string;
  const remarks = formData.get("remarks") as string;

  if (
    !sourceLoadId ||
    !targetLoadId ||
    !feedType ||
    !quantity ||
    !transferDate
  ) {
    return { error: "Missing required fields." };
  }
  if (sourceLoadId === targetLoadId) {
    return { error: "Cannot transfer to the same building." };
  }

  try {
    // 1. Get the cost value of the feed from the SOURCE building so we can carry it over
    const lastDelivery = await db
      .select({ costPerBag: feedTransactions.costPerBag })
      .from(feedTransactions)
      .where(
        and(
          eq(feedTransactions.loadId, sourceLoadId),
          eq(feedTransactions.feedType, feedType),
          inArray(feedTransactions.transactionType, [
            "DELIVERY_IN",
            "TRANSFER_IN",
          ]),
        ),
      )
      .orderBy(desc(feedTransactions.createdAt))
      .limit(1);

    // THE FIX: Use "0" (a string) because Drizzle maps numeric database columns to strings!
    const costPerBag = lastDelivery[0]?.costPerBag || "0";

    // 2. DEDUCT from Source Building (TRANSFER_OUT)
    await db.insert(feedTransactions).values({
      loadId: sourceLoadId,
      feedType,
      transactionType: "TRANSFER_OUT",
      quantity: -quantity, // Negative
      costPerBag,
      transactionDate: transferDate,
      recordedBy: userId,
      remarks: `Transferred OUT to Load ${targetLoadId}. ${remarks}`,
    });

    // 3. ADD to Target Building (TRANSFER_IN)
    await db.insert(feedTransactions).values({
      loadId: targetLoadId,
      feedType,
      transactionType: "TRANSFER_IN",
      quantity: quantity, // Positive
      costPerBag, // Passing the price over!
      transactionDate: transferDate,
      recordedBy: userId,
      remarks: `Transferred IN from Load ${sourceLoadId}. ${remarks}`,
    });

    revalidatePath("/production/monitoring");
    return { success: true };
  } catch (error) {
    console.error("Transfer Error:", error);
    return { error: "Failed to process transfer." };
  }
}
