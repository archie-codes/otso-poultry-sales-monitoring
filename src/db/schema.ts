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
  varchar,
  decimal,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["owner", "staff"]);
export const farmTypeEnum = pgEnum("farm_type", ["broiler", "layer"]);
export const expenseTypeEnum = pgEnum("expense_type", [
  "chick_purchase",
  "feeds",
  "medicine",
  "vaccine",
  "antibiotics",
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

// // --------------------------------------------------------
// // 3. LOADS (The Owner's Setup per Building)
// // --------------------------------------------------------
// export const loads = pgTable("loads", {
//   id: serial("id").primaryKey(),

//   // FIXED: Loads must go into a specific Building, not just a general Farm
//   buildingId: integer("building_id")
//     .references(() => buildings.id)
//     .notNull(),

//   name: text("name"),

//   customerName: text("customer_name"),
//   chickType: text("chick_type"),
//   loadDate: date("load_date").notNull(),
//   harvestDate: date("harvest_date"),
//   actualQuantityLoad: integer("actual_quantity_load").notNull(),
//   actualCostPerChick: numeric("actual_cost_per_chick", {
//     precision: 10,
//     scale: 2,
//   }).notNull(),
//   sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
//   initialCapital: numeric("initial_capital", { precision: 12, scale: 2 })
//     .notNull()
//     .default("0"),

//   isActive: boolean("is_active").default(true).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// --------------------------------------------------------
// 3. LOADS (The Owner's Setup per Building)
// --------------------------------------------------------
export const loads = pgTable("loads", {
  id: serial("id").primaryKey(),

  // FIXED: Loads must go into a specific Building, not just a general Farm
  buildingId: integer("building_id")
    .references(() => buildings.id)
    .notNull(),

  name: text("name"),

  customerName: text("customer_name"),
  chickType: text("chick_type"),
  loadDate: date("load_date").notNull(),
  harvestDate: date("harvest_date"),

  // ==========================================
  // ---> NEW: SEPARATE PAID VS ALLOWANCE <---
  // ==========================================
  paidQuantity: integer("paid_quantity").notNull().default(0),
  allowanceQuantity: integer("allowance_quantity").notNull().default(0),

  // This remains the TOTAL (Paid + Allowance) for mortality & harvest tracking
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

  // ---> NEW: AM & PM MORTALITY <---
  mortalityAm: integer("mortality_am").notNull().default(0),
  mortalityPm: integer("mortality_pm").notNull().default(0),
  mortality: integer("mortality").notNull().default(0), // This becomes the TOTAL

  // ---> NEW: AM & PM FEEDS & FEED TYPE <---
  feedType: varchar("feed_type", { length: 50 }), // e.g., "BOOSTER", "STARTER"
  feedsConsumedAm: numeric("feeds_consumed_am", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  feedsConsumedPm: numeric("feeds_consumed_pm", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  feedsConsumed: numeric("feeds_consumed", { precision: 10, scale: 2 })
    .notNull()
    .default("0"), // This becomes the TOTAL

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
  remarks: text("remarks"),
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// NEW: HARVEST RECORDS (For Partial/Batch Harvesting)
// ==========================================
export const harvestRecords = pgTable("harvest_records", {
  id: serial("id").primaryKey(),

  // Links this specific harvest batch back to the original load/flock
  loadId: integer("load_id")
    .references(() => loads.id, { onDelete: "cascade" })
    .notNull(),

  // The exact date you pulled these specific birds out
  harvestDate: date("harvest_date").notNull(),

  // How many birds were sold in this specific transaction
  quantity: integer("quantity").notNull(),

  // The exact price you sold them for ON THIS DAY (since prices change)
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),

  // Who bought this specific batch
  customerName: varchar("customer_name", { length: 255 }),

  // Any extra notes (e.g., "Truck delayed", "Slightly underweight")
  remarks: text("remarks"),

  // Audit trail: who logged this harvest in the system
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// For notifications
// ==========================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // The staff who logged in
  recipientId: integer("recipient_id"), // Ma'am Lani's Admin ID
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("login"), // login, expense, harvest, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// 1. TIER 1: MAIN WAREHOUSE (Supplier Deliveries)
// ==========================================
export const feedDeliveries = pgTable("feed_deliveries", {
  id: serial("id").primaryKey(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  deliveryDate: date("delivery_date").notNull(),
  feedType: varchar("feed_type", { length: 100 }).notNull(),

  // ---> UPGRADED TO NUMERIC TO SUPPORT FRACTIONS <---
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  cashBond: numeric("cash_bond", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),

  // ---> UPGRADED TO NUMERIC <---
  remainingQuantity: numeric("remaining_quantity", {
    precision: 10,
    scale: 2,
  }).notNull(),

  recordedBy: integer("recorded_by").references(() => users.id), // (assuming users table exists)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 2. TIER 2: BUILDING SUB-INVENTORY (Transfers)
// ==========================================
export const feedAllocations = pgTable("feed_allocations", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id")
    .references(() => feedDeliveries.id)
    .notNull(),
  loadId: integer("load_id")
    .references(() => loads.id, { onDelete: "cascade" })
    .notNull(),

  allocatedDate: date("allocated_date").notNull(),
  feedType: varchar("feed_type", { length: 100 }).notNull(),

  // ---> UPGRADED TO NUMERIC <---
  allocatedQuantity: numeric("allocated_quantity", {
    precision: 10,
    scale: 2,
  }).notNull(),

  // ---> UPGRADED TO NUMERIC <---
  remainingInBuilding: numeric("remaining_in_building", {
    precision: 10,
    scale: 2,
  }).notNull(),

  recordedBy: integer("recorded_by").references(() => users.id),

  // =======================================================
  // ---> NEW: COLUMNS FOR BUILDING-TO-BUILDING HISTORY <---
  // =======================================================
  isInternalTransfer: boolean("is_internal_transfer").default(false).notNull(),
  sourceBuilding: varchar("source_building", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
