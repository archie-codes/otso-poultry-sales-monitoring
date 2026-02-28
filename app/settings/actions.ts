"use server";

import { db } from "../../src";
import { users } from "../../src/db/schema";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "owner" | "staff";

  // 1. Catch the optional image URL
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!name || !email || !password || !role) {
    return { error: "All required fields must be filled." };
  }

  if (!name || !email || !password || !role) {
    return { error: "All required fields must be filled." };
  }

  // ADD THIS QUICK CHECK:
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insert into the database, including the imageUrl
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        imageUrl: imageUrl || null,
      })
      .returning({ id: users.id });

    revalidatePath("/settings");

    return { success: true, newUserId: newUser.id };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user. This email might already exist." };
  }
}

// delete user
export async function deleteUser(userId: number) {
  try {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user account." };
  }
}

// update user
export async function updateUser(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "owner" | "staff";

  // imageUrl can be empty if they removed it
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!id || !name || !email || !role) {
    return { error: "Missing required fields." };
  }

  try {
    // Prepare the data to update
    const updateData: any = {
      name,
      email,
      role,
      imageUrl: imageUrl || null,
    };

    // Only update the password if the Owner actually typed a new one
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return { error: "New password must be at least 8 characters long." };
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      error: "Failed to update user account. The email might be in use.",
    };
  }
}
