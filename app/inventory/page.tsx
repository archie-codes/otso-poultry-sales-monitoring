import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import {
  feedTransactions,
  loads,
  buildings,
  farms,
  users,
} from "../../src/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { Package, MapPin, Warehouse, Wallet, History } from "lucide-react";
import InventoryTableClient from "./InventoryTableClient";
import AddFeedDeliveryModal from "./AddFeedDeliveryModal";
import TransferFeedsModal from "./TransferFeedsModal";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function InventoryPage(props: {
  searchParams: Promise<{
    farm?: string;
    building?: string;
    type?: string;
    date?: string;
    page?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const searchParams = await props.searchParams;
  const selectedFarm = searchParams?.farm;
  const selectedBuilding = searchParams?.building;
  const selectedType = searchParams?.type;
  const selectedDate = searchParams?.date;

  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // ==========================================
  // 1. FETCH TRANSACTIONS & LIVE STOCK
  // ==========================================
  const allTransactions = await db
    .select({
      loadId: feedTransactions.loadId,
      farmName: farms.name,
      buildingName: buildings.name,
      isActive: loads.isActive,
      feedType: feedTransactions.feedType,
      quantity: feedTransactions.quantity,
      costPerBag: feedTransactions.costPerBag,
    })
    .from(feedTransactions)
    .innerJoin(loads, eq(feedTransactions.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const liveStock: Record<string, any> = {};
  let totalFarmBags = 0;
  let totalFarmValue = 0;

  allTransactions.forEach((t) => {
    const qty = Number(t.quantity);
    const cost = Number(t.costPerBag || 0);
    const value = qty * cost;

    if (!liveStock[t.farmName]) liveStock[t.farmName] = {};
    if (!liveStock[t.farmName][t.buildingName]) {
      liveStock[t.farmName][t.buildingName] = {
        isActive: t.isActive,
        feeds: {},
        totalBags: 0,
        totalValue: 0,
      };
    }

    const bldg = liveStock[t.farmName][t.buildingName];
    if (!bldg.feeds[t.feedType]) bldg.feeds[t.feedType] = { qty: 0, value: 0 };

    bldg.feeds[t.feedType].qty += qty;
    bldg.feeds[t.feedType].value += value;
    bldg.totalBags += qty;
    bldg.totalValue += value;

    totalFarmBags += qty;
    totalFarmValue += value;
  });

  // ==========================================
  // 2. FETCH DATA FOR THE MODALS (DELIVERY & TRANSFER)
  // ==========================================
  const allLoadsRaw = await db
    .select({
      id: loads.id,
      farmName: farms.name,
      buildingName: buildings.name,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const activeLoads = allLoadsRaw
    .filter((l) => l.isActive)
    .map((load) => {
      const feedStock = allTransactions
        .filter((t) => t.loadId === load.id)
        .reduce(
          (acc, t) => {
            if (t.feedType) {
              acc[t.feedType] = (acc[t.feedType] || 0) + Number(t.quantity);
            }
            return acc;
          },
          {} as Record<string, number>,
        );
      return { ...load, feedStock };
    });

  const loadsWithStock = allLoadsRaw
    .map((load) => {
      const feedStock = allTransactions
        .filter((t) => t.loadId === load.id)
        .reduce(
          (acc, t) => {
            if (t.feedType)
              acc[t.feedType] = (acc[t.feedType] || 0) + Number(t.quantity);
            return acc;
          },
          {} as Record<string, number>,
        );
      return { ...load, feedStock };
    })
    .filter((load) => Object.values(load.feedStock).some((qty) => qty > 0));

  // ==========================================
  // 3. AUDIT TRAIL / TRANSACTION HISTORY
  // ==========================================
  const filters = [];
  if (selectedFarm && selectedFarm !== "all")
    filters.push(eq(farms.name, selectedFarm));
  if (selectedBuilding && selectedBuilding !== "all")
    filters.push(eq(buildings.name, selectedBuilding));
  if (selectedType && selectedType !== "all")
    filters.push(eq(feedTransactions.transactionType, selectedType));
  if (selectedDate && selectedDate !== "all")
    filters.push(eq(feedTransactions.transactionDate, selectedDate));

  const finalCondition = filters.length > 0 ? and(...filters) : undefined;

  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedTransactions)
    .innerJoin(loads, eq(feedTransactions.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(finalCondition);

  const totalPages = Math.ceil(Number(countQuery[0].count) / ITEMS_PER_PAGE);

  const history = await db
    .select({
      id: feedTransactions.id,
      date: feedTransactions.transactionDate,
      type: feedTransactions.transactionType,
      feedType: feedTransactions.feedType,
      quantity: feedTransactions.quantity,
      costPerBag: feedTransactions.costPerBag,
      remarks: feedTransactions.remarks,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
    })
    .from(feedTransactions)
    .innerJoin(loads, eq(feedTransactions.loadId, loads.id))
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .leftJoin(users, eq(feedTransactions.recordedBy, users.id))
    .where(finalCondition)
    .orderBy(
      desc(feedTransactions.transactionDate),
      desc(feedTransactions.createdAt),
    )
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const infrastructure = await db
    .select({ farmName: farms.name, buildingName: buildings.name })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const uniqueFarms = Array.from(
    new Set(infrastructure.map((i) => i.farmName)),
  );
  const availableBuildings =
    selectedFarm && selectedFarm !== "all"
      ? Array.from(
          new Set(
            infrastructure
              .filter((i) => i.farmName === selectedFarm)
              .map((i) => i.buildingName),
          ),
        )
      : [];

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const formatMacro = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4 py-8 pb-16">
      {/* PREMIUM HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border/50 p-6 sm:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        {/* ... keeping the header the same ... */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-500" />
            Feed Ledger
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm max-w-xl">
            Master overview of physical stock and transaction audit trails.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <TransferFeedsModal
            loadsWithStock={loadsWithStock}
            activeLoads={activeLoads}
          />
          <AddFeedDeliveryModal activeLoads={activeLoads} />
        </div>
      </div>

      {/* GLOBAL KPIs (Updated for huge numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-4 bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-2xl shrink-0">
            <Package className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              Total Physical Stock
            </p>
            <p className="text-2xl lg:text-3xl font-black text-foreground mt-0.5 truncate">
              {totalFarmBags.toLocaleString()}{" "}
              <span className="text-sm font-bold text-muted-foreground">
                Sacks
              </span>
            </p>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="p-4 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-2xl shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              Est. Inventory Value
            </p>
            <p
              className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-0.5 truncate"
              title={formatMoney(totalFarmValue)}
            >
              {formatMacro(totalFarmValue)}
            </p>
          </div>
        </div>
      </div>

      {/* LIVE WAREHOUSE STOCK MATRIX */}
      <div className="space-y-6 pt-4">
        <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-foreground border-b pb-2">
          <Warehouse className="w-5 h-5 text-amber-500" /> Current Stock By
          Location
        </h2>

        {Object.keys(liveStock).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card border border-dashed rounded-[2rem]">
            No active feed stock available. Log a delivery to begin.
          </div>
        ) : (
          <Tabs
            defaultValue={Object.keys(liveStock).sort()[0]}
            className="w-full"
          >
            <div className="overflow-x-auto pb-2">
              <TabsList className="h-14 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-1 inline-flex min-w-max">
                {Object.keys(liveStock)
                  .sort()
                  .map((farm) => (
                    <TabsTrigger
                      key={farm}
                      value={farm}
                      className="rounded-xl font-black uppercase tracking-widest text-lg px-6 h-full data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5 mr-2 opacity-70" /> {farm}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </div>

            {Object.entries(liveStock)
              .sort(([farmA], [farmB]) => farmA.localeCompare(farmB))
              .map(([farm, buildings]) => (
                <TabsContent
                  key={farm}
                  value={farm}
                  className="mt-6 outline-none focus:ring-0"
                >
                  <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                        <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-border/50">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-[20%]">
                              Location
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-[60%]">
                              Feed Breakdown
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600 text-right w-[20%]">
                              Total Stock
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {Object.entries(buildings as Record<string, any>)
                            .sort(([bldgA], [bldgB]) =>
                              bldgA.localeCompare(bldgB, undefined, {
                                numeric: true,
                                sensitivity: "base",
                              }),
                            )
                            .map(([building, data]) => {
                              if (data.totalBags <= 0) return null;
                              return (
                                <tr
                                  key={`${farm}-${building}`}
                                  className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors group"
                                >
                                  {/* 1. BUILDING NAME */}
                                  <td className="px-6 py-5 align-top">
                                    <span className="font-black text-sm uppercase block text-foreground">
                                      {building}
                                    </span>
                                    {!data.isActive && (
                                      <span className="inline-block mt-1 text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                        Harvested
                                      </span>
                                    )}
                                  </td>

                                  {/* 2. FEED BREAKDOWN (Compact Mini-Cards) */}
                                  <td className="px-6 py-4 align-top">
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(
                                        data.feeds as Record<string, any>,
                                      ).map(([type, stats]) => {
                                        if (stats.qty <= 0) return null;
                                        const avgCostPerSack =
                                          stats.value / stats.qty;
                                        return (
                                          <div
                                            key={type}
                                            className="flex items-center justify-between gap-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-sm min-w-[140px] flex-1 sm:flex-none"
                                          >
                                            <div>
                                              <span className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                {type}
                                              </span>
                                              <span className="block text-[9px] font-bold text-emerald-600/80">
                                                @ {formatMoney(avgCostPerSack)}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <span className="block font-black text-sm text-foreground">
                                                {stats.qty}
                                              </span>
                                              <span className="block text-[8px] font-bold text-muted-foreground uppercase">
                                                Sacks
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>

                                  {/* 3. TOTAL BAGS */}
                                  <td className="px-6 py-5 align-middle text-right">
                                    <span className="font-black text-2xl text-amber-600 group-hover:scale-110 transition-transform inline-block origin-right">
                                      {data.totalBags}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              ))}
          </Tabs>
        )}
      </div>

      {/* AUDIT TRAIL TABLE */}
      <div className="space-y-4 pt-8">
        <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-foreground border-b pb-2">
          <History className="w-5 h-5 text-blue-500" /> Transaction Ledger
        </h2>
        <InventoryTableClient
          history={history}
          farms={uniqueFarms}
          buildings={availableBuildings}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
