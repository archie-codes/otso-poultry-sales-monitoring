"use server";

import { db } from "../../../src";
import { loads } from "../../../src/db/schema";
import { revalidatePath } from "next/cache";

export async function addLoad(formData: FormData) {
  const buildingId = Number(formData.get("buildingId"));

  // NEW: Catch the chick type from the form
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
    await db.insert(loads).values({
      buildingId,

      // NEW: Save it to the database
      chickType: chickType || "Unknown",

      loadDate,
      harvestDate: harvestDate || null,
      customerName: customerName || null,
      actualQuantityLoad,
      actualCostPerChick: "0",
      sellingPrice: sellingPrice || "0",
      initialCapital: initialCapital || "0",
      isActive: true,
    });

    revalidatePath("/production/loading");
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Error adding load:", error);
    return { error: "Failed to load chicks. Please try again." };
  }
}
