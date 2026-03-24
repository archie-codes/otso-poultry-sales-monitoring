import { NextResponse } from "next/server";
import { db } from "@/src";
import { loads, buildings, farms } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmName = searchParams.get("farm");

  if (!farmName) return NextResponse.json([]);

  const activeLoads = await db
    .select({
      id: loads.id,
      name: loads.name,
      buildingName: buildings.name,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(farms.name, farmName));

  return NextResponse.json(activeLoads);
}
