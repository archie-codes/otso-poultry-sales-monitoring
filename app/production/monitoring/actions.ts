"use server";

import { db } from "../../../src";
import { dailyRecords, users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function addDailyRecord(formData: FormData) {
  const session = await getServerSession(authOptions);

  // 1. Check Session
  if (!session || !session.user) {
    return { error: "You must be logged in to submit records." };
  }

  let userId = (session.user as any).id;

  // 2. The exact same NextAuth fix we used for Expenses!
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

  // 3. Extract form data
  const loadId = Number(formData.get("loadId"));
  const recordDate = formData.get("recordDate") as string;
  const mortality = Number(formData.get("mortality")) || 0;
  const feedsConsumed = (formData.get("feedsConsumed") as string) || "0";
  const eggCount = Number(formData.get("eggCount")) || 0;
  const remarks = formData.get("remarks") as string;

  if (!loadId || !recordDate) {
    return { error: "Please select an active load and a date." };
  }

  try {
    // 4. Save to Database
    await db.insert(dailyRecords).values({
      loadId,
      recordDate,
      mortality,
      feedsConsumed,
      eggCount,
      remarks: remarks || null,
      recordedBy: userId,
    });

    // Refresh both the monitoring table AND the new reports page!
    revalidatePath("/production/monitoring");
    revalidatePath("/reports");
    return { success: true };
  } catch (error) {
    console.error("Error saving daily record:", error);
    return { error: "Failed to save record. Please try again." };
  }
}
