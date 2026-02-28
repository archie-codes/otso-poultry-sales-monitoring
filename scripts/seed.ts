// scripts/seed.ts
import "dotenv/config";
import { db } from "../src/index";
import { users } from "../src/db/schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("⏳ Seeding database...");

  try {
    // 1. Hash the passwords (using a standard salt round of 10)
    const ownerPassword = await bcrypt.hash("admin123", 10);
    const staffPassword = await bcrypt.hash("staff123", 10);

    // 2. Insert the Owner account
    await db.insert(users).values({
      name: "Archie Bauzon",
      email: "owner@otsopoultry.com",
      password: ownerPassword,
      role: "owner",
    });

    // 3. Insert the Staff account
    await db.insert(users).values({
      name: "Farm Staff",
      email: "staff@otsopoultry.com",
      password: staffPassword,
      role: "staff",
    });

    console.log("✅ Database seeded successfully!");
    console.log("Owner Login: owner@otsopoultry.com / admin123");
    console.log("Staff Login: staff@otsopoultry.com / staff123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
