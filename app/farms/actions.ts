"use server";

import { db } from "../../src";
import { farms, buildings } from "../../src/db/schema";
import { revalidatePath } from "next/cache";

// 1. Action to create a new Farm with Location Data
export async function addFarm(formData: FormData) {
  const name = formData.get("name") as string;
  const province = formData.get("province") as string;
  const city = formData.get("city") as string;
  const barangay = formData.get("barangay") as string;

  if (!name || !province || !city || !barangay) {
    return { error: "All location fields and farm name are required." };
  }

  try {
    await db.insert(farms).values({ name, province, city, barangay });
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Error adding farm:", error);
    return { error: "Failed to add farm. Please try again." };
  }
}

// 2. Action to add a Building to a specific Farm
export async function addBuilding(formData: FormData) {
  const name = formData.get("name") as string;
  const farmId = Number(formData.get("farmId"));

  if (!name || !farmId) {
    return { error: "Building name and Farm ID are required." };
  }

  try {
    await db.insert(buildings).values({ name, farmId });
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Error adding building:", error);
    return { error: "Failed to add building. Please try again." };
  }
}
