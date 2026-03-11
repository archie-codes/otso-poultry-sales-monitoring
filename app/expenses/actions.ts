"use server";

import { db } from "../../src";
import { expenses, users } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function addExpense(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { error: "You must be logged in to record expenses." };
  }

  let userId = (session.user as any).id;

  if (!userId && session.user.email) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (dbUser.length > 0) {
      userId = dbUser[0].id;
    }
  }

  if (!userId && session.user.name) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.name, session.user.name))
      .limit(1);
    if (dbUser.length > 0) {
      userId = dbUser[0].id;
    }
  }

  if (!userId) {
    return { error: "Could not verify your user account in the database." };
  }

  const farmId = Number(formData.get("farmId"));
  const loadIdValue = formData.get("loadId") as string;
  const loadId =
    !loadIdValue || loadIdValue === "shared" ? null : Number(loadIdValue);

  // Cast this as any to satisfy the strict schema type check during insertion
  const expenseType = formData.get("expenseType") as any;
  const amount = formData.get("amount") as string;
  const expenseDate = formData.get("expenseDate") as string;

  if (!farmId || !expenseType || !amount || !expenseDate) {
    return { error: "Please fill in all required fields." };
  }

  try {
    await db.insert(expenses).values({
      farmId,
      loadId,
      expenseType,
      amount,
      expenseDate,
      recordedBy: userId,
      // REMOVED 'remarks' here because it is not in your schema!
    });

    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { error: "Failed to save expense. Please try again." };
  }
}
