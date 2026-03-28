import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import {
  expenses,
  farms,
  loads,
  buildings,
  users,
  harvestRecords,
} from "../../src/db/schema";
import { desc, eq, and, or, isNull, sql } from "drizzle-orm";
import { TrendingDown, Wallet, PieChart, Building2 } from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import ExpensesTableClient from "./ExpensesTableClient";

// ---> STRICT TIMEZONE HELPERS <---
const getMidnight = (dateInput: string | Date | null) => {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getEndOfDay = (dateInput: string | Date | null) => {
  if (!dateInput) return 0;
  const d = new Date(dateInput);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

export default async function ExpensesPage(props: {
  searchParams: Promise<{
    farm?: string;
    building?: string;
    load?: string;
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
  const selectedLoad = searchParams?.load;
  const selectedType = searchParams?.type;
  const selectedDate = searchParams?.date;

  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const allFarms = await db.select().from(farms);

  const loadTimelines = await db
    .select({
      id: loads.id,
      name: loads.name,
      farmId: farms.id,
      farmName: farms.name,
      buildingName: buildings.name,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const infrastructure = await db
    .select({
      farmName: farms.name,
      buildingName: buildings.name,
    })
    .from(buildings)
    .innerJoin(farms, eq(buildings.farmId, farms.id));

  const uniqueFarmsList = Array.from(new Set(allFarms.map((f) => f.name)));

  const availableBuildingsForFilter =
    selectedFarm && selectedFarm !== "all"
      ? Array.from(
          new Set(
            infrastructure
              .filter((i) => i.farmName === selectedFarm)
              .map((i) => i.buildingName),
          ),
        )
      : [];

  const availableLoads = Array.from(
    new Set(
      loadTimelines
        .filter((l) => {
          if (
            selectedFarm &&
            selectedFarm !== "all" &&
            l.farmName !== selectedFarm
          )
            return false;
          if (
            selectedBuilding &&
            selectedBuilding !== "all" &&
            l.buildingName !== selectedBuilding
          )
            return false;
          return true;
        })
        .map((l) =>
          // ---> THE FIX: Added loadDate, harvestDate, and isActive here! <---
          JSON.stringify({
            id: l.id,
            name: l.name || `Load ${l.id}`,
            loadDate: l.loadDate,
            harvestDate: l.harvestDate,
            isActive: l.isActive,
          }),
        ),
    ),
  )
    .map((str) => JSON.parse(str))
    .sort((a: any, b: any) => b.id - a.id);

  // ==========================================
  // ---> INTELLIGENT FILTERING <---
  // ==========================================
  const filters = [];

  if (selectedFarm && selectedFarm !== "all") {
    filters.push(eq(farms.name, selectedFarm));
  }

  if (selectedBuilding && selectedBuilding !== "all") {
    filters.push(
      or(eq(buildings.name, selectedBuilding), isNull(expenses.loadId)),
    );
  }

  if (selectedLoad && selectedLoad !== "all") {
    filters.push(
      or(eq(expenses.loadId, Number(selectedLoad)), isNull(expenses.loadId)),
    );
  }

  if (selectedType && selectedType !== "all") {
    filters.push(eq(expenses.expenseType, selectedType as any));
  }
  if (selectedDate && selectedDate !== "all") {
    filters.push(eq(expenses.expenseDate, selectedDate));
  }

  const finalCondition = filters.length > 0 ? and(...filters) : undefined;

  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(expenses)
    .innerJoin(farms, eq(expenses.farmId, farms.id))
    .leftJoin(loads, eq(expenses.loadId, loads.id))
    .leftJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(users, eq(expenses.recordedBy, users.id))
    .where(finalCondition);

  const totalItems = Number(countQuery[0].count);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const rawHistory = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      type: expenses.expenseType,
      amount: expenses.amount,
      farmId: expenses.farmId,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
      loadId: expenses.loadId,
      loadName: loads.name,
      remarks: expenses.remarks,
    })
    .from(expenses)
    .innerJoin(farms, eq(expenses.farmId, farms.id))
    .leftJoin(loads, eq(expenses.loadId, loads.id))
    .leftJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(users, eq(expenses.recordedBy, users.id))
    .where(finalCondition)
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const rawFullHistory = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      type: expenses.expenseType,
      amount: expenses.amount,
      farmId: expenses.farmId,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
      loadId: expenses.loadId,
      loadName: loads.name,
      remarks: expenses.remarks,
    })
    .from(expenses)
    .innerJoin(farms, eq(expenses.farmId, farms.id))
    .leftJoin(loads, eq(expenses.loadId, loads.id))
    .leftJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(users, eq(expenses.recordedBy, users.id))
    .where(finalCondition)
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

  const allHarvests = await db.select().from(harvestRecords);

  const allLoadsWithTrueTimeline = loadTimelines.map((l) => {
    const loadHarvests = allHarvests.filter((h) => h.loadId === l.id);
    const trueHarvestDate =
      loadHarvests.length > 0
        ? loadHarvests[loadHarvests.length - 1].harvestDate
        : l.harvestDate;

    return {
      farmId: l.farmId,
      buildingName: l.buildingName,
      name: l.name,
      isActive: l.isActive,
      startTime: getMidnight(l.loadDate),
      endTime: l.isActive
        ? Infinity
        : getEndOfDay(trueHarvestDate || new Date()),
    };
  });

  const enrichHistory = (records: any[]) =>
    records.map((record: any) => {
      if (record.loadId) return { ...record, sharedWith: [] };

      const expenseTime = getMidnight(record.date || record.createdAt);

      const activeBatches = allLoadsWithTrueTimeline.filter(
        (t) =>
          t.farmId === record.farmId &&
          expenseTime >= t.startTime &&
          expenseTime <= t.endTime,
      );

      return {
        ...record,
        sharedWith: activeBatches.map(
          (b) => `${b.buildingName} (${b.name || "Unnamed"})`,
        ),
      };
    });

  const selectedLoadObj = availableLoads.find(
    (l: any) => String(l.id) === selectedLoad,
  );
  const displayLoadName = selectedLoadObj ? selectedLoadObj.name : "";

  const filterEnrichedHistory = (enrichedRecords: any[]) => {
    return enrichedRecords.filter((record) => {
      if (record.loadId) return true;

      if (selectedBuilding && selectedBuilding !== "all") {
        const buildingIsIncluded = record.sharedWith.some((b: string) =>
          b.startsWith(selectedBuilding),
        );
        if (!buildingIsIncluded) return false;
      }

      if (selectedLoad && selectedLoad !== "all") {
        const targetLoadName = displayLoadName;
        const loadIsIncluded = record.sharedWith.some((b: string) =>
          b.includes(`(${targetLoadName})`),
        );
        if (!loadIsIncluded) return false;
      }

      return true;
    });
  };

  const baseHistory = enrichHistory(rawHistory);
  const baseFullHistory = enrichHistory(rawFullHistory);

  const history = filterEnrichedHistory(baseHistory);
  const fullHistory = filterEnrichedHistory(baseFullHistory);

  const totalAmount = fullHistory.reduce(
    (sum: number, record: any) => sum + Number(record.amount),
    0,
  );

  const categoryTotals = fullHistory.reduce(
    (acc: Record<string, number>, record: any) => {
      acc[record.type] = (acc[record.type] || 0) + Number(record.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  let topCategory = "N/A";
  let topCategoryAmount = 0;

  Object.entries(categoryTotals).forEach(([type, amount]) => {
    const val = amount as number;
    if (val > topCategoryAmount) {
      topCategoryAmount = val;
      topCategory = type;
    }
  });

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatMacro = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-card border border-border/50 p-6 lg:p-8 rounded-lg shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <div>
          <h1 className="text-2xl sm:text-2xl font-black tracking-tight flex items-center gap-3 text-foreground uppercase">
            <TrendingDown className="h-9 w-9 sm:h-10 sm:w-10 text-red-500 shrink-0" />
            Financial Ledger
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm">
            Track direct costs, calculate shared farm labor, and monitor budget
            burn rates.
          </p>
        </div>
        <div className="shrink-0 mt-2 md:mt-0">
          <AddExpenseModal farms={allFarms} loadTimelines={loadTimelines} />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/50 p-6 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              Total Filtered Expenses
            </p>
            <p
              className="text-xl lg:text-xl md:text-xl font-black tracking-tight text-foreground truncate mt-0.5"
              title={formatMoney(totalAmount)}
            >
              {formatMacro(totalAmount)}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border/50 p-6 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-2xl shrink-0">
            <PieChart className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              Top Category
            </p>
            <p
              className="text-lg lg:text-lg font-black text-foreground capitalize truncate mt-0.5"
              title={topCategory}
            >
              {topCategory}
            </p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              {formatMacro(topCategoryAmount)}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border/50 p-6 rounded-lg shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              Record Count
            </p>
            <p className="text-xl lg:text-xl font-black text-foreground truncate mt-0.5">
              {totalItems}
            </p>
            <p className="text-xs font-bold text-muted-foreground mt-0.5 truncate">
              Matching current filters
            </p>
          </div>
        </div>
      </div>

      <ExpensesTableClient
        history={history}
        fullHistory={fullHistory}
        farms={uniqueFarmsList}
        buildings={availableBuildingsForFilter}
        loads={availableLoads}
        totalPages={totalPages}
        currentPage={currentPage}
      />
    </div>
  );
}
