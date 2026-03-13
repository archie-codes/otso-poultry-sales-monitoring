// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../../lib/auth";
// import { redirect } from "next/navigation";
// import { db } from "../../../src";
// import {
//   loads,
//   buildings,
//   farms,
//   dailyRecords,
//   expenses,
//   harvestRecords,
//   feedTransactions,
// } from "../../../src/db/schema";
// import { eq, desc, asc } from "drizzle-orm";
// import {
//   Archive,
//   MapPin,
//   Warehouse,
//   CalendarCheck,
//   CalendarDays,
//   TrendingUp,
//   TrendingDown,
//   Wallet,
//   CheckCircle2,
// } from "lucide-react";
// import Image from "next/image";
// import { cn } from "@/lib/utils";

// export default async function HistoryPage() {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");

//   // 1. Fetch ONLY INACTIVE (Completed) Loads for display
//   const historicalLoadsData = await db
//     .select({
//       id: loads.id,
//       farmId: farms.id,
//       farmName: farms.name,
//       buildingName: buildings.name,
//       chickType: loads.chickType,
//       quantity: loads.actualQuantityLoad,
//       sellingPrice: loads.sellingPrice,
//       initialCapital: loads.initialCapital,
//       loadDate: loads.loadDate,
//       harvestDate: loads.harvestDate,
//       customerName: loads.customerName,
//       isActive: loads.isActive,
//     })
//     .from(loads)
//     .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//     .innerJoin(farms, eq(buildings.farmId, farms.id))
//     .where(eq(loads.isActive, false))
//     .orderBy(asc(farms.name), asc(buildings.name), desc(loads.harvestDate));

//   // 2. Fetch all raw datasets needed for the Math Engine
//   const allDailyRecords = await db.select().from(dailyRecords);
//   const allExpenses = await db.select().from(expenses);
//   const allHarvests = await db.select().from(harvestRecords);
//   const allFeedDeliveries = await db.select().from(feedTransactions);

//   // ---> NEW: Fetch ALL Loads (Active and Inactive) to calculate overlapping dates <---
//   const allLoadsWithFarm = await db
//     .select({
//       id: loads.id,
//       farmId: buildings.farmId,
//       loadDate: loads.loadDate,
//       harvestDate: loads.harvestDate,
//       isActive: loads.isActive,
//     })
//     .from(loads)
//     .innerJoin(buildings, eq(loads.buildingId, buildings.id));

//   // 3. THE MATH ENGINE
//   const reports = historicalLoadsData.map((load) => {
//     const actualQuantityLoad = load.quantity;

//     const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
//     const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

//     const loadHarvests = allHarvests.filter((h) => h.loadId === load.id);
//     const actualHarvest = loadHarvests.reduce((sum, h) => sum + h.quantity, 0);
//     const totalRtlAmount = loadHarvests.reduce(
//       (sum, h) => sum + h.quantity * Number(h.sellingPrice),
//       0,
//     );

//     const actualHarvestDate =
//       loadHarvests.length > 0
//         ? loadHarvests[loadHarvests.length - 1].harvestDate
//         : load.harvestDate;

//     const avgSellingPrice =
//       actualHarvest > 0 ? totalRtlAmount / actualHarvest : 0;
//     const percentHarvest =
//       actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

//     const uniqueCustomers = Array.from(
//       new Set(loadHarvests.map((h) => h.customerName).filter(Boolean)),
//     );
//     const displayCustomer =
//       uniqueCustomers.length > 1
//         ? "Multiple Buyers"
//         : uniqueCustomers[0] || load.customerName || "None";

//     // --- SMART EXPENSE ENGINE ---
//     const loadStartTime = new Date(load.loadDate).getTime();
//     const loadEndTime = actualHarvestDate
//       ? new Date(actualHarvestDate).getTime()
//       : new Date().getTime();

//     // A. Direct Expenses
//     const directExpenses = allExpenses
//       .filter((e) => e.loadId === load.id)
//       .reduce((sum, e) => sum + Number(e.amount), 0);

//     // B. Feed Expenses
//     const feedExpenses = allFeedDeliveries
//       .filter((f) => f.loadId === load.id)
//       .reduce(
//         (sum, f) => sum + Number(f.quantity) * Number(f.costPerBag || 0),
//         0,
//       );

//     // C. TIME-AWARE SHARED EXPENSES
//     const sharedExpenseShare = allExpenses
//       .filter((e) => {
//         // Only look at Farm-level shared expenses for THIS farm during THIS load's lifetime
//         if (e.farmId !== load.farmId || e.loadId !== null) return false;
//         // @ts-ignore
//         const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
//         return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
//       })
//       .reduce((sum, e) => {
//         // @ts-ignore
//         const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();

//         // Let's count exactly how many buildings had chicks inside them on this exact day!
//         const activeBatchesOnThisDay = allLoadsWithFarm.filter((l) => {
//           if (l.farmId !== load.farmId) return false;

//           const start = new Date(l.loadDate).getTime();
//           // If it is currently active, treat its end time as Infinity. Otherwise, use harvest date.
//           const end = l.isActive
//             ? Infinity
//             : new Date(l.harvestDate!).getTime();

//           return expenseTime >= start && expenseTime <= end;
//         }).length;

//         // If there's 1 active building, divide by 1. If 3, divide by 3.
//         const divisor = activeBatchesOnThisDay > 0 ? activeBatchesOnThisDay : 1;

//         return sum + Number(e.amount) / divisor;
//       }, 0);

//     // D. Final Gross Cost
//     const initialCapital = Number(load.initialCapital || 0);
//     const totalGrossCost =
//       initialCapital + directExpenses + sharedExpenseShare + feedExpenses;
//     // ---------------------------------------------------

//     const actualCostPerChick =
//       actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

//     const totalNetSales = totalRtlAmount - totalGrossCost;

//     const loadDateObj = new Date(load.loadDate);
//     const harvestDateObj = actualHarvestDate
//       ? new Date(actualHarvestDate)
//       : new Date();

//     const ageInDays = Math.max(
//       1,
//       Math.floor(
//         (harvestDateObj.getTime() - loadDateObj.getTime()) /
//           (1000 * 60 * 60 * 24),
//       ),
//     );

//     return {
//       ...load,
//       farmMortality,
//       actualHarvest,
//       actualHarvestDate,
//       percentHarvest,
//       avgSellingPrice,
//       displayCustomer,
//       totalGrossCost,
//       actualCostPerChick,
//       totalRtlAmount,
//       totalNetSales,
//       ageInDays,
//     };
//   });

//   // 4. GROUP BY FARM -> BUILDING
//   const groupedHistory = reports.reduce(
//     (acc, report) => {
//       const farm = report.farmName;
//       const building = report.buildingName;

//       if (!acc[farm]) acc[farm] = {};
//       if (!acc[farm][building]) acc[farm][building] = [];

//       acc[farm][building].push(report);
//       return acc;
//     },
//     {} as Record<string, Record<string, typeof reports>>,
//   );

//   const formatMoney = (amount: number) =>
//     `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

//   return (
//     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 py-8">
//       {/* 1. HEADER */}
//       <div className="bg-card border border-border/50 p-6 lg:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-center">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
//         <h1 className="text-3xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
//           <Archive className="h-9 w-9 sm:h-10 sm:w-10 text-slate-600 shrink-0" />
//           Historical Ledger
//         </h1>
//         <p className="text-muted-foreground font-medium mt-2 text-sm max-w-2xl">
//           Review past performance and financials for every building. Use this
//           data to inform your next capital deployment and chick loading
//           strategy.
//         </p>
//       </div>

//       {/* 2. HISTORY DATA */}
//       {Object.keys(groupedHistory).length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border/50 rounded-3xl">
//           <Archive className="h-16 w-16 text-muted-foreground/30 mb-4" />
//           <h3 className="text-xl font-bold">No Historical Data</h3>
//           <p className="text-muted-foreground mt-2 text-center max-w-sm">
//             You haven't completed any harvests yet. Once a building is fully
//             harvested, it will appear here.
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-16">
//           {Object.entries(groupedHistory).map(([farmName, buildings]) => (
//             <div key={farmName} className="space-y-8">
//               {/* Farm Title */}
//               <div className="flex items-center gap-3 pb-4 border-b-[3px] border-slate-600/30">
//                 <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600" />
//                 <h2 className="text-2xl sm:text-2xl md:text-2xl font-black tracking-tighter uppercase text-foreground">
//                   {farmName}
//                 </h2>
//               </div>

//               {/* Buildings and their Historical Cards */}
//               <div className="space-y-12 pl-0 sm:pl-4 sm:border-l-2 sm:border-slate-200 dark:sm:border-slate-800">
//                 {Object.entries(buildings).map(
//                   ([buildingName, pastBatches]) => (
//                     <div key={buildingName} className="space-y-6">
//                       {/* Building Sub-Header */}
//                       <div className="flex items-center gap-3">
//                         <Warehouse className="w-6 h-6 text-slate-700 dark:text-slate-300" />
//                         <h3 className="text-xl sm:text-xl font-black uppercase tracking-tight text-foreground">
//                           {buildingName}
//                         </h3>
//                         <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
//                           {pastBatches.length} Past Batches
//                         </span>
//                       </div>

//                       {/* The Cards Grid (Stacked) */}
//                       <div className="grid grid-cols-1 gap-8">
//                         {pastBatches.map((batch) => (
//                           <div
//                             key={batch.id}
//                             className="bg-card border border-border/60 rounded-[2rem] overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md grayscale-15"
//                           >
//                             {/* CARD HEADER */}
//                             <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
//                               <div className="flex flex-col gap-1.5">
//                                 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
//                                   <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] sm:text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
//                                     <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
//                                     Harvested
//                                   </span>
//                                   <span className="bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
//                                     {batch.ageInDays} Days Total
//                                   </span>
//                                 </div>

//                                 <div className="flex items-center gap-1.5 mt-1">
//                                   <Image
//                                     src="/hen.svg"
//                                     alt="Hen"
//                                     width={16}
//                                     height={16}
//                                     className="object-contain dark:invert opacity-80"
//                                   />
//                                   <p className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest opacity-80">
//                                     {batch.chickType || "Standard Breed"}
//                                   </p>
//                                 </div>
//                               </div>

//                               {/* DATES WRAPPER */}
//                               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl w-fit">
//                                   <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//                                   Loaded:{" "}
//                                   {new Date(
//                                     batch.loadDate,
//                                   ).toLocaleDateString()}
//                                 </div>
//                                 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl w-fit shadow-sm">
//                                   <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//                                   Harvested:{" "}
//                                   {batch.actualHarvestDate
//                                     ? new Date(
//                                         batch.actualHarvestDate,
//                                       ).toLocaleDateString()
//                                     : "TBD"}
//                                 </div>
//                               </div>
//                             </div>

//                             {/* CARD BODY: 10 METRICS GRID */}
//                             <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Target Harvest
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-foreground">
//                                   {batch.harvestDate
//                                     ? new Date(
//                                         batch.harvestDate,
//                                       ).toLocaleDateString()
//                                     : "TBD"}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Customer Name
//                                 </p>
//                                 <p
//                                   className="text-xs sm:text-sm font-bold text-foreground truncate"
//                                   title={batch.displayCustomer}
//                                 >
//                                   {batch.displayCustomer}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Percent Harvest
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-primary">
//                                   {batch.percentHarvest.toFixed(1)}%
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Actual Qty Load
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-foreground">
//                                   {batch.quantity.toLocaleString()}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
//                                   Mortality
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
//                                   {batch.farmMortality.toLocaleString()}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">
//                                   Actual Harvest
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
//                                   {batch.actualHarvest.toLocaleString()}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Actual Cost Per Chick
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-foreground">
//                                   {formatMoney(batch.actualCostPerChick)}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Avg Selling Price
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-foreground">
//                                   {formatMoney(batch.avgSellingPrice)}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
//                                   Total Gross (Expenses)
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500">
//                                   {formatMoney(batch.totalGrossCost)}
//                                 </p>
//                               </div>
//                               <div className="space-y-1">
//                                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                   Total RTL Amount
//                                 </p>
//                                 <p className="text-xs sm:text-sm font-black text-foreground">
//                                   {formatMoney(batch.totalRtlAmount)}
//                                 </p>
//                               </div>
//                             </div>

//                             {/* CARD FOOTER: CAPITAL & NET SALES */}
//                             <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-100 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 rounded-b-[2rem]">
//                               <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
//                                 <div className="flex items-center gap-3">
//                                   <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
//                                     <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
//                                   </div>
//                                   <div>
//                                     <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                                       Initial Capital
//                                     </p>
//                                     <p className="text-lg sm:text-xl font-black text-foreground">
//                                       {formatMoney(
//                                         Number(batch.initialCapital),
//                                       )}
//                                     </p>
//                                   </div>
//                                 </div>
//                               </div>

//                               <div
//                                 className={cn(
//                                   "flex items-center justify-between p-3 sm:p-4 rounded-2xl shadow-sm border",
//                                   batch.totalNetSales >= 0
//                                     ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
//                                     : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
//                                 )}
//                               >
//                                 <div className="flex items-center gap-3">
//                                   <div
//                                     className={cn(
//                                       "p-2 sm:p-2.5 rounded-xl",
//                                       batch.totalNetSales >= 0
//                                         ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
//                                         : "bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-400",
//                                     )}
//                                   >
//                                     {batch.totalNetSales >= 0 ? (
//                                       <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
//                                     ) : (
//                                       <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
//                                     )}
//                                   </div>
//                                   <div>
//                                     <p
//                                       className={cn(
//                                         "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
//                                         batch.totalNetSales >= 0
//                                           ? "text-emerald-700 dark:text-emerald-500"
//                                           : "text-red-700 dark:text-red-500",
//                                       )}
//                                     >
//                                       Total Net Sales
//                                     </p>
//                                     <p
//                                       className={cn(
//                                         "text-lg sm:text-xl md:text-2xl font-black",
//                                         batch.totalNetSales >= 0
//                                           ? "text-emerald-700 dark:text-emerald-400"
//                                           : "text-red-700 dark:text-red-400",
//                                       )}
//                                     >
//                                       {formatMoney(batch.totalNetSales)}
//                                     </p>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ),
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../../src";
import {
  loads,
  buildings,
  farms,
  dailyRecords,
  expenses,
  harvestRecords,
  feedTransactions,
} from "../../../src/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import {
  Archive,
  MapPin,
  Warehouse,
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch ONLY INACTIVE (Completed) Loads for display
  const historicalLoadsData = await db
    .select({
      id: loads.id,
      farmId: farms.id,
      farmName: farms.name,
      buildingName: buildings.name,
      chickType: loads.chickType,
      quantity: loads.actualQuantityLoad,
      sellingPrice: loads.sellingPrice,
      initialCapital: loads.initialCapital,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      customerName: loads.customerName,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id))
    .innerJoin(farms, eq(buildings.farmId, farms.id))
    .where(eq(loads.isActive, false))
    .orderBy(asc(farms.name), asc(buildings.name), desc(loads.harvestDate));

  // 2. Fetch all raw datasets needed for the Math Engine
  const allDailyRecords = await db.select().from(dailyRecords);
  const allExpenses = await db.select().from(expenses);
  const allHarvests = await db.select().from(harvestRecords);
  const allFeedDeliveries = await db.select().from(feedTransactions);

  // 3. Fetch ALL Loads (Active and Inactive) to calculate overlapping dates
  const allLoadsWithFarm = await db
    .select({
      id: loads.id,
      farmId: buildings.farmId,
      loadDate: loads.loadDate,
      harvestDate: loads.harvestDate,
      isActive: loads.isActive,
    })
    .from(loads)
    .innerJoin(buildings, eq(loads.buildingId, buildings.id));

  // ---> NEW: THE TRUE TIMELINE MAP <---
  // We calculate the EXACT end date for every single building based on actual harvest records, NOT target dates!
  const allLoadsWithTrueTimeline = allLoadsWithFarm.map((l) => {
    const loadHarvests = allHarvests.filter((h) => h.loadId === l.id);

    // Find the actual date they physically removed the last birds
    const trueHarvestDate =
      loadHarvests.length > 0
        ? loadHarvests[loadHarvests.length - 1].harvestDate
        : l.harvestDate;

    // Convert dates to milliseconds for perfect math
    const startTime = new Date(l.loadDate).getTime();
    const endTime = trueHarvestDate
      ? new Date(trueHarvestDate).getTime()
      : new Date().getTime();

    return {
      farmId: l.farmId,
      isActive: l.isActive,
      startTime: startTime,
      endTime: l.isActive ? Infinity : endTime, // If active, it hasn't ended yet
    };
  });
  // ----------------------------------------

  // 4. THE MATH ENGINE
  const reports = historicalLoadsData.map((load) => {
    const actualQuantityLoad = load.quantity;

    const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
    const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

    const loadHarvests = allHarvests.filter((h) => h.loadId === load.id);
    const actualHarvest = loadHarvests.reduce((sum, h) => sum + h.quantity, 0);
    const totalRtlAmount = loadHarvests.reduce(
      (sum, h) => sum + h.quantity * Number(h.sellingPrice),
      0,
    );

    const actualHarvestDate =
      loadHarvests.length > 0
        ? loadHarvests[loadHarvests.length - 1].harvestDate
        : load.harvestDate;

    const avgSellingPrice =
      actualHarvest > 0 ? totalRtlAmount / actualHarvest : 0;
    const percentHarvest =
      actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

    const uniqueCustomers = Array.from(
      new Set(loadHarvests.map((h) => h.customerName).filter(Boolean)),
    );
    const displayCustomer =
      uniqueCustomers.length > 1
        ? "Multiple Buyers"
        : uniqueCustomers[0] || load.customerName || "None";

    // --- SMART EXPENSE ENGINE ---
    const loadStartTime = new Date(load.loadDate).getTime();
    const loadEndTime = actualHarvestDate
      ? new Date(actualHarvestDate).getTime()
      : new Date().getTime();

    // A. Direct Expenses
    const directExpenses = allExpenses
      .filter((e) => e.loadId === load.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // B. Feed Expenses
    const feedExpenses = allFeedDeliveries
      .filter((f) => f.loadId === load.id)
      .reduce(
        (sum, f) => sum + Number(f.quantity) * Number(f.costPerBag || 0),
        0,
      );

    // C. TIME-AWARE SHARED EXPENSES
    const sharedExpenseShare = allExpenses
      .filter((e) => {
        // Only look at Farm-level shared expenses for THIS farm during THIS load's true lifetime
        if (e.farmId !== load.farmId || e.loadId !== null) return false;
        // @ts-ignore
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();
        return expenseTime >= loadStartTime && expenseTime <= loadEndTime;
      })
      .reduce((sum, e) => {
        // @ts-ignore
        const expenseTime = new Date(e.expenseDate || e.createdAt).getTime();

        // ---> FIX: Use the True Timeline Map to count neighbors! <---
        const activeBatchesOnThisDay = allLoadsWithTrueTimeline.filter(
          (timeline) => {
            if (timeline.farmId !== load.farmId) return false;
            // Was this neighbor actually alive on the day the bill was paid?
            return (
              expenseTime >= timeline.startTime &&
              expenseTime <= timeline.endTime
            );
          },
        ).length;

        // If there's 1 active building, divide by 1. If 3, divide by 3.
        const divisor = activeBatchesOnThisDay > 0 ? activeBatchesOnThisDay : 1;

        return sum + Number(e.amount) / divisor;
      }, 0);

    // D. Final Gross Cost
    const initialCapital = Number(load.initialCapital || 0);
    const totalGrossCost =
      initialCapital + directExpenses + sharedExpenseShare + feedExpenses;
    // ---------------------------------------------------

    const actualCostPerChick =
      actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

    const totalNetSales = totalRtlAmount - totalGrossCost;

    const loadDateObj = new Date(load.loadDate);
    const harvestDateObj = actualHarvestDate
      ? new Date(actualHarvestDate)
      : new Date();

    const ageInDays = Math.max(
      1,
      Math.floor(
        (harvestDateObj.getTime() - loadDateObj.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    return {
      ...load,
      farmMortality,
      actualHarvest,
      actualHarvestDate,
      percentHarvest,
      avgSellingPrice,
      displayCustomer,
      totalGrossCost,
      actualCostPerChick,
      totalRtlAmount,
      totalNetSales,
      ageInDays,
    };
  });

  // 5. GROUP BY FARM -> BUILDING
  const groupedHistory = reports.reduce(
    (acc, report) => {
      const farm = report.farmName;
      const building = report.buildingName;

      if (!acc[farm]) acc[farm] = {};
      if (!acc[farm][building]) acc[farm][building] = [];

      acc[farm][building].push(report);
      return acc;
    },
    {} as Record<string, Record<string, typeof reports>>,
  );

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. HEADER */}
      <div className="bg-card border border-border/50 p-6 lg:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
        <h1 className="text-3xl sm:text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
          <Archive className="h-9 w-9 sm:h-10 sm:w-10 text-slate-600 shrink-0" />
          Historical Ledger
        </h1>
        <p className="text-muted-foreground font-medium mt-2 text-sm max-w-2xl">
          Review past performance and financials for every building. Use this
          data to inform your next capital deployment and chick loading
          strategy.
        </p>
      </div>

      {/* 2. HISTORY DATA */}
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border/50 rounded-3xl">
          <Archive className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Historical Data</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            You haven't completed any harvests yet. Once a building is fully
            harvested, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedHistory).map(([farmName, buildings]) => (
            <div key={farmName} className="space-y-8">
              {/* Farm Title */}
              <div className="flex items-center gap-3 pb-4 border-b-[3px] border-slate-600/30">
                <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600" />
                <h2 className="text-2xl sm:text-2xl md:text-2xl font-black tracking-tighter uppercase text-foreground">
                  {farmName}
                </h2>
              </div>

              {/* Buildings and their Historical Cards */}
              <div className="space-y-12 pl-0 sm:pl-4 sm:border-l-2 sm:border-slate-200 dark:sm:border-slate-800">
                {Object.entries(buildings).map(
                  ([buildingName, pastBatches]) => (
                    <div key={buildingName} className="space-y-6">
                      {/* Building Sub-Header */}
                      <div className="flex items-center gap-3">
                        <Warehouse className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                        <h3 className="text-xl sm:text-xl font-black uppercase tracking-tight text-foreground">
                          {buildingName}
                        </h3>
                        <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
                          {pastBatches.length} Past Batches
                        </span>
                      </div>

                      {/* The Cards Grid (Stacked) */}
                      <div className="grid grid-cols-1 gap-8">
                        {pastBatches.map((batch) => (
                          <div
                            key={batch.id}
                            className="bg-card border border-border/60 rounded-[2rem] overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md grayscale-15"
                          >
                            {/* CARD HEADER */}
                            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] sm:text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    Harvested
                                  </span>
                                  <span className="bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                                    {batch.ageInDays} Days Total
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 mt-1">
                                  <Image
                                    src="/hen.svg"
                                    alt="Hen"
                                    width={16}
                                    height={16}
                                    className="object-contain dark:invert opacity-80"
                                  />
                                  <p className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest opacity-80">
                                    {batch.chickType || "Standard Breed"}
                                  </p>
                                </div>
                              </div>

                              {/* DATES WRAPPER */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl w-fit">
                                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  Loaded:{" "}
                                  {new Date(
                                    batch.loadDate,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl w-fit shadow-sm">
                                  <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  Harvested:{" "}
                                  {batch.actualHarvestDate
                                    ? new Date(
                                        batch.actualHarvestDate,
                                      ).toLocaleDateString()
                                    : "TBD"}
                                </div>
                              </div>
                            </div>

                            {/* CARD BODY: 10 METRICS GRID */}
                            <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Target Harvest
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">
                                  {batch.harvestDate
                                    ? new Date(
                                        batch.harvestDate,
                                      ).toLocaleDateString()
                                    : "TBD"}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Customer Name
                                </p>
                                <p
                                  className="text-xs sm:text-sm font-bold text-foreground truncate"
                                  title={batch.displayCustomer}
                                >
                                  {batch.displayCustomer}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Percent Harvest
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-primary">
                                  {batch.percentHarvest.toFixed(1)}%
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Actual Qty Load
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">
                                  {batch.quantity.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
                                  Mortality
                                </p>
                                <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
                                  {batch.farmMortality.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                  Actual Harvest
                                </p>
                                <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
                                  {batch.actualHarvest.toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Actual Cost Per Chick
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">
                                  {formatMoney(batch.actualCostPerChick)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Avg Selling Price
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-foreground">
                                  {formatMoney(batch.avgSellingPrice)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                                  Total Gross (Expenses)
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500">
                                  {formatMoney(batch.totalGrossCost)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Total RTL Amount
                                </p>
                                <p className="text-xs sm:text-sm font-black text-foreground">
                                  {formatMoney(batch.totalRtlAmount)}
                                </p>
                              </div>
                            </div>

                            {/* CARD FOOTER: CAPITAL & NET SALES */}
                            <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-100 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 rounded-b-[2rem]">
                              <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                      Initial Capital
                                    </p>
                                    <p className="text-lg sm:text-xl font-black text-foreground">
                                      {formatMoney(
                                        Number(batch.initialCapital),
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div
                                className={cn(
                                  "flex items-center justify-between p-3 sm:p-4 rounded-2xl shadow-sm border",
                                  batch.totalNetSales >= 0
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "p-2 sm:p-2.5 rounded-xl",
                                      batch.totalNetSales >= 0
                                        ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                                        : "bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-400",
                                    )}
                                  >
                                    {batch.totalNetSales >= 0 ? (
                                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <p
                                      className={cn(
                                        "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                                        batch.totalNetSales >= 0
                                          ? "text-emerald-700 dark:text-emerald-500"
                                          : "text-red-700 dark:text-red-500",
                                      )}
                                    >
                                      Total Net Sales
                                    </p>
                                    <p
                                      className={cn(
                                        "text-lg sm:text-xl md:text-2xl font-black",
                                        batch.totalNetSales >= 0
                                          ? "text-emerald-700 dark:text-emerald-400"
                                          : "text-red-700 dark:text-red-400",
                                      )}
                                    >
                                      {formatMoney(batch.totalNetSales)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
