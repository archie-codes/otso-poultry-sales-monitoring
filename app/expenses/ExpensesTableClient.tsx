// "use client";

// import { useState, useTransition } from "react";
// import { useRouter, useSearchParams, usePathname } from "next/navigation";
// import {
//   Calendar as CalendarIcon,
//   Users,
//   Filter,
//   X,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
//   Check,
//   ChevronsUpDown,
//   Building2,
//   Home,
//   PieChart,
//   ChevronDown,
//   MoreVertical,
//   Printer,
//   Download,
//   Layers, // <--- IMPORTED FOR LOAD ICON
// } from "lucide-react";
// import { format, parseISO } from "date-fns";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// const categories = [
//   { label: "Labor / Salary", value: "labor" },
//   { label: "Feeds", value: "feeds" },
//   { label: "Medicine", value: "medicine" },
//   { label: "Vaccine", value: "vaccine" },
//   { label: "Antibiotics", value: "antibiotics" },
//   { label: "Electricity", value: "electricity" },
//   { label: "Water", value: "water" },
//   { label: "Fuel", value: "fuel" },
//   { label: "Maintenance", value: "maintenance" },
//   { label: "Miscellaneous", value: "miscellaneous" },
// ];

// export default function ExpensesTableClient({
//   history,
//   fullHistory,
//   farms,
//   buildings,
//   loads = [], // <--- NEW PROP FOR LOADS
//   totalPages,
//   currentPage,
// }: {
//   history: any[];
//   fullHistory: any[];
//   farms: string[];
//   buildings: string[];
//   loads?: { id: number; name: string }[]; // <--- STRONGLY TYPED
//   totalPages: number;
//   currentPage: number;
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const pathname = usePathname();
//   const [isPending, startTransition] = useTransition();

//   const [openFarm, setOpenFarm] = useState(false);
//   const [openBuilding, setOpenBuilding] = useState(false);
//   const [openLoad, setOpenLoad] = useState(false); // <--- NEW STATE
//   const [openCat, setOpenCat] = useState(false);
//   const [openDate, setOpenDate] = useState(false);

//   const selectedFarm = searchParams.get("farm") || "all";
//   const selectedBuilding = searchParams.get("building") || "all";
//   const selectedLoad = searchParams.get("load") || "all"; // <--- NEW PARAMS
//   const selectedType = searchParams.get("type") || "all";
//   const selectedDateParam = searchParams.get("date");

//   const dateValue = selectedDateParam ? parseISO(selectedDateParam) : undefined;

//   const hasActiveFilters =
//     selectedFarm !== "all" ||
//     selectedBuilding !== "all" ||
//     selectedLoad !== "all" ||
//     selectedType !== "all" ||
//     !!selectedDateParam;

//   const updateFilter = (key: string, value: string) => {
//     const params = new URLSearchParams(searchParams.toString());
//     if (value === "all" || value === "") {
//       params.delete(key);
//       if (key === "farm") {
//         params.delete("building");
//         params.delete("load");
//       }
//       if (key === "building") {
//         params.delete("load");
//       }
//     } else {
//       params.set(key, value);
//       if (key === "farm") {
//         params.delete("building");
//         params.delete("load");
//       }
//       if (key === "building") {
//         params.delete("load");
//       }
//     }
//     params.set("page", "1");
//     startTransition(() => {
//       router.push(`?${params.toString()}`, { scroll: false });
//     });
//   };

//   const resetFilters = () => {
//     startTransition(() => {
//       router.push(pathname, { scroll: false });
//     });
//   };

//   const goToPage = (page: number) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("page", String(page));
//     startTransition(() => {
//       router.push(`?${params.toString()}`, { scroll: false });
//     });
//   };

//   const selectedLoadObject = loads.find((l) => String(l.id) === selectedLoad);
//   const displayLoadName = selectedLoadObject
//     ? selectedLoadObject.name
//     : "ALL BATCHES";

//   // =========================================================================
//   // EXPORTS GENERATION
//   // =========================================================================
//   const formatMoney = (amount: number | string) =>
//     `₱${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

//   const formatMoneyPDF = (amount: number | string) =>
//     `PHP ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

//   const generatePDF = () => {
//     const doc = new jsPDF("landscape");
//     doc.setFontSize(18);
//     doc.setFont("helvetica", "bold");
//     doc.text("Otso Poultry Farm", 14, 20);
//     doc.setFontSize(14);
//     doc.text("Official Financial Ledger", 14, 28);

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(`Print Date: ${format(new Date(), "MMMM d, yyyy")}`, 14, 36);

//     let filterText = "Filters Applied: ";
//     filterText += `Farm: ${selectedFarm === "all" ? "All" : selectedFarm} | `;
//     filterText += `Building: ${selectedBuilding === "all" ? "All" : selectedBuilding} | `;
//     filterText += `Batch: ${selectedLoad === "all" ? "All" : displayLoadName} | `;
//     filterText += `Type: ${selectedType === "all" ? "All" : selectedType} | `;
//     filterText += `Date: ${dateValue ? format(dateValue, "MMM d, yyyy") : "All"}`;
//     doc.text(filterText, 14, 42);

//     const tableColumn = [
//       "Date",
//       "Target Location",
//       "Category",
//       "Details / Item",
//       "Staff",
//       "Amount",
//     ];
//     const tableRows: any[] = [];

//     let totalExportAmount = 0;

//     fullHistory.forEach((r) => {
//       totalExportAmount += Number(r.amount);
//       const target = r.loadId
//         ? `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`
//         : `${r.farmName} (Shared Cost)`;

//       const cleanRemarks = r.remarks
//         ? r.remarks.replace(/±/g, "PHP ").replace(/\+=/g, "PHP ")
//         : "-";

//       tableRows.push([
//         format(new Date(r.date), "MMM d, yyyy"),
//         target,
//         r.type,
//         cleanRemarks,
//         r.staffName || "System",
//         formatMoneyPDF(r.amount),
//       ]);
//     });

//     autoTable(doc, {
//       startY: 48,
//       head: [tableColumn],
//       body: tableRows,
//       foot: [
//         ["GRAND TOTAL", "", "", "", "", formatMoneyPDF(totalExportAmount)],
//       ],
//       theme: "grid",
//       headStyles: { fillColor: [220, 38, 38] },
//       footStyles: {
//         fillColor: [241, 245, 249],
//         textColor: [15, 23, 42],
//         fontStyle: "bold",
//       },
//       styles: { fontSize: 8 },
//     });

//     doc.save(`Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
//   };

//   const downloadCSV = () => {
//     let csv = "Date,Target Location,Category,Details / Item,Staff,Amount\n";
//     let totalExportAmount = 0;

//     fullHistory.forEach((r) => {
//       totalExportAmount += Number(r.amount);
//       const target = r.loadId
//         ? `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`
//         : `${r.farmName} (Shared Cost)`;
//       const cleanDate = format(new Date(r.date), "MM/dd/yyyy");

//       const cleanRemarks = r.remarks
//         ? r.remarks.replace(/±/g, "₱").replace(/\+=/g, "₱")
//         : "-";

//       csv += `"${cleanDate}","${target}","${r.type}","${cleanRemarks}","${r.staffName || "System"}",${r.amount}\n`;
//     });

//     csv += `\n"GRAND TOTAL","","","","",${totalExportAmount}\n`;

//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.setAttribute("href", url);
//     link.setAttribute(
//       "download",
//       `Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.csv`,
//     );
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
//       <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
//         <div className="flex items-center gap-3 shrink-0">
//           <h2 className="font-bold text-foreground text-md uppercase tracking-tight">
//             Transaction History
//           </h2>
//           {isPending && (
//             <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
//           )}
//         </div>

//         <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
//           <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openDate} onOpenChange={setOpenDate}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className={cn(
//                     "w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]",
//                     !selectedDateParam && "text-slate-500",
//                   )}
//                 >
//                   <div className="flex items-center truncate">
//                     <CalendarIcon className="w-3 h-3 mr-1.5 shrink-0" />
//                     {dateValue ? format(dateValue, "MMM d, yy") : "DATE"}
//                   </div>
//                   <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent
//                 className="w-auto p-0 rounded-xl shadow-xl border-border"
//                 align="start"
//               >
//                 <Calendar
//                   mode="single"
//                   selected={dateValue}
//                   onSelect={(date) => {
//                     updateFilter(
//                       "date",
//                       date ? format(date, "yyyy-MM-dd") : "all",
//                     );
//                     setOpenDate(false);
//                   }}
//                   initialFocus
//                   disabled={(date) => date > new Date()}
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openFarm} onOpenChange={setOpenFarm}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
//                 >
//                   <div className="flex items-center truncate">
//                     <Building2 className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
//                     <span className="truncate">
//                       {selectedFarm === "all" ? "FARM" : selectedFarm}
//                     </span>
//                   </div>
//                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
//                 <Command>
//                   <CommandInput placeholder="Search farm..." />
//                   <CommandList className="max-h-[250px]">
//                     <CommandEmpty className="py-4 text-xs text-center">
//                       No farm found.
//                     </CommandEmpty>
//                     <CommandGroup>
//                       <CommandItem
//                         onSelect={() => {
//                           updateFilter("farm", "all");
//                           setOpenFarm(false);
//                         }}
//                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-3.5 w-3.5",
//                             selectedFarm === "all"
//                               ? "opacity-100 text-red-600"
//                               : "opacity-0",
//                           )}
//                         />{" "}
//                         ALL FARMS
//                       </CommandItem>
//                       {farms.map((f) => (
//                         <CommandItem
//                           key={f}
//                           onSelect={() => {
//                             updateFilter("farm", f);
//                             setOpenFarm(false);
//                           }}
//                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-3.5 w-3.5",
//                               selectedFarm === f
//                                 ? "opacity-100 text-red-600"
//                                 : "opacity-0",
//                             )}
//                           />{" "}
//                           {f}
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   disabled={selectedFarm === "all"}
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
//                 >
//                   <div className="flex items-center truncate">
//                     <Home className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
//                     <span className="truncate">
//                       {selectedBuilding === "all"
//                         ? "BUILDING"
//                         : selectedBuilding}
//                     </span>
//                   </div>
//                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
//                 <Command>
//                   <CommandInput placeholder="Search building..." />
//                   <CommandList className="max-h-[250px]">
//                     <CommandEmpty className="py-4 text-xs text-center">
//                       No building found.
//                     </CommandEmpty>
//                     <CommandGroup>
//                       <CommandItem
//                         onSelect={() => {
//                           updateFilter("building", "all");
//                           setOpenBuilding(false);
//                         }}
//                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-3.5 w-3.5",
//                             selectedBuilding === "all"
//                               ? "opacity-100 text-red-600"
//                               : "opacity-0",
//                           )}
//                         />{" "}
//                         ALL BUILDINGS
//                       </CommandItem>
//                       {buildings.map((b) => (
//                         <CommandItem
//                           key={b}
//                           onSelect={() => {
//                             updateFilter("building", b);
//                             setOpenBuilding(false);
//                           }}
//                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-3.5 w-3.5",
//                               selectedBuilding === b
//                                 ? "opacity-100 text-red-600"
//                                 : "opacity-0",
//                             )}
//                           />{" "}
//                           {b}
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>

//           {/* ---> NEW: BATCH/LOAD FILTER <--- */}
//           <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openLoad} onOpenChange={setOpenLoad}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   // Optional: Disabled if building isn't selected, but since expenses are tied to loads, you can leave it active
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
//                 >
//                   <div className="flex items-center truncate">
//                     <Layers className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
//                     <span className="truncate">
//                       {selectedLoad === "all" ? "BATCH" : displayLoadName}
//                     </span>
//                   </div>
//                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
//                 <Command>
//                   <CommandInput placeholder="Search batch..." />
//                   <CommandList className="max-h-[250px]">
//                     <CommandEmpty className="py-4 text-xs text-center">
//                       No batch found.
//                     </CommandEmpty>
//                     <CommandGroup>
//                       <CommandItem
//                         onSelect={() => {
//                           updateFilter("load", "all");
//                           setOpenLoad(false);
//                         }}
//                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-3.5 w-3.5",
//                             selectedLoad === "all"
//                               ? "opacity-100 text-red-600"
//                               : "opacity-0",
//                           )}
//                         />{" "}
//                         ALL BATCHES
//                       </CommandItem>
//                       {loads.map((l) => (
//                         <CommandItem
//                           key={String(l.id)}
//                           onSelect={() => {
//                             updateFilter("load", String(l.id));
//                             setOpenLoad(false);
//                           }}
//                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-3.5 w-3.5",
//                               selectedLoad === String(l.id)
//                                 ? "opacity-100 text-red-600"
//                                 : "opacity-0",
//                             )}
//                           />{" "}
//                           {l.name}
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openCat} onOpenChange={setOpenCat}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
//                 >
//                   <div className="flex items-center truncate">
//                     <PieChart className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
//                     <span className="truncate">
//                       {selectedType === "all" ? "CATEGORY" : selectedType}
//                     </span>
//                   </div>
//                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
//                 <Command>
//                   <CommandInput placeholder="Search category..." />
//                   <CommandList>
//                     <CommandGroup>
//                       <CommandItem
//                         onSelect={() => {
//                           updateFilter("type", "all");
//                           setOpenCat(false);
//                         }}
//                         className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-3.5 w-3.5",
//                             selectedType === "all"
//                               ? "opacity-100 text-red-600"
//                               : "opacity-0",
//                           )}
//                         />{" "}
//                         ALL CATEGORIES
//                       </CommandItem>
//                       {categories.map((cat) => (
//                         <CommandItem
//                           key={cat.value}
//                           onSelect={() => {
//                             updateFilter("type", cat.value);
//                             setOpenCat(false);
//                           }}
//                           className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-3.5 w-3.5",
//                               selectedType === cat.value
//                                 ? "opacity-100 text-red-600"
//                                 : "opacity-0",
//                             )}
//                           />{" "}
//                           {cat.label}
//                         </CommandItem>
//                       ))}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>

//           {hasActiveFilters && (
//             <Button
//               variant="ghost"
//               onClick={resetFilters}
//               className="h-10 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
//             >
//               <X className="w-3.5 h-3.5 mr-1" /> Reset
//             </Button>
//           )}

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-10 w-10 sm:h-10 sm:w-10 rounded-xl hover:bg-secondary shrink-0 border border-border/50 bg-white dark:bg-slate-950 shadow-sm ml-auto"
//               >
//                 <MoreVertical className="h-5 w-5" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent
//               align="end"
//               className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
//             >
//               <DropdownMenuItem
//                 onClick={generatePDF}
//                 className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//               >
//                 <Printer className="w-4 h-4 text-blue-600" /> Download PDF
//                 Report
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={downloadCSV}
//                 className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//               >
//                 <Download className="w-4 h-4 text-emerald-600" /> Download Excel
//                 (CSV)
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       {/* 2. TABLE */}
//       <div
//         className={cn(
//           "overflow-x-auto custom-scrollbar transition-opacity duration-300 min-h-[400px]",
//           isPending && "opacity-50 pointer-events-none",
//         )}
//       >
//         <table className="w-full text-sm text-left">
//           <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
//             <tr>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
//                 Date
//               </th>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
//                 Target
//               </th>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center whitespace-nowrap">
//                 Type
//               </th>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
//                 Details / Item
//               </th>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-right whitespace-nowrap">
//                 Amount (₱)
//               </th>
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
//                 Staff
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-border/50">
//             {history.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={6}
//                   className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
//                 >
//                   <div className="flex flex-col items-center gap-2">
//                     <Filter className="w-8 h-8" />
//                     No records match your filters.
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               history.map((record) => (
//                 <tr
//                   key={record.id}
//                   className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
//                     {format(new Date(record.date), "MMM d, yyyy")}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="font-black text-foreground block uppercase text-xs">
//                       {record.farmName}
//                     </span>
//                     <span className="block text-[10px] font-bold uppercase tracking-widest mt-1">
//                       {record.loadId ? (
//                         <div className="flex flex-col">
//                           <span className="text-slate-500 dark:text-slate-400">
//                             {record.buildingName}
//                           </span>
//                           <span className="text-blue-500 mt-0.5">
//                             {record.loadName || `Load ${record.loadId}`}
//                           </span>
//                         </div>
//                       ) : (
//                         <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
//                           <Users className="w-3 h-3" /> Farm-Wide Shared Cost
//                         </span>
//                       )}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-center">
//                     <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-foreground">
//                       {record.type}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-slate-600 dark:text-slate-400">
//                     {record.remarks
//                       ? record.remarks.replace(/±/g, "₱").replace(/\+=/g, "₱")
//                       : "-"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap font-black text-red-600 dark:text-red-400 text-right text-base">
//                     {Number(record.amount).toLocaleString("en-US", {
//                       minimumFractionDigits: 2,
//                     })}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-muted-foreground uppercase text-right tracking-widest">
//                     {record.staffName || "Unknown"}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* 3. PAGINATION */}
//       <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
//         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
//           Page {currentPage} / {totalPages || 1}
//         </p>
//         <div className="flex items-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => goToPage(currentPage - 1)}
//             disabled={currentPage <= 1 || isPending}
//             className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
//           >
//             <ChevronLeft className="w-4 h-4 mr-1" /> Prev
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => goToPage(currentPage + 1)}
//             disabled={currentPage >= totalPages || isPending}
//             className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
//           >
//             Next <ChevronRight className="w-4 h-4 ml-1" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Users,
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Building2,
  Home,
  PieChart,
  ChevronDown,
  MoreVertical,
  Printer,
  Download,
  Layers,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { label: "Labor / Salary", value: "labor" },
  { label: "Feeds", value: "feeds" },
  { label: "Medicine", value: "medicine" },
  { label: "Vaccine", value: "vaccine" },
  { label: "Antibiotics", value: "antibiotics" },
  { label: "Electricity", value: "electricity" },
  { label: "Water", value: "water" },
  { label: "Fuel", value: "fuel" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Miscellaneous", value: "miscellaneous" },
];

export default function ExpensesTableClient({
  history,
  fullHistory,
  farms,
  buildings,
  loads = [],
  totalPages,
  currentPage,
}: {
  history: any[];
  fullHistory: any[];
  farms: string[];
  buildings: string[];
  loads?: { id: number; name: string }[];
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [openFarm, setOpenFarm] = useState(false);
  const [openBuilding, setOpenBuilding] = useState(false);
  const [openLoad, setOpenLoad] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  const selectedFarm = searchParams.get("farm") || "all";
  const selectedBuilding = searchParams.get("building") || "all";
  const selectedLoad = searchParams.get("load") || "all";
  const selectedType = searchParams.get("type") || "all";
  const selectedDateParam = searchParams.get("date");

  const dateValue = selectedDateParam ? parseISO(selectedDateParam) : undefined;

  const hasActiveFilters =
    selectedFarm !== "all" ||
    selectedBuilding !== "all" ||
    selectedLoad !== "all" ||
    selectedType !== "all" ||
    !!selectedDateParam;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
      if (key === "farm") {
        params.delete("building");
        params.delete("load");
      }
      if (key === "building") {
        params.delete("load");
      }
    } else {
      params.set(key, value);
      if (key === "farm") {
        params.delete("building");
        params.delete("load");
      }
      if (key === "building") {
        params.delete("load");
      }
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const selectedLoadObject = loads.find((l) => String(l.id) === selectedLoad);
  const displayLoadName = selectedLoadObject
    ? selectedLoadObject.name
    : "ALL BATCHES";

  const formatMoney = (amount: number | string) =>
    `₱${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatMoneyPDF = (amount: number | string) =>
    `PHP ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const generatePDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Otso Poultry Farm", 14, 20);
    doc.setFontSize(14);
    doc.text("Official Financial Ledger", 14, 28);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Print Date: ${format(new Date(), "MMMM d, yyyy")}`, 14, 36);

    let filterText = "Filters Applied: ";
    filterText += `Farm: ${selectedFarm === "all" ? "All" : selectedFarm} | `;
    filterText += `Building: ${selectedBuilding === "all" ? "All" : selectedBuilding} | `;
    filterText += `Batch: ${selectedLoad === "all" ? "All" : displayLoadName} | `;
    filterText += `Type: ${selectedType === "all" ? "All" : selectedType} | `;
    filterText += `Date: ${dateValue ? format(dateValue, "MMM d, yyyy") : "All"}`;
    doc.text(filterText, 14, 42);

    const tableColumn = [
      "Date",
      "Target Location",
      "Category",
      "Details / Item",
      "Staff",
      "Amount",
    ];
    const tableRows: any[] = [];

    let totalExportAmount = 0;

    fullHistory.forEach((r) => {
      totalExportAmount += Number(r.amount);

      // ---> THE FIX: Include shared building names in the PDF export <---
      let target = "";
      if (r.loadId) {
        target = `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`;
      } else if (r.sharedWith && r.sharedWith.length > 0) {
        target = `${r.farmName} (Split: ${r.sharedWith.join(", ")})`;
      } else {
        target = `${r.farmName} (Shared Cost)`;
      }

      const cleanRemarks = r.remarks
        ? r.remarks.replace(/±/g, "PHP ").replace(/\+=/g, "PHP ")
        : "-";

      tableRows.push([
        format(new Date(r.date), "MMM d, yyyy"),
        target,
        r.type,
        cleanRemarks,
        r.staffName || "System",
        formatMoneyPDF(r.amount),
      ]);
    });

    autoTable(doc, {
      startY: 48,
      head: [tableColumn],
      body: tableRows,
      foot: [
        ["GRAND TOTAL", "", "", "", "", formatMoneyPDF(totalExportAmount)],
      ],
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      styles: { fontSize: 8 },
    });

    doc.save(`Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const downloadCSV = () => {
    let csv = "Date,Target Location,Category,Details / Item,Staff,Amount\n";
    let totalExportAmount = 0;

    fullHistory.forEach((r) => {
      totalExportAmount += Number(r.amount);

      // ---> THE FIX: Include shared building names in the CSV export <---
      let target = "";
      if (r.loadId) {
        target = `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`;
      } else if (r.sharedWith && r.sharedWith.length > 0) {
        target = `${r.farmName} (Split: ${r.sharedWith.join(" | ")})`;
      } else {
        target = `${r.farmName} (Shared Cost)`;
      }

      const cleanDate = format(new Date(r.date), "MM/dd/yyyy");
      const cleanRemarks = r.remarks
        ? r.remarks.replace(/±/g, "₱").replace(/\+=/g, "₱")
        : "-";

      csv += `"${cleanDate}","${target}","${r.type}","${cleanRemarks}","${r.staffName || "System"}",${r.amount}\n`;
    });

    csv += `\n"GRAND TOTAL","","","","",${totalExportAmount}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
      <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="font-bold text-foreground text-md uppercase tracking-tight">
            Transaction History
          </h2>
          {isPending && (
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]",
                    !selectedDateParam && "text-slate-500",
                  )}
                >
                  <div className="flex items-center truncate">
                    <CalendarIcon className="w-3 h-3 mr-1.5 shrink-0" />
                    {dateValue ? format(dateValue, "MMM d, yy") : "DATE"}
                  </div>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl shadow-xl border-border"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    updateFilter(
                      "date",
                      date ? format(date, "yyyy-MM-dd") : "all",
                    );
                    setOpenDate(false);
                  }}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <Building2 className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedFarm === "all" ? "FARM" : selectedFarm}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No farm found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("farm", "all");
                          setOpenFarm(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedFarm === "all"
                              ? "opacity-100 text-red-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL FARMS
                      </CommandItem>
                      {farms.map((f) => (
                        <CommandItem
                          key={f}
                          onSelect={() => {
                            updateFilter("farm", f);
                            setOpenFarm(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedFarm === f
                                ? "opacity-100 text-red-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {f}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all"}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Home className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedBuilding === "all"
                        ? "BUILDING"
                        : selectedBuilding}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search building..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No building found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("building", "all");
                          setOpenBuilding(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedBuilding === "all"
                              ? "opacity-100 text-red-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL BUILDINGS
                      </CommandItem>
                      {buildings.map((b) => (
                        <CommandItem
                          key={b}
                          onSelect={() => {
                            updateFilter("building", b);
                            setOpenBuilding(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedBuilding === b
                                ? "opacity-100 text-red-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {b}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openLoad} onOpenChange={setOpenLoad}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Layers className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedLoad === "all" ? "BATCH" : displayLoadName}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search batch..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No batch found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("load", "all");
                          setOpenLoad(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedLoad === "all"
                              ? "opacity-100 text-red-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL BATCHES
                      </CommandItem>
                      {loads.map((l) => (
                        <CommandItem
                          key={String(l.id)}
                          onSelect={() => {
                            updateFilter("load", String(l.id));
                            setOpenLoad(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedLoad === String(l.id)
                                ? "opacity-100 text-red-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {l.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openCat} onOpenChange={setOpenCat}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <PieChart className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedType === "all" ? "CATEGORY" : selectedType}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search category..." />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("type", "all");
                          setOpenCat(false);
                        }}
                        className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedType === "all"
                              ? "opacity-100 text-red-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL CATEGORIES
                      </CommandItem>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.value}
                          onSelect={() => {
                            updateFilter("type", cat.value);
                            setOpenCat(false);
                          }}
                          className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedType === cat.value
                                ? "opacity-100 text-red-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {cat.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-10 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
            >
              <DropdownMenuItem
                onClick={generatePDF}
                className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadCSV}
                className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" /> Download Excel
                (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. TABLE */}
      <div
        className={cn(
          "overflow-x-auto custom-scrollbar transition-opacity duration-300 min-h-[400px]",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Target
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center whitespace-nowrap">
                Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Details / Item
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-right whitespace-nowrap">
                Amount (₱)
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                Staff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8" /> No records match your
                    filters.
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-black text-foreground block uppercase text-xs">
                      {record.farmName}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest mt-1">
                      {record.loadId ? (
                        <div className="flex flex-col">
                          <span className="text-slate-500 dark:text-slate-400">
                            {record.buildingName}
                          </span>
                          <span className="text-blue-500 mt-0.5">
                            {record.loadName || `Load ${record.loadId}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          {/* ---> THE FIX: Display the Active Buildings that share this cost <--- */}
                          <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                            <Users className="w-3 h-3" /> Farm-Wide Shared Cost
                          </span>
                          {record.sharedWith &&
                            record.sharedWith.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[8px] text-slate-400 dark:text-slate-500">
                                  SPLIT:
                                </span>
                                {record.sharedWith.map((bName: string) => (
                                  <span
                                    key={bName}
                                    className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded"
                                  >
                                    {bName}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-foreground">
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {record.remarks
                      ? record.remarks.replace(/±/g, "₱").replace(/\+=/g, "₱")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-red-600 dark:text-red-400 text-right text-base">
                    {Number(record.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-muted-foreground uppercase text-right tracking-widest">
                    {record.staffName || "Unknown"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. PAGINATION */}
      <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Page {currentPage} / {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
