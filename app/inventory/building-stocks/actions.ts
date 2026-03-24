// "use server";

// import { db } from "@/src";
// import { feedAllocations } from "@/src/db/schema";
// import { eq } from "drizzle-orm";
// import { revalidatePath } from "next/cache";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// export async function transferStockMidFlock(formData: FormData) {
//   try {
//     const session = await getServerSession(authOptions);
//     const userId = session?.user?.id ? Number(session.user.id) : undefined;

//     const sourceFeedId = Number(formData.get("sourceFeedId"));
//     const targetLoadId = Number(formData.get("targetLoadId"));
//     const transferQty = Number(formData.get("transferQty"));
//     const sourceBuildingName = formData.get("sourceBuildingName") as string;

//     if (transferQty <= 0)
//       return { error: "Transfer quantity must be greater than zero." };

//     const sourceFeedArray = await db
//       .select()
//       .from(feedAllocations)
//       .where(eq(feedAllocations.id, sourceFeedId))
//       .limit(1);
//     if (sourceFeedArray.length === 0)
//       return { error: "Source feed not found." };
//     const sourceFeed = sourceFeedArray[0];

//     if (Number(sourceFeed.remainingInBuilding) < transferQty) {
//       return { error: "Not enough feeds left to transfer this amount." };
//     }

//     await db
//       .update(feedAllocations)
//       .set({
//         remainingInBuilding: String(
//           Number(sourceFeed.remainingInBuilding) - transferQty,
//         ),
//         allocatedQuantity: String(
//           Number(sourceFeed.allocatedQuantity) - transferQty,
//         ),
//       })
//       .where(eq(feedAllocations.id, sourceFeedId));

//     // ---> THIS IS THE CRITICAL INSERT <---
//     await db.insert(feedAllocations).values({
//       loadId: targetLoadId,
//       deliveryId: sourceFeed.deliveryId,
//       feedType: sourceFeed.feedType,
//       allocatedQuantity: String(transferQty),
//       remainingInBuilding: String(transferQty),
//       allocatedDate: new Date().toISOString(),
//       recordedBy: userId,
//       isInternalTransfer: true, // TELLS THE SYSTEM IT'S FARM-TO-FARM
//       sourceBuilding: sourceBuildingName, // RECORDS WHERE IT CAME FROM
//     });

//     revalidatePath("/inventory/building-stocks");
//     revalidatePath("/inventory"); // Force the main ledger to update too!
//     return { success: true };
//   } catch (error) {
//     console.error("Transfer Error:", error);
//     return { error: "Failed to transfer feeds." };
//   }
// }

// "use server";

// import { db } from "@/src";
// import {
//   feedAllocations,
//   feedDeliveries,
//   loads,
//   buildings,
//   expenses,
// } from "@/src/db/schema";
// import { eq } from "drizzle-orm";
// import { revalidatePath } from "next/cache";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// export async function transferStockMidFlock(formData: FormData) {
//   try {
//     const session = await getServerSession(authOptions);
//     const userId = session?.user?.id ? Number(session.user.id) : undefined;

//     const sourceFeedId = Number(formData.get("sourceFeedId"));
//     const targetLoadId = Number(formData.get("targetLoadId"));
//     const transferQty = Number(formData.get("transferQty"));
//     const sourceBuildingName = formData.get("sourceBuildingName") as string;

//     if (transferQty <= 0)
//       return { error: "Transfer quantity must be greater than zero." };

//     const sourceFeedArray = await db
//       .select()
//       .from(feedAllocations)
//       .where(eq(feedAllocations.id, sourceFeedId))
//       .limit(1);
//     if (sourceFeedArray.length === 0)
//       return { error: "Source feed not found." };
//     const sourceFeed = sourceFeedArray[0];

//     if (Number(sourceFeed.remainingInBuilding) < transferQty) {
//       return { error: "Not enough feeds left to transfer this amount." };
//     }

//     // ---> GET EXACT UNIT PRICE OF THESE FEEDS <---
//     const deliveryRecord = await db
//       .select({ unitPrice: feedDeliveries.unitPrice })
//       .from(feedDeliveries)
//       .where(eq(feedDeliveries.id, sourceFeed.deliveryId))
//       .limit(1);

//     const unitPrice =
//       deliveryRecord.length > 0 ? Number(deliveryRecord[0].unitPrice) : 0;
//     const totalFinancialValue = transferQty * unitPrice;

//     // Deduct physical stock
//     await db
//       .update(feedAllocations)
//       .set({
//         remainingInBuilding: String(
//           Number(sourceFeed.remainingInBuilding) - transferQty,
//         ),
//         allocatedQuantity: String(
//           Number(sourceFeed.allocatedQuantity) - transferQty,
//         ),
//       })
//       .where(eq(feedAllocations.id, sourceFeedId));

//     // Add physical stock to new building
//     await db.insert(feedAllocations).values({
//       loadId: targetLoadId,
//       deliveryId: sourceFeed.deliveryId,
//       feedType: sourceFeed.feedType,
//       allocatedQuantity: String(transferQty),
//       remainingInBuilding: String(transferQty),
//       allocatedDate: new Date().toISOString(),
//       recordedBy: userId,
//       isInternalTransfer: true,
//       sourceBuilding: sourceBuildingName,
//     });

//     // ---> FINANCIAL RECONCILIATION <---
//     if (totalFinancialValue > 0 && userId) {
//       const sourceLoadData = await db
//         .select({ farmId: buildings.farmId })
//         .from(loads)
//         .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//         .where(eq(loads.id, sourceFeed.loadId))
//         .limit(1);
//       const targetLoadData = await db
//         .select({ farmId: buildings.farmId })
//         .from(loads)
//         .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//         .where(eq(loads.id, targetLoadId))
//         .limit(1);

//       if (sourceLoadData.length > 0 && targetLoadData.length > 0) {
//         // Refund Source
//         await db.insert(expenses).values({
//           farmId: sourceLoadData[0].farmId,
//           loadId: sourceFeed.loadId,
//           expenseType: "feeds",
//           amount: String(-totalFinancialValue),
//           expenseDate: new Date().toISOString(),
//           recordedBy: userId,
//           remarks: `Refund: Transferred ${transferQty} sacks of ${sourceFeed.feedType} out to another batch.`,
//         });

//         // Charge Target
//         await db.insert(expenses).values({
//           farmId: targetLoadData[0].farmId,
//           loadId: targetLoadId,
//           expenseType: "feeds",
//           amount: String(totalFinancialValue),
//           expenseDate: new Date().toISOString(),
//           recordedBy: userId,
//           remarks: `Cost Transfer: Received ${transferQty} sacks of ${sourceFeed.feedType} from ${sourceBuildingName}.`,
//         });
//       }
//     }

//     revalidatePath("/inventory/building-stocks");
//     revalidatePath("/inventory");
//     revalidatePath("/production/loading"); // Refresh finances!
//     return { success: true };
//   } catch (error) {
//     console.error("Transfer Error:", error);
//     return { error: "Failed to transfer feeds." };
//   }
// }

"use server";

import { db } from "@/src";
import { feedAllocations } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function transferStockMidFlock(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    const sourceFeedId = Number(formData.get("sourceFeedId"));
    const targetLoadId = Number(formData.get("targetLoadId"));
    const transferQty = Number(formData.get("transferQty"));
    const sourceBuildingName = formData.get("sourceBuildingName") as string;

    if (transferQty <= 0)
      return { error: "Transfer quantity must be greater than zero." };

    const sourceFeedArray = await db
      .select()
      .from(feedAllocations)
      .where(eq(feedAllocations.id, sourceFeedId))
      .limit(1);
    if (sourceFeedArray.length === 0)
      return { error: "Source feed not found." };
    const sourceFeed = sourceFeedArray[0];

    if (Number(sourceFeed.remainingInBuilding) < transferQty) {
      return { error: "Not enough feeds left to transfer this amount." };
    }

    // Deduct physical stock
    await db
      .update(feedAllocations)
      .set({
        remainingInBuilding: String(
          Number(sourceFeed.remainingInBuilding) - transferQty,
        ),
        allocatedQuantity: String(
          Number(sourceFeed.allocatedQuantity) - transferQty,
        ),
      })
      .where(eq(feedAllocations.id, sourceFeedId));

    // Add physical stock to new building (NO FINANCIAL RECONCILIATION NEEDED)
    await db.insert(feedAllocations).values({
      loadId: targetLoadId,
      deliveryId: sourceFeed.deliveryId,
      feedType: sourceFeed.feedType,
      allocatedQuantity: String(transferQty),
      remainingInBuilding: String(transferQty),
      allocatedDate: new Date().toISOString(),
      recordedBy: userId,
      isInternalTransfer: true,
      sourceBuilding: sourceBuildingName,
    });

    revalidatePath("/inventory/building-stocks");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Transfer Error:", error);
    return { error: "Failed to transfer feeds." };
  }
}
