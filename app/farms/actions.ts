"use server";

import { db } from "../../src";
import { farms, buildings, loads } from "../../src/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm"; // Added 'and' for complex queries

// 1. Action to create a new Farm (Kept your auto-uppercase logic)
export async function addFarm(formData: FormData) {
  const rawName = formData.get("name") as string;
  const name = rawName?.trim().toUpperCase();
  const province = (formData.get("province") as string)?.toUpperCase();
  const city = (formData.get("city") as string)?.toUpperCase();
  const barangay = (formData.get("barangay") as string)?.toUpperCase();

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

// 2. Action to add a Building with DUPLICATE RESTRICTION
export async function addBuilding(formData: FormData) {
  const rawName = formData.get("name") as string;
  const name = rawName?.trim().toUpperCase();
  const farmId = Number(formData.get("farmId"));

  if (!name || !farmId) {
    return { error: "Building name and Farm ID are required." };
  }

  try {
    // NEW RESTRICTION: Check if this building name already exists in THIS farm
    const existingBuilding = await db
      .select()
      .from(buildings)
      .where(and(eq(buildings.name, name), eq(buildings.farmId, farmId)))
      .limit(1);

    if (existingBuilding.length > 0) {
      return {
        error: `A building named "${name}" already exists in this farm. Please use a different name.`,
      };
    }

    // If no duplicate found, proceed with insert
    await db.insert(buildings).values({ name, farmId });
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Error adding building:", error);
    return { error: "Failed to add building. Please try again." };
  }
}

// 3. SAFE DELETE: Action to delete a Farm
export async function deleteFarm(farmId: number) {
  try {
    const existingBuildings = await db
      .select()
      .from(buildings)
      .where(eq(buildings.farmId, farmId))
      .limit(1);

    if (existingBuildings.length > 0) {
      return {
        error:
          "Cannot delete this farm because it still contains buildings. Please delete all buildings inside it first.",
      };
    }

    await db.delete(farms).where(eq(farms.id, farmId));
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Delete farm error:", error);
    return { error: "Failed to delete farm due to a database error." };
  }
}

// 4. SAFE DELETE: Action to delete a Building
export async function deleteBuilding(buildingId: number) {
  try {
    const existingLoads = await db
      .select()
      .from(loads)
      .where(eq(loads.buildingId, buildingId))
      .limit(1);

    if (existingLoads.length > 0) {
      return {
        error:
          "Cannot delete this building because it has active or past flock records. You must delete the flock records first.",
      };
    }

    await db.delete(buildings).where(eq(buildings.id, buildingId));
    revalidatePath("/farms");
    return { success: true };
  } catch (error) {
    console.error("Delete building error:", error);
    return { error: "Failed to delete building due to a database error." };
  }
}
