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
