// "use server";

// import { db } from "../../../src";
// import {
//   dailyRecords,
//   users,
//   feedAllocations,
//   feedDeliveries, // <--- IMPORTED FOR UNIT PRICE AND CASH BOND LOOKUP
//   loads,
//   buildings,
//   expenses, // <--- IMPORTED TO LOG THE COST
// } from "../../../src/db/schema";
// import { eq, and, desc, asc, like } from "drizzle-orm";
// import { revalidatePath } from "next/cache";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../../lib/auth";

// // --- HELPER: GET AUTH USER ID ---
// async function getAuthUserId() {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.email) return null;

//   const dbUser = await db
//     .select({ id: users.id })
//     .from(users)
//     .where(eq(users.email, session.user.email))
//     .limit(1);

//   return dbUser[0]?.id || null;
// }

// // ==========================================
// // 1. ADD DAILY RECORD
// // ==========================================
// export async function addDailyRecord(formData: FormData) {
//   const userId = await getAuthUserId();
//   if (!userId) return { error: "Unauthorized. Please log in." };

//   const loadId = Number(formData.get("loadId"));
//   const recordDate = formData.get("recordDate") as string;

//   const mortalityAm = Number(formData.get("mortalityAm")) || 0;
//   const mortalityPm = Number(formData.get("mortalityPm")) || 0;
//   const mortality = mortalityAm + mortalityPm;

//   const feedsConsumedAm = Number(formData.get("feedsConsumedAm")) || 0;
//   const feedsConsumedPm = Number(formData.get("feedsConsumedPm")) || 0;
//   const totalFeedsConsumed = feedsConsumedAm + feedsConsumedPm;
//   const feedsConsumedString = String(totalFeedsConsumed);

//   const feedType = formData.get("feedType") as string;
//   const remarks = formData.get("remarks") as string;

//   if (!loadId || !recordDate) return { error: "Missing required fields." };

//   try {
//     // 1. Insert Daily Record
//     const [newRecord] = await db
//       .insert(dailyRecords)
//       .values({
//         loadId,
//         recordDate,
//         mortalityAm,
//         mortalityPm,
//         mortality,
//         feedType: feedType || null,
//         feedsConsumedAm: String(feedsConsumedAm),
//         feedsConsumedPm: String(feedsConsumedPm),
//         feedsConsumed: feedsConsumedString,
//         remarks: remarks || null,
//         recordedBy: userId,
//       })
//       .returning({ id: dailyRecords.id });

//     // 2. DEDUCT INVENTORY & CALCULATE EXACT COST (FIFO Logic)
//     let totalCost = 0;

//     if (totalFeedsConsumed > 0 && feedType) {
//       let toDeduct = totalFeedsConsumed;

//       // Join allocations with deliveries to get the EXACT unit price AND cash bond
//       const allocations = await db
//         .select({
//           id: feedAllocations.id,
//           remainingInBuilding: feedAllocations.remainingInBuilding,
//           unitPrice: feedDeliveries.unitPrice,
//           cashBond: feedDeliveries.cashBond, // <--- THE FIX: Fetch Cash Bond
//         })
//         .from(feedAllocations)
//         .innerJoin(
//           feedDeliveries,
//           eq(feedAllocations.deliveryId, feedDeliveries.id),
//         )
//         .where(
//           and(
//             eq(feedAllocations.loadId, loadId),
//             eq(feedAllocations.feedType, feedType),
//           ),
//         )
//         .orderBy(asc(feedAllocations.allocatedDate), asc(feedAllocations.id));

//       for (const alloc of allocations) {
//         if (toDeduct <= 0) break;

//         const currentRemaining = Number(alloc.remainingInBuilding);

//         if (currentRemaining > 0) {
//           const deductAmount = Math.min(currentRemaining, toDeduct);

//           await db
//             .update(feedAllocations)
//             .set({
//               remainingInBuilding: String(currentRemaining - deductAmount),
//             })
//             .where(eq(feedAllocations.id, alloc.id));

//           toDeduct -= deductAmount;

//           // ---> THE FIX: Calculate Cost Per Sack = Unit Price + Cash Bond <---
//           const costPerSack =
//             (Number(alloc.unitPrice) || 0) + (Number(alloc.cashBond) || 0);
//           totalCost += deductAmount * costPerSack;
//         }
//       }

//       // 3. LOG THE FINANCIAL EXPENSE
//       if (totalCost > 0) {
//         // Get the Farm ID so the expense goes to the right ledger
//         const loadInfo = await db
//           .select({ farmId: buildings.farmId })
//           .from(loads)
//           .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//           .where(eq(loads.id, loadId))
//           .limit(1);

//         if (loadInfo.length > 0) {
//           await db.insert(expenses).values({
//             farmId: loadInfo[0].farmId,
//             loadId: loadId,
//             expenseType: "feeds",
//             amount: String(totalCost), // Now contains Price + Bond
//             expenseDate: recordDate,
//             recordedBy: userId,
//             // We tag it so we can find it if the user edits this daily record later
//             remarks: `[DailyRecord:${newRecord.id}] Consumed ${totalFeedsConsumed} sacks of ${feedType}`,
//           });
//         }
//       }
//     }

//     revalidatePath("/production/monitoring");
//     return { success: true, newId: newRecord.id };
//   } catch (error) {
//     console.error("Save Error:", error);
//     return { error: "Failed to save record." };
//   }
// }

// // ==========================================
// // 2. DELETE DAILY RECORD
// // ==========================================
// export async function deleteDailyRecord(id: number) {
//   const userId = await getAuthUserId();
//   if (!userId) return { error: "Unauthorized." };

//   try {
//     const record = await db
//       .select()
//       .from(dailyRecords)
//       .where(eq(dailyRecords.id, id))
//       .limit(1);

//     if (record.length === 0) return { error: "Record not found" };

//     const { loadId, feedsConsumed, feedType } = record[0];
//     const consumed = Number(feedsConsumed);

//     // 1. DELETE THE ASSOCIATED FINANCIAL EXPENSE
//     await db
//       .delete(expenses)
//       .where(like(expenses.remarks, `[DailyRecord:${id}]%`));

//     // 2. Refund the physical feeds back to the building's inventory
//     if (consumed > 0 && feedType) {
//       const latestAlloc = await db
//         .select()
//         .from(feedAllocations)
//         .where(
//           and(
//             eq(feedAllocations.loadId, loadId),
//             eq(feedAllocations.feedType, feedType),
//           ),
//         )
//         .orderBy(desc(feedAllocations.allocatedDate), desc(feedAllocations.id))
//         .limit(1);

//       if (latestAlloc.length > 0) {
//         const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
//         await db
//           .update(feedAllocations)
//           .set({
//             remainingInBuilding: String(currentRemaining + consumed),
//           })
//           .where(eq(feedAllocations.id, latestAlloc[0].id));
//       }
//     }

//     // 3. Delete the actual record
//     await db.delete(dailyRecords).where(eq(dailyRecords.id, id));

//     revalidatePath("/production/monitoring");
//     return { success: true };
//   } catch (error) {
//     console.error("Delete error:", error);
//     return { error: "Failed to delete record." };
//   }
// }

// // ==========================================
// // 3. UPDATE DAILY RECORD
// // ==========================================
// export async function updateDailyRecord(id: number, formData: FormData) {
//   const userId = await getAuthUserId();
//   if (!userId) return { error: "Unauthorized." };

//   try {
//     const record = await db
//       .select()
//       .from(dailyRecords)
//       .where(eq(dailyRecords.id, id))
//       .limit(1);
//     if (record.length === 0) return { error: "Record not found" };

//     const oldConsumed = Number(record[0].feedsConsumed);
//     const feedType = (formData.get("feedType") as string) || record[0].feedType;

//     const mortalityAm = Number(formData.get("mortalityAm")) || 0;
//     const mortalityPm = Number(formData.get("mortalityPm")) || 0;
//     const mortality = mortalityAm + mortalityPm;

//     const feedsConsumedAm = Number(formData.get("feedsConsumedAm")) || 0;
//     const feedsConsumedPm = Number(formData.get("feedsConsumedPm")) || 0;
//     const newTotalFeedsConsumed = feedsConsumedAm + feedsConsumedPm;

//     const remarks = formData.get("remarks") as string;

//     // Calculate inventory difference
//     const difference = newTotalFeedsConsumed - oldConsumed;

//     if (difference !== 0 && feedType) {
//       // 1. DELETE OLD EXPENSE SO WE CAN RECALCULATE IT CLEANLY
//       await db
//         .delete(expenses)
//         .where(like(expenses.remarks, `[DailyRecord:${id}]%`));

//       // 2. REFUND THE OLD QUANTITY PHYSICALLY
//       if (oldConsumed > 0) {
//         const latestAlloc = await db
//           .select()
//           .from(feedAllocations)
//           .where(
//             and(
//               eq(feedAllocations.loadId, record[0].loadId),
//               eq(feedAllocations.feedType, feedType),
//             ),
//           )
//           .orderBy(
//             desc(feedAllocations.allocatedDate),
//             desc(feedAllocations.id),
//           )
//           .limit(1);

//         if (latestAlloc.length > 0) {
//           const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
//           await db
//             .update(feedAllocations)
//             .set({
//               remainingInBuilding: String(currentRemaining + oldConsumed),
//             })
//             .where(eq(feedAllocations.id, latestAlloc[0].id));
//         }
//       }

//       // 3. DEDUCT THE NEW QUANTITY (FIFO) & RECALCULATE EXACT COST
//       let totalCost = 0;
//       if (newTotalFeedsConsumed > 0) {
//         let toDeduct = newTotalFeedsConsumed;
//         const allocations = await db
//           .select({
//             id: feedAllocations.id,
//             remainingInBuilding: feedAllocations.remainingInBuilding,
//             unitPrice: feedDeliveries.unitPrice,
//             cashBond: feedDeliveries.cashBond, // <--- THE FIX: Fetch Cash Bond
//           })
//           .from(feedAllocations)
//           .innerJoin(
//             feedDeliveries,
//             eq(feedAllocations.deliveryId, feedDeliveries.id),
//           )
//           .where(
//             and(
//               eq(feedAllocations.loadId, record[0].loadId),
//               eq(feedAllocations.feedType, feedType),
//             ),
//           )
//           .orderBy(asc(feedAllocations.allocatedDate), asc(feedAllocations.id));

//         for (const alloc of allocations) {
//           if (toDeduct <= 0) break;
//           const currentRemaining = Number(alloc.remainingInBuilding);
//           if (currentRemaining > 0) {
//             const deductAmount = Math.min(currentRemaining, toDeduct);
//             await db
//               .update(feedAllocations)
//               .set({
//                 remainingInBuilding: String(currentRemaining - deductAmount),
//               })
//               .where(eq(feedAllocations.id, alloc.id));
//             toDeduct -= deductAmount;

//             // ---> THE FIX: Calculate Cost Per Sack = Unit Price + Cash Bond <---
//             const costPerSack =
//               (Number(alloc.unitPrice) || 0) + (Number(alloc.cashBond) || 0);
//             totalCost += deductAmount * costPerSack;
//           }
//         }
//       }

//       // 4. INSERT THE NEWLY RECALCULATED EXPENSE
//       if (totalCost > 0) {
//         const loadInfo = await db
//           .select({ farmId: buildings.farmId })
//           .from(loads)
//           .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//           .where(eq(loads.id, record[0].loadId))
//           .limit(1);
//         if (loadInfo.length > 0) {
//           await db.insert(expenses).values({
//             farmId: loadInfo[0].farmId,
//             loadId: record[0].loadId,
//             expenseType: "feeds",
//             amount: String(totalCost), // Now contains Price + Bond
//             expenseDate: record[0].recordDate,
//             recordedBy: userId,
//             remarks: `[DailyRecord:${id}] Consumed ${newTotalFeedsConsumed} sacks of ${feedType}`,
//           });
//         }
//       }
//     }

//     // 5. UPDATE THE DAILY RECORD TEXT
//     await db
//       .update(dailyRecords)
//       .set({
//         mortalityAm,
//         mortalityPm,
//         mortality,
//         feedType: feedType || null,
//         feedsConsumedAm: String(feedsConsumedAm),
//         feedsConsumedPm: String(feedsConsumedPm),
//         feedsConsumed: String(newTotalFeedsConsumed),
//         remarks: remarks || null,
//       })
//       .where(eq(dailyRecords.id, id));

//     revalidatePath("/production/monitoring");
//     return { success: true, updatedId: id };
//   } catch (error) {
//     return { error: "Failed to update record." };
//   }
// }

// export async function transferFeedStock(formData: FormData) {
//   return {
//     error:
//       "Feed Transfers are now securely managed in the Main Warehouse Inventory Tab!",
//   };
// }

"use server";

import { db } from "../../../src";
import {
  dailyRecords,
  users,
  feedAllocations,
  feedDeliveries,
  loads,
  buildings,
  expenses,
} from "../../../src/db/schema";
import { eq, and, desc, asc, like } from "drizzle-orm";
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

    // 2. DEDUCT INVENTORY & CALCULATE EXACT COST (FIFO Logic)
    let totalCost = 0;

    if (totalFeedsConsumed > 0 && feedType) {
      let toDeduct = totalFeedsConsumed;

      // Join allocations with deliveries to get the EXACT unit price & Cash Bond
      const allocations = await db
        .select({
          id: feedAllocations.id,
          remainingInBuilding: feedAllocations.remainingInBuilding,
          unitPrice: feedDeliveries.unitPrice,
          cashBond: feedDeliveries.cashBond,
        })
        .from(feedAllocations)
        .innerJoin(
          feedDeliveries,
          eq(feedAllocations.deliveryId, feedDeliveries.id),
        )
        .where(
          and(
            eq(feedAllocations.loadId, loadId),
            eq(feedAllocations.feedType, feedType),
          ),
        )
        .orderBy(asc(feedAllocations.allocatedDate), asc(feedAllocations.id));

      for (const alloc of allocations) {
        if (toDeduct <= 0) break;

        const currentRemaining = Number(alloc.remainingInBuilding);

        if (currentRemaining > 0) {
          const deductAmount = Math.min(currentRemaining, toDeduct);

          await db
            .update(feedAllocations)
            .set({
              remainingInBuilding: String(currentRemaining - deductAmount),
            })
            .where(eq(feedAllocations.id, alloc.id));

          toDeduct -= deductAmount;

          // Calculate Cost Per Sack = Unit Price + Cash Bond
          const costPerSack =
            (Number(alloc.unitPrice) || 0) + (Number(alloc.cashBond) || 0);
          totalCost += deductAmount * costPerSack;
        }
      }

      // 3. LOG THE FINANCIAL EXPENSE
      if (totalCost > 0) {
        const loadInfo = await db
          .select({ farmId: buildings.farmId })
          .from(loads)
          .innerJoin(buildings, eq(loads.buildingId, buildings.id))
          .where(eq(loads.id, loadId))
          .limit(1);

        if (loadInfo.length > 0) {
          await db.insert(expenses).values({
            farmId: loadInfo[0].farmId,
            loadId: loadId,
            expenseType: "feeds",
            amount: String(totalCost),
            expenseDate: recordDate,
            recordedBy: userId,
            remarks: `[DailyRecord:${newRecord.id}] Consumed ${totalFeedsConsumed} sacks of ${feedType}`,
          });
        }
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
    const record = await db
      .select()
      .from(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .limit(1);

    if (record.length === 0) return { error: "Record not found" };

    const { loadId, feedsConsumed, feedType } = record[0];
    const consumed = Number(feedsConsumed);

    // 1. DELETE THE ASSOCIATED FINANCIAL EXPENSE
    await db
      .delete(expenses)
      .where(like(expenses.remarks, `[DailyRecord:${id}]%`));

    // 2. Refund the physical feeds back to the building's inventory
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
        const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
        await db
          .update(feedAllocations)
          .set({
            remainingInBuilding: String(currentRemaining + consumed),
          })
          .where(eq(feedAllocations.id, latestAlloc[0].id));
      }
    }

    // 3. Delete the actual record
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
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized." };

  try {
    const record = await db
      .select()
      .from(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .limit(1);
    if (record.length === 0) return { error: "Record not found" };

    // ---> THE FIX: Capture the old feed type so we refund the correct item! <---
    const oldFeedType = record[0].feedType;
    const oldConsumed = Number(record[0].feedsConsumed);

    // This is the newly selected feed type from the edit modal
    const newFeedType = (formData.get("feedType") as string) || oldFeedType;

    const mortalityAm = Number(formData.get("mortalityAm")) || 0;
    const mortalityPm = Number(formData.get("mortalityPm")) || 0;
    const mortality = mortalityAm + mortalityPm;

    const feedsConsumedAm = Number(formData.get("feedsConsumedAm")) || 0;
    const feedsConsumedPm = Number(formData.get("feedsConsumedPm")) || 0;
    const newTotalFeedsConsumed = feedsConsumedAm + feedsConsumedPm;

    const remarks = formData.get("remarks") as string;

    // 1. DELETE OLD EXPENSE (Always do this so we can create a clean new one)
    await db
      .delete(expenses)
      .where(like(expenses.remarks, `[DailyRecord:${id}]%`));

    // 2. FULLY REFUND THE OLD QUANTITY TO THE OLD FEED TYPE PHYSICALLY
    if (oldConsumed > 0 && oldFeedType) {
      const latestAlloc = await db
        .select()
        .from(feedAllocations)
        .where(
          and(
            eq(feedAllocations.loadId, record[0].loadId),
            // ---> THE FIX: Ensuring the old sacks go back to the old feed type <---
            eq(feedAllocations.feedType, oldFeedType),
          ),
        )
        .orderBy(desc(feedAllocations.allocatedDate), desc(feedAllocations.id))
        .limit(1);

      if (latestAlloc.length > 0) {
        const currentRemaining = Number(latestAlloc[0].remainingInBuilding);
        await db
          .update(feedAllocations)
          .set({
            remainingInBuilding: String(currentRemaining + oldConsumed),
          })
          .where(eq(feedAllocations.id, latestAlloc[0].id));
      }
    }

    // 3. FULLY DEDUCT THE NEW QUANTITY FROM THE NEW FEED TYPE (FIFO) & RECALCULATE COST
    let totalCost = 0;
    if (newTotalFeedsConsumed > 0 && newFeedType) {
      let toDeduct = newTotalFeedsConsumed;
      const allocations = await db
        .select({
          id: feedAllocations.id,
          remainingInBuilding: feedAllocations.remainingInBuilding,
          unitPrice: feedDeliveries.unitPrice,
          cashBond: feedDeliveries.cashBond,
        })
        .from(feedAllocations)
        .innerJoin(
          feedDeliveries,
          eq(feedAllocations.deliveryId, feedDeliveries.id),
        )
        .where(
          and(
            eq(feedAllocations.loadId, record[0].loadId),
            // ---> THE FIX: Deducting the new amount from the newly selected feed type <---
            eq(feedAllocations.feedType, newFeedType),
          ),
        )
        .orderBy(asc(feedAllocations.allocatedDate), asc(feedAllocations.id));

      for (const alloc of allocations) {
        if (toDeduct <= 0) break;
        const currentRemaining = Number(alloc.remainingInBuilding);
        if (currentRemaining > 0) {
          const deductAmount = Math.min(currentRemaining, toDeduct);
          await db
            .update(feedAllocations)
            .set({
              remainingInBuilding: String(currentRemaining - deductAmount),
            })
            .where(eq(feedAllocations.id, alloc.id));
          toDeduct -= deductAmount;

          const costPerSack =
            (Number(alloc.unitPrice) || 0) + (Number(alloc.cashBond) || 0);
          totalCost += deductAmount * costPerSack;
        }
      }
    }

    // 4. INSERT THE NEWLY RECALCULATED EXPENSE
    if (totalCost > 0) {
      const loadInfo = await db
        .select({ farmId: buildings.farmId })
        .from(loads)
        .innerJoin(buildings, eq(loads.buildingId, buildings.id))
        .where(eq(loads.id, record[0].loadId))
        .limit(1);
      if (loadInfo.length > 0) {
        await db.insert(expenses).values({
          farmId: loadInfo[0].farmId,
          loadId: record[0].loadId,
          expenseType: "feeds",
          amount: String(totalCost),
          expenseDate: record[0].recordDate,
          recordedBy: userId,
          remarks: `[DailyRecord:${id}] Consumed ${newTotalFeedsConsumed} sacks of ${newFeedType}`,
        });
      }
    }

    // 5. UPDATE THE DAILY RECORD TEXT
    await db
      .update(dailyRecords)
      .set({
        mortalityAm,
        mortalityPm,
        mortality,
        feedType: newFeedType || null, // <--- THE FIX: Save the newly selected feed type!
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
