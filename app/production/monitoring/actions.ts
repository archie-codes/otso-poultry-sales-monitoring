"use server";

import { db } from "../../../src";
import {
  dailyRecords,
  users,
  feedAllocations, // <--- TIER 2 SUB-INVENTORY
  loads,
  buildings,
} from "../../../src/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
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

  const mortalityAm = Number(formData.get("mortalityAm")) || 0;
  const mortalityPm = Number(formData.get("mortalityPm")) || 0;
  const mortality = mortalityAm + mortalityPm;

  const feedsConsumedAm = Number(formData.get("feedsConsumedAm")) || 0;
  const feedsConsumedPm = Number(formData.get("feedsConsumedPm")) || 0;
  const totalFeedsConsumed = feedsConsumedAm + feedsConsumedPm;
  const feedsConsumedString = String(totalFeedsConsumed);

  const feedType = formData.get("feedType") as string;
  const remarks = formData.get("remarks") as string;

  if (!loadId || !recordDate) return { error: "Missing required fields." };

  try {
    // 1. Insert Daily Record
    const [newRecord] = await db
      .insert(dailyRecords)
      .values({
        loadId,
        recordDate,
        mortalityAm,
        mortalityPm,
        mortality,
        feedType: feedType || null,
        feedsConsumedAm: String(feedsConsumedAm),
        feedsConsumedPm: String(feedsConsumedPm),
        feedsConsumed: feedsConsumedString,
        remarks: remarks || null,
        recordedBy: userId,
      })
      .returning({ id: dailyRecords.id });

    // 2. DEDUCT INVENTORY (FIFO Logic)
    if (totalFeedsConsumed > 0 && feedType) {
      let toDeduct = totalFeedsConsumed;

      // Get all allocations for this feed type in this building, oldest first
      const allocations = await db
        .select()
        .from(feedAllocations)
        .where(
          and(
            eq(feedAllocations.loadId, loadId),
            eq(feedAllocations.feedType, feedType),
          ),
        )
        .orderBy(asc(feedAllocations.allocatedDate), asc(feedAllocations.id));

      for (const alloc of allocations) {
        if (toDeduct <= 0) break;

        // Safely convert the database decimal string to a JavaScript Number
        const currentRemaining = Number(alloc.remainingInBuilding);

        // Use our safe 'currentRemaining' number for all the math below!
        if (currentRemaining > 0) {
          const deductAmount = Math.min(currentRemaining, toDeduct);

          await db
            .update(feedAllocations)
            .set({
              remainingInBuilding: String(currentRemaining - deductAmount),
            })
            .where(eq(feedAllocations.id, alloc.id));

          toDeduct -= deductAmount;
        }
      }
    } // <--- FIX: This closing bracket was missing!

    // Now this fires safely even if feeds are 0
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
    const record = await db
      .select()
      .from(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .limit(1);

    if (record.length === 0) return { error: "Record not found" };

    const { loadId, feedsConsumed, feedType } = record[0];
    const consumed = Number(feedsConsumed);

    // 1. Refund the eaten feeds back to the building's inventory
    if (consumed > 0 && feedType) {
      const latestAlloc = await db
        .select()
        .from(feedAllocations)
        .where(
          and(
            eq(feedAllocations.loadId, loadId),
            eq(feedAllocations.feedType, feedType),
          ),
        )
        .orderBy(desc(feedAllocations.allocatedDate), desc(feedAllocations.id))
        .limit(1);

      if (latestAlloc.length > 0) {
        // FIX: Wrap DB string in Number() before adding, then cast back to String
        const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
        await db
          .update(feedAllocations)
          .set({
            remainingInBuilding: String(currentRemaining + consumed),
          })
          .where(eq(feedAllocations.id, latestAlloc[0].id));
      }
    }

    // 2. Delete the actual record
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
    const record = await db
      .select()
      .from(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .limit(1);
    if (record.length === 0) return { error: "Record not found" };

    const oldConsumed = Number(record[0].feedsConsumed);
    const feedType = (formData.get("feedType") as string) || record[0].feedType;

    const mortalityAm = Number(formData.get("mortalityAm")) || 0;
    const mortalityPm = Number(formData.get("mortalityPm")) || 0;
    const mortality = mortalityAm + mortalityPm;

    const feedsConsumedAm = Number(formData.get("feedsConsumedAm")) || 0;
    const feedsConsumedPm = Number(formData.get("feedsConsumedPm")) || 0;
    const newTotalFeedsConsumed = feedsConsumedAm + feedsConsumedPm;

    const remarks = formData.get("remarks") as string;

    // Calculate inventory difference
    const difference = newTotalFeedsConsumed - oldConsumed;

    if (difference !== 0 && feedType) {
      const latestAlloc = await db
        .select()
        .from(feedAllocations)
        .where(
          and(
            eq(feedAllocations.loadId, record[0].loadId),
            eq(feedAllocations.feedType, feedType),
          ),
        )
        .orderBy(desc(feedAllocations.allocatedDate), desc(feedAllocations.id))
        .limit(1);

      if (latestAlloc.length > 0) {
        // FIX: Wrap DB string in Number() before subtracting, then cast back to String
        const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
        await db
          .update(feedAllocations)
          .set({
            remainingInBuilding: String(currentRemaining - difference),
          })
          .where(eq(feedAllocations.id, latestAlloc[0].id));
      }
    }

    await db
      .update(dailyRecords)
      .set({
        mortalityAm,
        mortalityPm,
        mortality,
        feedType: feedType || null,
        feedsConsumedAm: String(feedsConsumedAm),
        feedsConsumedPm: String(feedsConsumedPm),
        feedsConsumed: String(newTotalFeedsConsumed),
        remarks: remarks || null,
      })
      .where(eq(dailyRecords.id, id));

    revalidatePath("/production/monitoring");
    return { success: true, updatedId: id };
  } catch (error) {
    return { error: "Failed to update record." };
  }
}

export async function transferFeedStock(formData: FormData) {
  return {
    error:
      "Feed Transfers are now securely managed in the Main Warehouse Inventory Tab!",
  };
}
