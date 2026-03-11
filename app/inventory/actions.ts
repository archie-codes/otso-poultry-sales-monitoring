"use server";

import { db } from "../../src";
import { feedTransactions, users, loads, buildings } from "../../src/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

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
// 1. LOG FEED DELIVERY
// ==========================================
export async function logFeedDelivery(formData: FormData) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized. Please log in." };

  const loadId = Number(formData.get("loadId"));
  const feedType = formData.get("feedType") as string;
  const quantity = Number(formData.get("quantity"));
  const costPerBag = formData.get("costPerBag") as string;
  const transactionDate = formData.get("transactionDate") as string;
  const referenceNumber = formData.get("referenceNumber") as string;
  const remarks = formData.get("remarks") as string;

  if (!loadId || !feedType || !quantity || !costPerBag || !transactionDate) {
    return { error: "Missing required fields." };
  }

  try {
    await db.insert(feedTransactions).values({
      loadId,
      feedType,
      transactionType: "DELIVERY_IN",
      quantity,
      costPerBag,
      transactionDate,
      referenceNumber: referenceNumber || null,
      remarks: remarks || "Initial Delivery",
      recordedBy: userId,
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Delivery Error:", error);
    return { error: "Failed to log feed delivery." };
  }
}

// ==========================================
// 2. TRANSFER FEED STOCK
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
    // 1. Get the exact cost value from the source so we can carry it over
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
      costPerBag, // Pass the exact same price over
      transactionDate: transferDate,
      recordedBy: userId,
      remarks: `Transferred IN from Load ${sourceLoadId}. ${remarks}`,
    });

    // Revalidate the Inventory page!
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Transfer Error:", error);
    return { error: "Failed to process transfer." };
  }
}
