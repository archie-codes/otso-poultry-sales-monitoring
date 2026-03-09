CREATE TYPE "public"."expense_type" AS ENUM('chick_purchase', 'feeds', 'medicine', 'labor', 'electricity', 'water', 'fuel', 'maintenance', 'miscellaneous');--> statement-breakpoint
CREATE TYPE "public"."farm_type" AS ENUM('broiler', 'layer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" integer NOT NULL,
	"record_date" date NOT NULL,
	"mortality" integer DEFAULT 0 NOT NULL,
	"feeds_consumed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"remarks" text,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"load_id" integer,
	"expense_type" "expense_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province" text NOT NULL,
	"city" text NOT NULL,
	"barangay" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvest_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"load_id" integer NOT NULL,
	"harvest_date" date NOT NULL,
	"quantity" integer NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"customer_name" varchar(255),
	"remarks" text,
	"recorded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loads" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer NOT NULL,
	"customer_name" text,
	"chick_type" text,
	"load_date" date NOT NULL,
	"harvest_date" date,
	"actual_quantity_load" integer NOT NULL,
	"actual_cost_per_chick" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"initial_capital" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;