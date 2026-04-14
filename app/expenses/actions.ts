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
    if (dbUser.length > 0) userId = dbUser[0].id;
  }

  if (!userId) {
    return { error: "Could not verify your user account in the database." };
  }

  const farmId = Number(formData.get("farmId"));
  const loadIdValue = formData.get("loadId") as string;

  // THE FIX: If shared, strictly pass null so it doesn't attach to a specific building
  const loadId =
    !loadIdValue || loadIdValue === "shared" ? null : Number(loadIdValue);

  const expenseType = formData.get("expenseType") as any;

  // This is a manual expense log, so the amount is passed directly from the form
  const amount = formData.get("amount") as string;

  const expenseDate = formData.get("expenseDate") as string;

  // ---> THE FIX: Logic for Medical Items vs Standard Remarks <---
  const remarksRaw = formData.get("remarks") as string;
  const medName = formData.get("medName") as string;
  const medQty = formData.get("medQty") as string;

  let finalRemarks = remarksRaw ? remarksRaw.toUpperCase() : null;

  // If they filled out medical fields, combine them beautifully!
  if (medName && medQty) {
    finalRemarks = `${medName.toUpperCase()} • ${medQty.toUpperCase()}`;
  }

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
      remarks: finalRemarks, // Safe insertion to your existing column!
    });

    revalidatePath("/expenses");
    revalidatePath("/reports/history"); // Revalidate reports so the math engine updates
    return { success: true };
  } catch (error) {
    console.error("Error adding expense:", error);
    return { error: "Failed to save expense. Please try again." };
  }
}

export async function updateExpense(expenseId: number, formData: FormData) {
  try {
    const expenseDate = formData.get("expenseDate") as string;
    const amount = formData.get("amount") as string;
    const remarks = formData.get("remarks") as string;

    if (!expenseId || !amount || !expenseDate) {
      return { error: "Missing required fields." };
    }

    await db
      .update(expenses)
      .set({
        expenseDate,
        amount,
        remarks: remarks || null,
      })
      .where(eq(expenses.id, expenseId));

    return { success: true };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { error: "Failed to update expense." };
  }
}

export async function deleteExpense(expenseId: number) {
  try {
    if (!expenseId) return { error: "Expense ID is required." };

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { error: "Failed to delete expense." };
  }
}
