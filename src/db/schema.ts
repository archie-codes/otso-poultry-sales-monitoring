// db/schema.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  numeric,
  integer,
  pgEnum,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["owner", "staff"]);
export const farmTypeEnum = pgEnum("farm_type", ["broiler", "layer"]);
export const expenseTypeEnum = pgEnum("expense_type", [
  "chick_purchase",
  "feeds",
  "medicine",
  "labor",
  "electricity",
  "water",
  "fuel",
  "maintenance",
  "miscellaneous",
]);

// --------------------------------------------------------
// 1. USERS TABLE (Already exists)
// --------------------------------------------------------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("staff").notNull(), // Updated default
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// --------------------------------------------------------
// 2. FARMS & BUILDINGS (RESTORED BUILDINGS TABLE)
// --------------------------------------------------------
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Farm 1"
  province: text("province").notNull(),
  city: text("city").notNull(),
  barangay: text("barangay").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RESTORED: We must have buildings so Farm 1 can have Building A, B, and C!
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .references(() => farms.id)
    .notNull(),
  name: text("name").notNull(), // e.g., "Building A"
});

// --------------------------------------------------------
// 3. LOADS (The Owner's Setup per Building)
// --------------------------------------------------------
export const loads = pgTable("loads", {
  id: serial("id").primaryKey(),

  // FIXED: Loads must go into a specific Building, not just a general Farm
  buildingId: integer("building_id")
    .references(() => buildings.id)
    .notNull(),

  customerName: text("customer_name"),
  chickType: text("chick_type"),
  loadDate: date("load_date").notNull(),
  harvestDate: date("harvest_date"),
  actualQuantityLoad: integer("actual_quantity_load").notNull(),
  actualCostPerChick: numeric("actual_cost_per_chick", {
    precision: 10,
    scale: 2,
  }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
  initialCapital: numeric("initial_capital", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),

  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --------------------------------------------------------
// 4. DAILY MONITORING (The Staff's Daily Inputs)
// --------------------------------------------------------
export const dailyRecords = pgTable("daily_records", {
  id: serial("id").primaryKey(),
  loadId: integer("load_id")
    .references(() => loads.id)
    .notNull(),

  recordDate: date("record_date").notNull(),
  mortality: integer("mortality").notNull().default(0),
  eggCount: integer("egg_count").notNull().default(0),
  feedsConsumed: numeric("feeds_consumed", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),

  remarks: text("remarks"),
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --------------------------------------------------------
// 5. EXPENSES (Direct & Shared)
// --------------------------------------------------------
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .references(() => farms.id)
    .notNull(),

  loadId: integer("load_id").references(() => loads.id),

  // Updated to use your new secure ENUM!
  expenseType: expenseTypeEnum("expense_type").notNull(),

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),

  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
