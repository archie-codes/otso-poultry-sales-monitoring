import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import { expenses, farms, loads, buildings, users } from "../../src/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { TrendingDown, Wallet, PieChart, Building2 } from "lucide-react";
import AddExpenseModal from "./AddExpenseModal";
import ExpensesTableClient from "./ExpensesTableClient";

export default async function ExpensesPage(props: {
  searchParams: Promise<{
    farm?: string;
    building?: string;
    load?: string; // <--- NEW: Added load filter
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
  const selectedLoad = searchParams?.load; // <--- NEW
  const selectedType = searchParams?.type;
  const selectedDate = searchParams?.date;

  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const allFarms = await db.select().from(farms);

  const loadTimelines = await db
    .select({
      id: loads.id,
      name: loads.name, // Grab actual name for UI
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

  // ---> NEW: DYNAMIC LOAD FILTER <---
  // Only show loads that belong to the currently selected Farm/Building
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
          JSON.stringify({ id: l.id, name: l.name || `Load ${l.id}` }),
        ),
    ),
  )
    .map((str) => JSON.parse(str))
    .sort((a: any, b: any) => b.id - a.id); // Sort newest loads first

  const filters = [];
  if (selectedFarm && selectedFarm !== "all") {
    filters.push(eq(farms.name, selectedFarm));
  }
  if (selectedBuilding && selectedBuilding !== "all") {
    filters.push(eq(buildings.name, selectedBuilding));
  }
  if (selectedLoad && selectedLoad !== "all") {
    filters.push(eq(expenses.loadId, Number(selectedLoad)));
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

  // THE PAGINATED DATA (For the UI Table)
  const history = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      type: expenses.expenseType,
      amount: expenses.amount,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
      loadId: expenses.loadId,
      loadName: loads.name, // <--- THE FIX: Grab Batch Name for UI
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

  // THE UNPAGINATED DATA (For the PDF/CSV Exports)
  const fullHistory = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      type: expenses.expenseType,
      amount: expenses.amount,
      farmName: farms.name,
      buildingName: buildings.name,
      staffName: users.name,
      loadId: expenses.loadId,
      loadName: loads.name, // <--- THE FIX: Grab Batch Name for UI
      remarks: expenses.remarks,
    })
    .from(expenses)
    .innerJoin(farms, eq(expenses.farmId, farms.id))
    .leftJoin(loads, eq(expenses.loadId, loads.id))
    .leftJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(users, eq(expenses.recordedBy, users.id))
    .where(finalCondition)
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

  const totalAmount = fullHistory.reduce(
    (sum, record) => sum + Number(record.amount),
    0,
  );

  const categoryTotals = fullHistory.reduce(
    (acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + Number(record.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  let topCategory = "N/A";
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([type, amount]) => {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
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

      {/* INTERACTIVE TABLE & FILTERS */}
      <ExpensesTableClient
        history={history}
        fullHistory={fullHistory}
        farms={uniqueFarmsList}
        buildings={availableBuildingsForFilter}
        loads={availableLoads} // <--- PASS DOWN LOADS
        totalPages={totalPages}
        currentPage={currentPage}
      />
    </div>
  );
}
