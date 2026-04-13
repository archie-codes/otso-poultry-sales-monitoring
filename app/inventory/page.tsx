import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src";
import {
  feedDeliveries,
  feedAllocations,
  loads,
  buildings,
  farms,
  users,
} from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";

import InventoryTableClient from "./InventoryTableClient";
import AddFeedDeliveryModal from "./AddFeedDeliveryModal";
import TransferFeedsModal from "./TransferFeedsModal";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const deliveries = await db
    .select({
      id: feedDeliveries.id,
      supplierName: feedDeliveries.supplierName,
      deliveryDate: feedDeliveries.deliveryDate,
      feedType: feedDeliveries.feedType,
      quantity: feedDeliveries.quantity,
      remainingQuantity: feedDeliveries.remainingQuantity,
      unitPrice: feedDeliveries.unitPrice,
      cashBond: feedDeliveries.cashBond,
    })
    .from(feedDeliveries)
    .orderBy(desc(feedDeliveries.deliveryDate), desc(feedDeliveries.id));

  const transfers = await db
    .select({
      id: feedAllocations.id,
      allocatedDate: feedAllocations.allocatedDate,
      feedType: feedAllocations.feedType,
      allocatedQuantity: feedAllocations.allocatedQuantity,
      farmName: farms.name,
      buildingName: buildings.name,
      batchName: loads.name,
      loadId: loads.id,
      staffName: users.name,
      isInternalTransfer: feedAllocations.isInternalTransfer,
      sourceBuilding: feedAllocations.sourceBuilding,
      // ---> NEW: Fetch the original Unit Price from the Delivery table! <---
      unitPrice: feedDeliveries.unitPrice,
    })
    .from(feedAllocations)
    .innerJoin(loads, eq(feedAllocations.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .leftJoin(users, eq(feedAllocations.recordedBy, users.id))
    // ---> NEW: Join the delivery table to access the price <---
    .leftJoin(feedDeliveries, eq(feedAllocations.deliveryId, feedDeliveries.id))
    .orderBy(desc(feedAllocations.allocatedDate), desc(feedAllocations.id));

  const historicalSuppliers = Array.from(
    new Set(deliveries.map((d) => d.supplierName)),
  );
  const historicalFeeds = Array.from(
    new Set(deliveries.map((d) => d.feedType)),
  );

  const availableDeliveries = deliveries.filter(
    (d) => Number(d.remainingQuantity) > 0,
  );

  const activeLoads = await db
    .select({
      id: loads.id,
      name: loads.name,
      buildingName: buildings.name,
      farmName: farms.name,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, true));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/50 p-8 rounded-lg shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Main Warehouse
          </h1>
          <p className="text-muted-foreground font-sm mt-1">
            Manage incoming supplier deliveries and outbound building transfers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10">
          <TransferFeedsModal
            availableDeliveries={availableDeliveries}
            activeLoads={activeLoads}
          />
          <AddFeedDeliveryModal
            historicalSuppliers={historicalSuppliers}
            historicalFeeds={historicalFeeds}
          />
        </div>
      </div>

      <InventoryTableClient deliveries={deliveries} transfers={transfers} />
    </div>
  );
}
