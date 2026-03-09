"use server";

import { db } from "@/src";
import { notifications } from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Fetch the 10 most recent unread notifications for a specific user
export async function getRecentNotifications(userId: number) {
  try {
    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId)) // <-- Removed the isRead filter
      .orderBy(desc(notifications.createdAt))
      .limit(15); // Show a good amount of history
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

// Mark a single notification as read
export async function markAsRead(notificationId: number) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    // Revalidate the layout so the bell count updates instantly
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: "Failed to update" };
  }
}

// Mark all notifications as read
export async function markAllAsRead(userId: number) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, userId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return { error: "Failed to update" };
  }
}
