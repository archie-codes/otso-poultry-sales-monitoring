"use server";

import { db } from "../../src";
import { expenses, users } from "../../src/db/schema"; // <-- Added users table here
import { eq } from "drizzle-orm"; // <-- Added eq for searching
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function addExpense(formData: FormData) {
  const session = await getServerSession(authOptions);

  // 1. Check if they have a session at all
  if (!session || !session.user) {
    return { error: "You must be logged in to record expenses." };
  }

  let userId = (session.user as any).id;

  // 2. THE FIX: If NextAuth forgot the ID, let's find the user by their email!
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

  // 3. Fallback: If no email, let's find them by their name (e.g., "staff")
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

  // If we still can't find an ID after all that, block it.
  if (!userId) {
    return { error: "Could not verify your user account in the database." };
  }

  // Extract the form data
  const farmId = Number(formData.get("farmId"));
  const loadIdValue = formData.get("loadId") as string;
  const loadId = loadIdValue === "shared" ? null : Number(loadIdValue);

  const expenseType = formData.get("expenseType") as any;
  const amount = formData.get("amount") as string;
  const expenseDate = formData.get("expenseDate") as string;

  if (!farmId || !expenseType || !amount || !expenseDate) {
    return { error: "Please fill in all required fields." };
  }

  try {
    // Save to database with the dynamically found userId!
    await db.insert(expenses).values({
      farmId,
      loadId,
      expenseType,
      amount,
      expenseDate,
      recordedBy: userId,
    });

    revalidatePath("/expenses");
    return { success: true };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { error: "Failed to save expense. Please try again." };
  }
}
