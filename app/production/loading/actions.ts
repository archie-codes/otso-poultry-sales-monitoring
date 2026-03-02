"use server";

import { db } from "../../../src";
import { loads } from "../../../src/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm"; // <-- ADDED THIS IMPORT for the update query

// ==========================================
// ADD NEW LOAD
// ==========================================
export async function addLoad(formData: FormData) {
  const buildingId = Number(formData.get("buildingId"));

  // Catch the chick type from the form
  const chickType = formData.get("chickType") as string;

  const loadDate = formData.get("loadDate") as string;
  const harvestDate = formData.get("harvestDate") as string;
  const customerName = formData.get("customerName") as string;

  const actualQuantityLoad = Number(formData.get("actualQuantityLoad"));
  const sellingPrice = formData.get("sellingPrice") as string;
  const initialCapital = formData.get("initialCapital") as string;

  if (!buildingId || !loadDate || !actualQuantityLoad) {
    return {
      error:
        "Please fill in all required fields (Building, Load Date, and Quantity).",
    };
  }

  try {
    // UPDATED: Added .returning({ id: loads.id })
    const newLoad = await db
      .insert(loads)
      .values({
        buildingId,
        chickType: chickType || "Unknown",
        loadDate,
        harvestDate: harvestDate || null,
        customerName: customerName || null,
        actualQuantityLoad,
        actualCostPerChick: "0",
        sellingPrice: "0",
        initialCapital: initialCapital || "0",
        isActive: true,
      })
      .returning({ id: loads.id }); // <--- GET THE NEW ID BACK

    revalidatePath("/production/loading");
    revalidatePath("/farms");

    // RETURN THE ID TO THE CLIENT
    return { success: true, id: newLoad[0].id };
  } catch (error) {
    console.error("Error adding load:", error);
    return { error: "Failed to load chicks. Please try again." };
  }
}

// ==========================================
// UPDATE EXISTING LOAD (Correction Feature)
// ==========================================
export async function updateLoad(formData: FormData) {
  const id = Number(formData.get("id"));

  const loadDate = formData.get("loadDate") as string;
  const harvestDate = formData.get("harvestDate") as string;
  const quantity = Number(formData.get("quantity"));
  const customerName = formData.get("customerName") as string;
  const chickType = formData.get("chickType") as string;

  // THE MISSING PIECE: Catch the initial capital from the form
  const initialCapital = formData.get("initialCapital") as string;

  if (!id) {
    return { error: "Load ID is missing. Cannot update." };
  }

  try {
    await db
      .update(loads)
      .set({
        loadDate: loadDate,
        harvestDate: harvestDate || null,
        actualQuantityLoad: quantity,
        customerName: customerName || null,
        ...(chickType ? { chickType } : {}),
        // FIX: Tell Drizzle to actually save it to the database!
        initialCapital: initialCapital || "0",
      })
      .where(eq(loads.id, id));

    revalidatePath("/production/loading");
    revalidatePath("/farms");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating load:", error);
    return { error: error.message || "Failed to update load details." };
  }
}
