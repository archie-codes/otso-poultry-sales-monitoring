"use server";

import { db } from "../../../src";
import { dailyRecords, users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function addDailyRecord(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { error: "You must be logged in to submit records." };
  }

  let userId = (session.user as any).id;

  if (!userId && session.user.email) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (dbUser.length > 0) userId = dbUser[0].id;
  }
  if (!userId && session.user.name) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.name, session.user.name))
      .limit(1);
    if (dbUser.length > 0) userId = dbUser[0].id;
  }
  if (!userId) {
    return { error: "Could not verify your user account in the database." };
  }

  const loadId = Number(formData.get("loadId"));
  const recordDate = formData.get("recordDate") as string;
  const mortality = Number(formData.get("mortality")) || 0;
  const feedsConsumed = (formData.get("feedsConsumed") as string) || "0";
  const remarks = formData.get("remarks") as string;

  if (!loadId || !recordDate) {
    return { error: "Please select an active load and a date." };
  }

  try {
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

    revalidatePath("/production/monitoring");
    revalidatePath("/reports");

    return { success: true, newId: newRecord.id };
  } catch (error) {
    console.error("Error saving daily record:", error);
    return { error: "Failed to save record. Please try again." };
  }
}

export async function updateDailyRecord(id: number, formData: FormData) {
  try {
    const mortality = Number(formData.get("mortality")) || 0;
    const feedsConsumed = (formData.get("feedsConsumed") as string) || "0";
    const remarks = formData.get("remarks") as string;

    await db
      .update(dailyRecords)
      .set({
        mortality,
        feedsConsumed,
        remarks: remarks || null,
      })
      .where(eq(dailyRecords.id, id));

    revalidatePath("/production/monitoring");

    return { success: true, updatedId: id };
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Failed to update record." };
  }
}

export async function deleteDailyRecord(id: number) {
  try {
    await db.delete(dailyRecords).where(eq(dailyRecords.id, id));
    revalidatePath("/production/monitoring");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete record." };
  }
}
