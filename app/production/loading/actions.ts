// "use server";

// import { db } from "../../../src";
// import { loads } from "../../../src/db/schema";
// import { revalidatePath } from "next/cache";
// import { eq } from "drizzle-orm"; // <-- ADDED THIS IMPORT for the update query

// // ==========================================
// // ADD NEW LOAD
// // ==========================================
// export async function addLoad(formData: FormData) {
//   const buildingId = Number(formData.get("buildingId"));

//   // Catch the chick type from the form
//   const chickType = formData.get("chickType") as string;

//   const loadDate = formData.get("loadDate") as string;
//   const harvestDate = formData.get("harvestDate") as string;
//   const customerName = formData.get("customerName") as string;

//   const actualQuantityLoad = Number(formData.get("actualQuantityLoad"));
//   const sellingPrice = formData.get("sellingPrice") as string;
//   const initialCapital = formData.get("initialCapital") as string;

//   if (!buildingId || !loadDate || !actualQuantityLoad) {
//     return {
//       error:
//         "Please fill in all required fields (Building, Load Date, and Quantity).",
//     };
//   }

//   try {
//     // UPDATED: Added .returning({ id: loads.id })
//     const newLoad = await db
//       .insert(loads)
//       .values({
//         buildingId,
//         chickType: chickType || "Unknown",
//         loadDate,
//         harvestDate: harvestDate || null,
//         customerName: customerName || null,
//         actualQuantityLoad,
//         actualCostPerChick: "0",
//         sellingPrice: "0",
//         initialCapital: initialCapital || "0",
//         isActive: true,
//       })
//       .returning({ id: loads.id }); // <--- GET THE NEW ID BACK

//     revalidatePath("/production/loading");
//     revalidatePath("/farms");

//     // RETURN THE ID TO THE CLIENT
//     return { success: true, id: newLoad[0].id };
//   } catch (error) {
//     console.error("Error adding load:", error);
//     return { error: "Failed to load chicks. Please try again." };
//   }
// }

// // ==========================================
// // UPDATE EXISTING LOAD (Correction Feature)
// // ==========================================
// export async function updateLoad(formData: FormData) {
//   const id = Number(formData.get("id"));

//   const loadDate = formData.get("loadDate") as string;
//   const harvestDate = formData.get("harvestDate") as string;
//   const quantity = Number(formData.get("quantity"));
//   const customerName = formData.get("customerName") as string;
//   const chickType = formData.get("chickType") as string;

//   // THE MISSING PIECE: Catch the initial capital from the form
//   const initialCapital = formData.get("initialCapital") as string;

//   if (!id) {
//     return { error: "Load ID is missing. Cannot update." };
//   }

//   try {
//     await db
//       .update(loads)
//       .set({
//         loadDate: loadDate,
//         harvestDate: harvestDate || null,
//         actualQuantityLoad: quantity,
//         customerName: customerName || null,
//         ...(chickType ? { chickType } : {}),
//         // FIX: Tell Drizzle to actually save it to the database!
//         initialCapital: initialCapital || "0",
//       })
//       .where(eq(loads.id, id));

//     revalidatePath("/production/loading");
//     revalidatePath("/farms");

//     return { success: true };
//   } catch (error: any) {
//     console.error("Error updating load:", error);
//     return { error: error.message || "Failed to update load details." };
//   }
// }

// export async function logHarvest(formData: FormData) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user) return { error: "Unauthorized" };

//   let userId = (session.user as any).id;
//   if (!userId && session.user.email) {
//     const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
//     if (dbUser.length > 0) userId = dbUser[0].id;
//   }

//   const loadId = Number(formData.get("loadId"));
//   const harvestDate = formData.get("harvestDate") as string;
//   const quantity = Number(formData.get("quantity"));
//   const sellingPrice = formData.get("sellingPrice") as string;
//   const customerName = formData.get("customerName") as string;
//   const remarks = formData.get("remarks") as string;

//   // The checkbox sends "on" if checked
//   const isFinalHarvest = formData.get("isFinalHarvest") === "on";

//   if (!loadId || !harvestDate || !quantity || !sellingPrice) {
//     return { error: "Please fill in all required fields." };
//   }

//   try {
//     // 1. Insert the specific harvest batch
//     await db.insert(harvestRecords).values({
//       loadId,
//       harvestDate,
//       quantity,
//       sellingPrice,
//       customerName: customerName || null,
//       remarks: remarks || null,
//       recordedBy: userId,
//     });

//     // 2. If this empties the building, close the load!
//     if (isFinalHarvest) {
//       await db.update(loads)
//         .set({
//           isActive: false,
//           harvestDate: harvestDate // Set the official close date
//         })
//         .where(eq(loads.id, loadId));
//     }

//     revalidatePath("/production/loading");
//     revalidatePath("/reports");

//     return { success: true };
//   } catch (error) {
//     console.error("Error logging harvest:", error);
//     return { error: "Failed to log harvest. Please try again." };
//   }
// }

"use server";

import { db } from "../../../src";
// Added harvestRecords and users here:
import {
  loads,
  harvestRecords,
  users,
  dailyRecords,
} from "../../../src/db/schema";
import { revalidatePath } from "next/cache";
import { eq, sum } from "drizzle-orm";
// Added authentication imports here:
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

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

// ==========================================
// GET EXACT LIVE BIRD COUNT (For the Modal)
// ==========================================
export async function getLiveBirdCount(loadId: number) {
  try {
    const loadData = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);
    if (loadData.length === 0) return 0;
    const originalQuantity = loadData[0].actualQuantityLoad;

    const mortalityData = await db
      .select({ total: sum(dailyRecords.mortality) })
      .from(dailyRecords)
      .where(eq(dailyRecords.loadId, loadId));
    const totalMortality = Number(mortalityData[0]?.total) || 0;

    const previousHarvests = await db
      .select({ total: sum(harvestRecords.quantity) })
      .from(harvestRecords)
      .where(eq(harvestRecords.loadId, loadId));
    const totalPreviouslyHarvested = Number(previousHarvests[0]?.total) || 0;

    return originalQuantity - totalMortality - totalPreviouslyHarvested;
  } catch (error) {
    console.error("Error fetching live bird count:", error);
    return 0;
  }
}

// ==========================================
// LOG PARTIAL OR FINAL HARVEST (WITH INVENTORY CHECK)
// ==========================================
export async function logHarvest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  let userId = (session.user as any).id;
  if (!userId && session.user.email) {
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);
    if (dbUser.length > 0) userId = dbUser[0].id;
  }

  const loadId = Number(formData.get("loadId"));
  const harvestDate = formData.get("harvestDate") as string;
  const quantity = Number(formData.get("quantity"));
  const sellingPrice = formData.get("sellingPrice") as string;
  const customerName = formData.get("customerName") as string;
  const remarks = formData.get("remarks") as string;

  const isFinalHarvest = formData.get("isFinalHarvest") === "on";

  if (!loadId || !harvestDate || !quantity || !sellingPrice) {
    return { error: "Please fill in all required fields." };
  }

  try {
    // 1. Calculate exactly how many live birds are left
    const loadData = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);
    if (loadData.length === 0) return { error: "Load not found." };
    const originalQuantity = loadData[0].actualQuantityLoad;

    const mortalityData = await db
      .select({ total: sum(dailyRecords.mortality) })
      .from(dailyRecords)
      .where(eq(dailyRecords.loadId, loadId));
    const totalMortality = Number(mortalityData[0]?.total) || 0;

    const previousHarvests = await db
      .select({ total: sum(harvestRecords.quantity) })
      .from(harvestRecords)
      .where(eq(harvestRecords.loadId, loadId));
    const totalPreviouslyHarvested = Number(previousHarvests[0]?.total) || 0;

    const remainingLiveBirds =
      originalQuantity - totalMortality - totalPreviouslyHarvested;

    // 2. BLOCK THE TYPO!
    if (quantity > remainingLiveBirds) {
      return {
        error: `Invalid quantity! You only have ${remainingLiveBirds.toLocaleString()} live birds left.`,
      };
    }

    // 3. Save the harvest batch
    await db.insert(harvestRecords).values({
      loadId,
      harvestDate,
      quantity,
      sellingPrice,
      customerName: customerName || null,
      remarks: remarks || null,
      recordedBy: userId,
    });

    const isClosed = isFinalHarvest || quantity === remainingLiveBirds;

    // 4. If this empties the building, close the load!
    if (isClosed) {
      await db
        .update(loads)
        .set({
          isActive: false,
          harvestDate: harvestDate,
        })
        .where(eq(loads.id, loadId));
    }

    revalidatePath("/production/loading");
    revalidatePath("/reports");

    // 5. RETURN THE EXACT MATH FOR THE SUCCESS SCREEN
    return {
      success: true,
      harvested: quantity,
      previousAvailable: remainingLiveBirds,
      remainingNow: remainingLiveBirds - quantity,
      isClosed: isClosed,
    };
  } catch (error) {
    console.error("Error logging harvest:", error);
    return { error: "Failed to log harvest. Please try again." };
  }
}
