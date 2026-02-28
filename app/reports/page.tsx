// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../lib/auth";
// import { redirect } from "next/navigation";
// import { db } from "../../src";
// import {
//   loads,
//   buildings,
//   farms,
//   dailyRecords,
//   expenses,
// } from "../../src/db/schema";
// import { eq } from "drizzle-orm";
// import { FileBarChart, Percent, Calendar, Users } from "lucide-react";

// export default async function ReportsPage() {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");

//   // 1. Fetch all Active Loads (Now including Load Date, Harvest Date, and Customer!)
//   const activeLoadsData = await db
//     .select({
//       id: loads.id,
//       farmId: farms.id,
//       farmName: farms.name,
//       buildingName: buildings.name,
//       quantity: loads.actualQuantityLoad,
//       sellingPrice: loads.sellingPrice,
//       initialCapital: loads.initialCapital,
//       loadDate: loads.loadDate,
//       harvestDate: loads.harvestDate,
//       customerName: loads.customerName,
//     })
//     .from(loads)
//     .innerJoin(buildings, eq(loads.buildingId, buildings.id))
//     .innerJoin(farms, eq(buildings.farmId, farms.id))
//     .where(eq(loads.isActive, true));

//   const allDailyRecords = await db.select().from(dailyRecords);
//   const allExpenses = await db.select().from(expenses);

//   // 2. THE NUMBER CRUNCHING ENGINE (Exactly matching the Owner's Excel Formulas)
//   const reports = activeLoadsData.map((load) => {
//     // Basic Info
//     const actualQuantityLoad = load.quantity;
//     const sellingPrice = Number(load.sellingPrice) || 0;

//     // A. Mortality & Harvest Calculations
//     const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
//     const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

//     // FORMULA: ACTUAL HARVEST = (ACTUAL BUILDING QUANTITY - BUILDING MORTALITY)
//     const actualHarvest = actualQuantityLoad - farmMortality;

//     // FORMULA: PERCENT HARVEST = (ACTUAL HARVEST / ACTUAL QUANTITY LOAD)
//     const percentHarvest =
//       actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

//     // B. Expense Calculations
//     const directExpenses = allExpenses
//       .filter((e) => e.loadId === load.id)
//       .reduce((sum, e) => sum + Number(e.amount), 0);

//     const farmActiveLoadsCount = activeLoadsData.filter(
//       (l) => l.farmId === load.farmId,
//     ).length;
//     const sharedExpensesTotal = allExpenses
//       .filter((e) => e.farmId === load.farmId && e.loadId === null)
//       .reduce((sum, e) => sum + Number(e.amount), 0);
//     const sharedExpenseShare =
//       farmActiveLoadsCount > 0 ? sharedExpensesTotal / farmActiveLoadsCount : 0;

//     // FORMULA: TOTAL GROSS COST OR EXPENSES
//     const totalGrossCost = directExpenses + sharedExpenseShare;

//     // FORMULA: ACTUAL COST PER CHICK = EXPENSES / ACTUAL HARVEST
//     const actualCostPerChick =
//       actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

//     // C. Final Revenue & Profit Calculations
//     // FORMULA: TOTAL RTL AMOUNT = ACTUAL HARVEST * SELLING PRICE
//     const totalRtlAmount = actualHarvest * sellingPrice;

//     // FORMULA: TOTAL NET SALES = TOTAL RTL AMOUNT - EXPENSES
//     const totalNetSales = totalRtlAmount - totalGrossCost;

//     return {
//       ...load,
//       farmMortality,
//       actualHarvest,
//       percentHarvest,
//       totalGrossCost,
//       actualCostPerChick,
//       totalRtlAmount,
//       totalNetSales,
//     };
//   });

//   return (
//     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
//             <FileBarChart className="h-8 w-8 text-primary" />
//             Live Production Reports
//           </h1>
//           <p className="text-muted-foreground mt-1">
//             Real-time financial analytics based on current mortality and
//             expenses.
//           </p>
//         </div>
//       </div>

//       {reports.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 bg-card/50 border border-dashed border-border/50 rounded-2xl">
//           <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
//           <h3 className="text-xl font-bold">No Active Data</h3>
//           <p className="text-muted-foreground mt-2 text-center max-w-sm">
//             Load chicks into a building to start seeing automated reports.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 gap-6">
//           {reports.map((report) => (
//             <div
//               key={report.id}
//               className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
//             >
//               {/* Header */}
//               <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center">
//                 <div>
//                   <h2 className="text-xl font-bold text-foreground">
//                     {report.farmName} - {report.buildingName}
//                   </h2>
//                 </div>
//                 <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
//                   <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-md border border-border/50">
//                     <Calendar className="w-4 h-4 text-primary" />
//                     <span>
//                       Load: {new Date(report.loadDate).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-md border border-border/50">
//                     <Calendar className="w-4 h-4 text-amber-500" />
//                     <span>
//                       Harvest:{" "}
//                       {report.harvestDate
//                         ? new Date(report.harvestDate).toLocaleDateString()
//                         : "Not Set"}
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-md border border-border/50">
//                     <Users className="w-4 h-4 text-emerald-500" />
//                     <span>{report.customerName || "Unassigned"}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Body */}
//               <div className="p-6">
//                 {/* Top Row: Production Metrics */}
//                 <div className="grid grid-cols-4 gap-4 pb-6 border-b border-border/50">
//                   <div className="bg-secondary/10 p-4 rounded-xl border border-border/40">
//                     <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
//                       Actual Qty Load
//                     </p>
//                     <p className="text-2xl font-bold">
//                       {report.quantity.toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                     <p className="text-[11px] uppercase font-bold text-red-500/80 tracking-wider mb-1">
//                       Farm Mortality
//                     </p>
//                     <p className="text-2xl font-bold text-red-600 dark:text-red-400">
//                       {report.farmMortality.toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                     <p className="text-[11px] uppercase font-bold text-emerald-500/80 tracking-wider mb-1">
//                       Actual Harvest
//                     </p>
//                     <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
//                       {report.actualHarvest.toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
//                     <p className="text-[11px] uppercase font-bold text-primary/80 tracking-wider mb-1">
//                       % Harvest
//                     </p>
//                     <p className="text-2xl font-bold text-primary flex items-center gap-1">
//                       {report.percentHarvest.toFixed(2)}%{" "}
//                       <Percent className="w-5 h-5" />
//                     </p>
//                   </div>
//                 </div>

//                 {/* Bottom Row: Financial Metrics */}
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6">
//                   <div>
//                     <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
//                       Selling Price
//                     </p>
//                     <p className="text-lg font-bold">
//                       ₱{" "}
//                       {Number(report.sellingPrice).toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
//                       Total Gross Cost
//                     </p>
//                     <p className="text-lg font-bold text-amber-600 dark:text-amber-500">
//                       ₱{" "}
//                       {report.totalGrossCost.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>

//                   <div>
//                     <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
//                       Actual Cost/Chick
//                     </p>
//                     <p className="text-lg font-bold text-amber-600 dark:text-amber-500">
//                       ₱{" "}
//                       {report.actualCostPerChick.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>

//                   <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
//                     <p className="text-[11px] uppercase font-bold text-primary tracking-wider mb-1">
//                       Total RTL Amount
//                     </p>
//                     <p className="text-xl font-bold text-primary">
//                       ₱{" "}
//                       {report.totalRtlAmount.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>

//                   <div
//                     className={`p-3 rounded-lg border ${report.totalNetSales >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
//                   >
//                     <p
//                       className={`text-[11px] uppercase font-bold tracking-wider mb-1 ${report.totalNetSales >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
//                     >
//                       Total Net Sales
//                     </p>
//                     <p
//                       className={`text-xl font-bold flex items-center gap-1 ${report.totalNetSales >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
//                     >
//                       ₱
//                       {report.totalNetSales.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../../lib/auth";
// import { redirect } from "next/navigation";
// import { db } from "../../src";
// import {
//   loads,
//   buildings,
//   farms,
//   dailyRecords,
//   expenses,
// } from "../../src/db/schema";
// import { eq, desc } from "drizzle-orm";
// import { FileBarChart } from "lucide-react";

// export default async function ReportsPage() {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");

//   // 1. Fetch ALL Loads
//   const allLoadsData = await db
//     .select({
//       id: loads.id,
//       farmId: farms.id,
//       farmName: farms.name,
//       buildingName: buildings.name,
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
//     .orderBy(desc(loads.isActive), desc(loads.loadDate));

//   const allDailyRecords = await db.select().from(dailyRecords);
//   const allExpenses = await db.select().from(expenses);

//   // 2. THE NUMBER CRUNCHING ENGINE
//   const reports = allLoadsData.map((load) => {
//     const actualQuantityLoad = load.quantity;
//     const sellingPrice = Number(load.sellingPrice) || 0;

//     const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
//     const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

//     const actualHarvest = actualQuantityLoad - farmMortality;
//     const percentHarvest =
//       actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

//     const directExpenses = allExpenses
//       .filter((e) => e.loadId === load.id)
//       .reduce((sum, e) => sum + Number(e.amount), 0);

//     const farmActiveLoadsCount =
//       allLoadsData.filter((l) => l.farmId === load.farmId && l.isActive)
//         .length || 1;
//     const sharedExpensesTotal = allExpenses
//       .filter((e) => e.farmId === load.farmId && e.loadId === null)
//       .reduce((sum, e) => sum + Number(e.amount), 0);
//     const sharedExpenseShare = sharedExpensesTotal / farmActiveLoadsCount;

//     const totalGrossCost = directExpenses + sharedExpenseShare;
//     const actualCostPerChick =
//       actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

//     const totalRtlAmount = actualHarvest * sellingPrice;
//     const totalNetSales = totalRtlAmount - totalGrossCost;

//     return {
//       ...load,
//       farmMortality,
//       actualHarvest,
//       percentHarvest,
//       totalGrossCost,
//       actualCostPerChick,
//       totalRtlAmount,
//       totalNetSales,
//     };
//   });

//   return (
//     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full mx-auto pb-12 px-4">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
//             <FileBarChart className="h-8 w-8 text-primary" />
//             Master Production Ledger
//           </h1>
//           <p className="text-muted-foreground mt-1">
//             Real-time financial analytics, mortality tracking, and automated
//             cost distribution.
//           </p>
//         </div>
//       </div>

//       {/* Data Table */}
//       {reports.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-20 bg-card/50 border border-dashed border-border/50 rounded-2xl">
//           <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
//           <h3 className="text-xl font-bold">No Active Data</h3>
//           <p className="text-muted-foreground mt-2 text-center max-w-sm">
//             Load chicks into a building to start seeing automated reports.
//           </p>
//         </div>
//       ) : (
//         <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
//           <div className="overflow-x-auto custom-scrollbar pb-2">
//             <table className="w-full text-sm text-left whitespace-nowrap">
//               <thead className="text-[10px] text-muted-foreground uppercase bg-secondary/20 border-b border-border/50">
//                 <tr>
//                   <th className="px-5 py-4 font-bold tracking-wider">
//                     Location & Status
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider">Dates</th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right">
//                     Start Qty
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-red-500">
//                     Mortality
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-emerald-600 dark:text-emerald-500">
//                     Actual Harvest
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-primary">
//                     % Harvest
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right">
//                     Selling Price
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-amber-600 dark:text-amber-500">
//                     Gross Cost
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-amber-600 dark:text-amber-500">
//                     Cost/Chick
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right text-primary">
//                     Total RTL
//                   </th>
//                   <th className="px-5 py-4 font-bold tracking-wider text-right">
//                     Net Sales
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border/50">
//                 {reports.map((report) => (
//                   <tr
//                     key={report.id}
//                     className={`hover:bg-secondary/10 transition-colors ${!report.isActive ? "bg-secondary/5 opacity-70 grayscale-20%" : ""}`}
//                   >
//                     <td className="px-5 py-4">
//                       <div className="flex items-center gap-2">
//                         <span className="font-bold text-foreground text-base">
//                           {report.buildingName}
//                         </span>
//                         {report.isActive ? (
//                           <span
//                             className="relative flex h-2.5 w-2.5"
//                             title="Active"
//                           >
//                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
//                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
//                           </span>
//                         ) : (
//                           <span
//                             className="h-2 w-2 rounded-full bg-muted-foreground"
//                             title="Harvested"
//                           ></span>
//                         )}
//                       </div>
//                       <div className="text-xs text-muted-foreground">
//                         {report.farmName}
//                       </div>
//                       <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate max-w-[120px]">
//                         {report.customerName || "No Customer"}
//                       </div>
//                     </td>
//                     <td className="px-5 py-4 text-xs">
//                       <div className="flex items-center gap-1.5">
//                         <span className="text-muted-foreground w-3">L:</span>{" "}
//                         <span className="font-medium">
//                           {new Date(report.loadDate).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <div className="flex items-center gap-1.5 mt-1">
//                         <span className="text-muted-foreground w-3">H:</span>{" "}
//                         <span className="font-medium">
//                           {report.harvestDate
//                             ? new Date(report.harvestDate).toLocaleDateString()
//                             : "-"}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-5 py-4 text-right font-medium text-base">
//                       {report.quantity.toLocaleString()}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold text-red-600 dark:text-red-400 text-base">
//                       {report.farmMortality.toLocaleString()}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-500 text-base">
//                       {report.actualHarvest.toLocaleString()}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold text-primary text-base">
//                       {report.percentHarvest.toFixed(2)}%
//                     </td>
//                     <td className="px-5 py-4 text-right font-medium">
//                       ₱
//                       {Number(report.sellingPrice).toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td className="px-5 py-4 text-right font-medium text-amber-600 dark:text-amber-500">
//                       ₱
//                       {report.totalGrossCost.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold text-amber-600 dark:text-amber-500 text-base">
//                       ₱
//                       {report.actualCostPerChick.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td className="px-5 py-4 text-right font-bold text-primary text-base">
//                       ₱
//                       {report.totalRtlAmount.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td
//                       className={`px-5 py-4 text-right font-bold text-base ${report.totalNetSales >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
//                     >
//                       ₱
//                       {report.totalNetSales.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { db } from "../../src";
import {
  loads,
  buildings,
  farms,
  dailyRecords,
  expenses,
} from "../../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { FileBarChart } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // 1. Fetch ALL Loads (Now including chickType!)
  const allLoadsData = await db
    .select({
      id: loads.id,
      farmId: farms.id,
      farmName: farms.name,
      buildingName: buildings.name,
      chickType: loads.chickType, // <-- Added this
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
    .orderBy(desc(loads.isActive), desc(loads.loadDate));

  const allDailyRecords = await db.select().from(dailyRecords);
  const allExpenses = await db.select().from(expenses);

  // 2. THE NUMBER CRUNCHING ENGINE
  const reports = allLoadsData.map((load) => {
    const actualQuantityLoad = load.quantity;
    const sellingPrice = Number(load.sellingPrice) || 0;

    const loadRecords = allDailyRecords.filter((r) => r.loadId === load.id);
    const farmMortality = loadRecords.reduce((sum, r) => sum + r.mortality, 0);

    const actualHarvest = actualQuantityLoad - farmMortality;
    const percentHarvest =
      actualQuantityLoad > 0 ? (actualHarvest / actualQuantityLoad) * 100 : 0;

    const directExpenses = allExpenses
      .filter((e) => e.loadId === load.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const farmActiveLoadsCount =
      allLoadsData.filter((l) => l.farmId === load.farmId && l.isActive)
        .length || 1;
    const sharedExpensesTotal = allExpenses
      .filter((e) => e.farmId === load.farmId && e.loadId === null)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const sharedExpenseShare = sharedExpensesTotal / farmActiveLoadsCount;

    const totalGrossCost =
      directExpenses + sharedExpenseShare + Number(load.initialCapital);
    const actualCostPerChick =
      actualHarvest > 0 ? totalGrossCost / actualHarvest : 0;

    const totalRtlAmount = actualHarvest * sellingPrice;
    const totalNetSales = totalRtlAmount - totalGrossCost;

    return {
      ...load,
      farmMortality,
      actualHarvest,
      percentHarvest,
      totalGrossCost,
      actualCostPerChick,
      totalRtlAmount,
      totalNetSales,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full mx-auto pb-12 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background/50 backdrop-blur-xl p-6 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-8 w-8 text-primary" />
            Master Production Ledger
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time financial analytics, mortality tracking, and automated
            cost distribution.
          </p>
        </div>
      </div>

      {/* Data Table */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/50 border border-dashed border-border/50 rounded-2xl">
          <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">No Active Data</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-sm">
            Load chicks into a building to start seeing automated reports.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[12px] text-muted-foreground uppercase bg-secondary/20 border-b border-border/50">
                <tr>
                  <th className="px-5 py-4 font-bold tracking-wider">
                    Location, Type & Status
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider">Dates</th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right">
                    Start Qty
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-red-500">
                    Mortality
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-emerald-600 dark:text-emerald-500">
                    Actual Harvest
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-primary">
                    % Harvest
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right">
                    Selling Price
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-amber-600 dark:text-amber-500">
                    Gross Cost
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-amber-600 dark:text-amber-500">
                    Cost/Chick
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right text-primary">
                    Total RTL
                  </th>
                  <th className="px-5 py-4 font-bold tracking-wider text-right">
                    Net Sales
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-secondary/10 transition-colors ${!report.isActive ? "bg-secondary/5 opacity-70 grayscale-20" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-base">
                          {report.buildingName}
                        </span>
                        {report.isActive ? (
                          <span
                            className="relative flex h-2.5 w-2.5"
                            title="Active"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        ) : (
                          <span
                            className="h-2 w-2 rounded-full bg-muted-foreground"
                            title="Harvested"
                          ></span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-primary/80">
                        {report.chickType || "Standard"}
                      </div>{" "}
                      {/* CHICK TYPE DISPLAYED HERE */}
                      <div className="text-xs text-muted-foreground">
                        {report.farmName}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate max-w-[120px]">
                        {report.customerName || "No Customer"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground w-3">L:</span>{" "}
                        <span className="font-medium">
                          {new Date(report.loadDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-muted-foreground w-3">H:</span>{" "}
                        <span className="font-medium">
                          {report.harvestDate
                            ? new Date(report.harvestDate).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-base">
                      {report.quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-red-600 dark:text-red-400 text-base">
                      {report.farmMortality.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-500 text-base">
                      {report.actualHarvest.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-primary text-base">
                      {report.percentHarvest.toFixed(2)}%
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      ₱
                      {Number(report.sellingPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-amber-600 dark:text-amber-500">
                      ₱
                      {report.totalGrossCost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-amber-600 dark:text-amber-500 text-base">
                      ₱
                      {report.actualCostPerChick.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-primary text-base">
                      ₱
                      {report.totalRtlAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-bold text-base ${report.totalNetSales >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      ₱
                      {report.totalNetSales.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
