// // "use client";

// // import { useState, useTransition } from "react";
// // import { useRouter, useSearchParams, usePathname } from "next/navigation";
// // import {
// //   Calendar as CalendarIcon,
// //   Users,
// //   Filter,
// //   X,
// //   Loader2,
// //   ChevronLeft,
// //   ChevronRight,
// //   Check,
// //   ChevronsUpDown,
// //   Building2,
// //   Home,
// //   PieChart,
// //   ChevronDown,
// //   MoreVertical,
// //   Printer,
// //   ListFilter,
// //   Layers,
// // } from "lucide-react";
// // import { format, parseISO } from "date-fns";
// // import jsPDF from "jspdf";
// // import autoTable from "jspdf-autotable";
// // import { cn } from "@/lib/utils";
// // import { Button } from "@/components/ui/button";
// // import { Calendar } from "@/components/ui/calendar";
// // import {
// //   Popover,
// //   PopoverContent,
// //   PopoverTrigger,
// // } from "@/components/ui/popover";
// // import {
// //   Command,
// //   CommandEmpty,
// //   CommandGroup,
// //   CommandInput,
// //   CommandItem,
// //   CommandList,
// // } from "@/components/ui/command";
// // import {
// //   DropdownMenu,
// //   DropdownMenuContent,
// //   DropdownMenuItem,
// //   DropdownMenuTrigger,
// // } from "@/components/ui/dropdown-menu";

// // // Import your action components
// // import EditExpenseModal from "./EditExpenseModal";
// // import DeleteExpenseButton from "./DeleteExpenseButton";

// // const categories = [
// //   { label: "Labor / Salary", value: "labor" },
// //   { label: "Feeds", value: "feeds" },
// //   { label: "Medicine", value: "medicine" },
// //   { label: "Vaccine", value: "vaccine" },
// //   { label: "Antibiotics", value: "antibiotics" },
// //   { label: "Electricity", value: "electricity" },
// //   { label: "Water", value: "water" },
// //   { label: "Fuel", value: "fuel" },
// //   { label: "Maintenance", value: "maintenance" },
// //   { label: "Miscellaneous", value: "miscellaneous" },
// // ];

// // export default function ExpensesTableClient({
// //   history,
// //   fullHistory,
// //   farms,
// //   buildings,
// //   loads = [],
// //   totalPages,
// //   currentPage,
// // }: {
// //   history: any[];
// //   fullHistory: any[];
// //   farms: string[];
// //   buildings: string[];
// //   loads?: any[];
// //   totalPages: number;
// //   currentPage: number;
// // }) {
// //   const router = useRouter();
// //   const searchParams = useSearchParams();
// //   const pathname = usePathname();
// //   const [isPending, startTransition] = useTransition();

// //   const [openFarm, setOpenFarm] = useState(false);
// //   const [openBuilding, setOpenBuilding] = useState(false);
// //   const [openLoad, setOpenLoad] = useState(false);
// //   const [openCat, setOpenCat] = useState(false);
// //   const [openDate, setOpenDate] = useState(false);

// //   const selectedFarm = searchParams.get("farm") || "all";
// //   const selectedBuilding = searchParams.get("building") || "all";
// //   const selectedLoad = searchParams.get("load") || "all";
// //   const selectedType = searchParams.get("type") || "all";
// //   const selectedDateParam = searchParams.get("date");

// //   const dateValue = selectedDateParam ? parseISO(selectedDateParam) : undefined;

// //   const hasActiveFilters =
// //     selectedFarm !== "all" ||
// //     selectedBuilding !== "all" ||
// //     selectedLoad !== "all" ||
// //     selectedType !== "all" ||
// //     !!selectedDateParam;

// //   const updateFilter = (key: string, value: string) => {
// //     const params = new URLSearchParams(searchParams.toString());
// //     if (value === "all" || value === "") {
// //       params.delete(key);
// //       if (key === "farm") {
// //         params.delete("building");
// //         params.delete("load");
// //       }
// //       if (key === "building") {
// //         params.delete("load");
// //       }
// //     } else {
// //       params.set(key, value);
// //       if (key === "farm") {
// //         params.delete("building");
// //         params.delete("load");
// //       }
// //       if (key === "building") {
// //         params.delete("load");
// //       }
// //     }
// //     params.set("page", "1");
// //     startTransition(() => {
// //       router.push(`?${params.toString()}`, { scroll: false });
// //     });
// //   };

// //   const resetFilters = () => {
// //     startTransition(() => {
// //       router.push(pathname, { scroll: false });
// //     });
// //   };

// //   const goToPage = (page: number) => {
// //     const params = new URLSearchParams(searchParams.toString());
// //     params.set("page", String(page));
// //     startTransition(() => {
// //       router.push(`?${params.toString()}`, { scroll: false });
// //     });
// //   };

// //   const selectedLoadObject = loads.find((l) => String(l.id) === selectedLoad);
// //   const displayLoadName = selectedLoadObject
// //     ? selectedLoadObject.name
// //     : "ALL BATCHES";

// //   const formatMoney = (amount: number | string) =>
// //     `₱${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// //   const formatMoneyPDF = (amount: number | string) =>
// //     `PHP ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// //   const generatePDF = () => {
// //     const doc = new jsPDF("landscape");
// //     doc.setFontSize(18);
// //     doc.setFont("helvetica", "bold");
// //     doc.text("Otso Poultry Farm", 14, 20);
// //     doc.setFontSize(14);
// //     doc.text("Official Financial Ledger", 14, 28);

// //     doc.setFontSize(10);
// //     doc.setFont("helvetica", "normal");
// //     doc.text(`Print Date: ${format(new Date(), "MMMM d, yyyy")}`, 14, 36);

// //     let filterText = "Filters Applied: ";
// //     filterText += `Farm: ${selectedFarm === "all" ? "All" : selectedFarm} | `;
// //     filterText += `Building: ${selectedBuilding === "all" ? "All" : selectedBuilding} | `;
// //     filterText += `Batch: ${selectedLoad === "all" ? "All" : displayLoadName} | `;
// //     filterText += `Type: ${selectedType === "all" ? "All" : selectedType} | `;
// //     filterText += `Date: ${dateValue ? format(dateValue, "MMM d, yyyy") : "All"}`;
// //     doc.text(filterText, 14, 42);

// //     const tableColumn = [
// //       "Date",
// //       "Target Location",
// //       "Category",
// //       "Details / Item",
// //       "Staff",
// //       "Amount",
// //     ];
// //     const tableRows: any[] = [];

// //     let totalExportAmount = 0;

// //     fullHistory.forEach((r) => {
// //       totalExportAmount += Number(r.amount);

// //       let target = "";
// //       if (r.loadId) {
// //         target = `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`;
// //       } else if (r.sharedWith && r.sharedWith.length > 0) {
// //         target = `${r.farmName} (Split: ${r.sharedWith.join(", ")})`;
// //       } else {
// //         target = `${r.farmName} (Shared Cost)`;
// //       }

// //       let cleanRemarks = r.remarks ? r.remarks.replace(/[₱±]/g, "PHP ") : "-";

// //       // 2. Force a new line right before "Total Loaded:" or "Total Added:"
// //       cleanRemarks = cleanRemarks.replace(
// //         /\.\s*(Total (Loaded|Added):)/gi,
// //         ".\n$1",
// //       );

// //       tableRows.push([
// //         format(new Date(r.date), "MMM d, yyyy"),
// //         target,
// //         r.type,
// //         cleanRemarks,
// //         r.staffName || "System",
// //         formatMoneyPDF(r.amount),
// //       ]);
// //     });

// //     autoTable(doc, {
// //       startY: 48,
// //       head: [tableColumn],
// //       body: tableRows,
// //       foot: [
// //         ["GRAND TOTAL", "", "", "", "", formatMoneyPDF(totalExportAmount)],
// //       ],
// //       theme: "grid",
// //       headStyles: { fillColor: [220, 38, 38] },
// //       footStyles: {
// //         fillColor: [241, 245, 249],
// //         textColor: [15, 23, 42],
// //         fontStyle: "bold",
// //       },
// //       styles: {
// //         fontSize: 8,
// //         cellPadding: 3,
// //         overflow: "linebreak",
// //       },
// //       columnStyles: {
// //         0: { cellWidth: 25 },
// //         1: { cellWidth: 80 },
// //         2: { cellWidth: 25 },
// //         3: { cellWidth: 75 },
// //         4: { cellWidth: 30 },
// //         5: { cellWidth: 34, halign: "right" },
// //       },
// //     });

// //     doc.save(`Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
// //   };

// //   return (
// //     <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
// //       <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4">
// //         {/* ROW 1: Title & Export Menu */}
// //         <div className="flex items-center justify-between w-full">
// //           <div className="flex items-center gap-3 shrink-0">
// //             <h2 className="font-black text-foreground text-lg uppercase tracking-tight">
// //               Transaction History
// //             </h2>
// //             {isPending && (
// //               <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
// //             )}
// //           </div>

// //           <DropdownMenu>
// //             <DropdownMenuTrigger asChild>
// //               <Button
// //                 variant="ghost"
// //                 size="icon"
// //                 className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
// //               >
// //                 <MoreVertical className="h-5 w-5" />
// //               </Button>
// //             </DropdownMenuTrigger>
// //             <DropdownMenuContent
// //               align="end"
// //               className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
// //             >
// //               <DropdownMenuItem
// //                 onClick={generatePDF}
// //                 className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
// //               >
// //                 <Printer className="w-4 h-4 text-blue-600" /> Download PDF
// //                 Report
// //               </DropdownMenuItem>
// //             </DropdownMenuContent>
// //           </DropdownMenu>
// //         </div>

// //         {/* ROW 2: Dedicated Filter Bar */}
// //         <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 w-full">
// //           <div className="hidden md:flex items-center gap-1.5 text-muted-foreground mr-2">
// //             <ListFilter className="w-4 h-4" />
// //             <span className="text-[10px] font-black uppercase tracking-widest">
// //               Filters:
// //             </span>
// //           </div>

// //           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
// //             <Popover open={openDate} onOpenChange={setOpenDate}>
// //               <PopoverTrigger asChild>
// //                 <Button
// //                   variant="ghost"
// //                   className={cn(
// //                     "w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]",
// //                     !selectedDateParam && "text-slate-500",
// //                   )}
// //                 >
// //                   <div className="flex items-center truncate">
// //                     <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-50" />
// //                     {dateValue ? format(dateValue, "MMM d, yy") : "DATE"}
// //                   </div>
// //                   <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
// //                 </Button>
// //               </PopoverTrigger>
// //               <PopoverContent
// //                 className="w-auto p-0 rounded-xl shadow-xl border-border"
// //                 align="start"
// //               >
// //                 <Calendar
// //                   mode="single"
// //                   selected={dateValue}
// //                   defaultMonth={dateValue || new Date()}
// //                   captionLayout="dropdown"
// //                   fromYear={2020}
// //                   toYear={new Date().getFullYear()}
// //                   onSelect={(date) => {
// //                     updateFilter(
// //                       "date",
// //                       date ? format(date, "yyyy-MM-dd") : "all",
// //                     );
// //                     setOpenDate(false);
// //                   }}
// //                   initialFocus
// //                   disabled={(date) => date > new Date()}
// //                 />
// //               </PopoverContent>
// //             </Popover>
// //           </div>

// //           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
// //             <Popover open={openFarm} onOpenChange={setOpenFarm}>
// //               <PopoverTrigger asChild>
// //                 <Button
// //                   variant="ghost"
// //                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
// //                 >
// //                   <div className="flex items-center truncate">
// //                     <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
// //                     <span className="truncate">
// //                       {selectedFarm === "all" ? "FARM" : selectedFarm}
// //                     </span>
// //                   </div>
// //                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
// //                 </Button>
// //               </PopoverTrigger>
// //               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
// //                 <Command>
// //                   <CommandInput placeholder="Search farm..." />
// //                   <CommandList className="max-h-[250px]">
// //                     <CommandEmpty className="py-4 text-xs text-center">
// //                       No farm found.
// //                     </CommandEmpty>
// //                     <CommandGroup>
// //                       <CommandItem
// //                         onSelect={() => {
// //                           updateFilter("farm", "all");
// //                           setOpenFarm(false);
// //                         }}
// //                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                       >
// //                         <Check
// //                           className={cn(
// //                             "mr-2 h-3.5 w-3.5",
// //                             selectedFarm === "all"
// //                               ? "opacity-100 text-red-600"
// //                               : "opacity-0",
// //                           )}
// //                         />{" "}
// //                         ALL FARMS
// //                       </CommandItem>
// //                       {farms.map((f) => (
// //                         <CommandItem
// //                           key={f}
// //                           onSelect={() => {
// //                             updateFilter("farm", f);
// //                             setOpenFarm(false);
// //                           }}
// //                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                         >
// //                           <Check
// //                             className={cn(
// //                               "mr-2 h-3.5 w-3.5",
// //                               selectedFarm === f
// //                                 ? "opacity-100 text-red-600"
// //                                 : "opacity-0",
// //                             )}
// //                           />{" "}
// //                           {f}
// //                         </CommandItem>
// //                       ))}
// //                     </CommandGroup>
// //                   </CommandList>
// //                 </Command>
// //               </PopoverContent>
// //             </Popover>
// //           </div>

// //           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
// //             <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
// //               <PopoverTrigger asChild>
// //                 <Button
// //                   variant="ghost"
// //                   disabled={selectedFarm === "all"}
// //                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
// //                 >
// //                   <div className="flex items-center truncate">
// //                     <Home className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
// //                     <span className="truncate">
// //                       {selectedBuilding === "all"
// //                         ? "BUILDING"
// //                         : selectedBuilding}
// //                     </span>
// //                   </div>
// //                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
// //                 </Button>
// //               </PopoverTrigger>
// //               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
// //                 <Command>
// //                   <CommandInput placeholder="Search building..." />
// //                   <CommandList className="max-h-[250px]">
// //                     <CommandEmpty className="py-4 text-xs text-center">
// //                       No building found.
// //                     </CommandEmpty>
// //                     <CommandGroup>
// //                       <CommandItem
// //                         onSelect={() => {
// //                           updateFilter("building", "all");
// //                           setOpenBuilding(false);
// //                         }}
// //                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                       >
// //                         <Check
// //                           className={cn(
// //                             "mr-2 h-3.5 w-3.5",
// //                             selectedBuilding === "all"
// //                               ? "opacity-100 text-red-600"
// //                               : "opacity-0",
// //                           )}
// //                         />{" "}
// //                         ALL BUILDINGS
// //                       </CommandItem>
// //                       {buildings.map((b) => (
// //                         <CommandItem
// //                           key={b}
// //                           onSelect={() => {
// //                             updateFilter("building", b);
// //                             setOpenBuilding(false);
// //                           }}
// //                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                         >
// //                           <Check
// //                             className={cn(
// //                               "mr-2 h-3.5 w-3.5",
// //                               selectedBuilding === b
// //                                 ? "opacity-100 text-red-600"
// //                                 : "opacity-0",
// //                             )}
// //                           />{" "}
// //                           {b}
// //                         </CommandItem>
// //                       ))}
// //                     </CommandGroup>
// //                   </CommandList>
// //                 </Command>
// //               </PopoverContent>
// //             </Popover>
// //           </div>

// //           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
// //             <Popover open={openLoad} onOpenChange={setOpenLoad}>
// //               <PopoverTrigger asChild>
// //                 <Button
// //                   variant="ghost"
// //                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
// //                 >
// //                   <div className="flex items-center truncate">
// //                     <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
// //                     <span className="truncate">
// //                       {selectedLoad === "all" ? "BATCH" : displayLoadName}
// //                     </span>
// //                   </div>
// //                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
// //                 </Button>
// //               </PopoverTrigger>
// //               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
// //                 <Command>
// //                   <CommandInput placeholder="Search batch..." />
// //                   <CommandList className="max-h-[250px]">
// //                     <CommandEmpty className="py-4 text-xs text-center">
// //                       No batch found.
// //                     </CommandEmpty>
// //                     <CommandGroup>
// //                       <CommandItem
// //                         onSelect={() => {
// //                           updateFilter("load", "all");
// //                           setOpenLoad(false);
// //                         }}
// //                         className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                       >
// //                         <Check
// //                           className={cn(
// //                             "mr-2 h-3.5 w-3.5",
// //                             selectedLoad === "all"
// //                               ? "opacity-100 text-red-600"
// //                               : "opacity-0",
// //                           )}
// //                         />{" "}
// //                         ALL BATCHES
// //                       </CommandItem>
// //                       {loads?.map((l) => (
// //                         <CommandItem
// //                           key={String(l.id)}
// //                           onSelect={() => {
// //                             updateFilter("load", String(l.id));
// //                             setOpenLoad(false);
// //                           }}
// //                           className="text-xs font-bold uppercase cursor-pointer py-2.5"
// //                         >
// //                           <Check
// //                             className={cn(
// //                               "mr-2 h-3.5 w-3.5",
// //                               selectedLoad === String(l.id)
// //                                 ? "opacity-100 text-red-600"
// //                                 : "opacity-0",
// //                             )}
// //                           />{" "}
// //                           {l.name}
// //                         </CommandItem>
// //                       ))}
// //                     </CommandGroup>
// //                   </CommandList>
// //                 </Command>
// //               </PopoverContent>
// //             </Popover>
// //           </div>

// //           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
// //             <Popover open={openCat} onOpenChange={setOpenCat}>
// //               <PopoverTrigger asChild>
// //                 <Button
// //                   variant="ghost"
// //                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
// //                 >
// //                   <div className="flex items-center truncate">
// //                     <PieChart className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
// //                     <span className="truncate">
// //                       {selectedType === "all" ? "CATEGORY" : selectedType}
// //                     </span>
// //                   </div>
// //                   <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
// //                 </Button>
// //               </PopoverTrigger>
// //               <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
// //                 <Command>
// //                   <CommandInput placeholder="Search category..." />
// //                   <CommandList>
// //                     <CommandGroup>
// //                       <CommandItem
// //                         onSelect={() => {
// //                           updateFilter("type", "all");
// //                           setOpenCat(false);
// //                         }}
// //                         className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
// //                       >
// //                         <Check
// //                           className={cn(
// //                             "mr-2 h-3.5 w-3.5",
// //                             selectedType === "all"
// //                               ? "opacity-100 text-red-600"
// //                               : "opacity-0",
// //                           )}
// //                         />{" "}
// //                         ALL CATEGORIES
// //                       </CommandItem>
// //                       {categories.map((cat) => (
// //                         <CommandItem
// //                           key={cat.value}
// //                           onSelect={() => {
// //                             updateFilter("type", cat.value);
// //                             setOpenCat(false);
// //                           }}
// //                           className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
// //                         >
// //                           <Check
// //                             className={cn(
// //                               "mr-2 h-3.5 w-3.5",
// //                               selectedType === cat.value
// //                                 ? "opacity-100 text-red-600"
// //                                 : "opacity-0",
// //                             )}
// //                           />{" "}
// //                           {cat.label}
// //                         </CommandItem>
// //                       ))}
// //                     </CommandGroup>
// //                   </CommandList>
// //                 </Command>
// //               </PopoverContent>
// //             </Popover>
// //           </div>

// //           {hasActiveFilters && (
// //             <Button
// //               variant="ghost"
// //               onClick={resetFilters}
// //               className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto lg:ml-0"
// //             >
// //               <X className="w-3.5 h-3.5 mr-1" /> Reset
// //             </Button>
// //           )}
// //         </div>
// //       </div>

// //       {/* 2. TABLE */}
// //       <div
// //         className={cn(
// //           "overflow-x-auto custom-scrollbar transition-opacity duration-300 min-h-[400px]",
// //           isPending && "opacity-50 pointer-events-none",
// //         )}
// //       >
// //         <table className="w-full text-sm text-left">
// //           <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
// //             <tr>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
// //                 Date
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
// //                 Target
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center whitespace-nowrap">
// //                 Type
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
// //                 Details / Item
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-right whitespace-nowrap">
// //                 Amount (₱)
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
// //                 Staff
// //               </th>
// //               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap bg-slate-50 dark:bg-slate-900/50">
// //                 Actions
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody className="divide-y divide-border/50">
// //             {history.length === 0 ? (
// //               <tr>
// //                 <td
// //                   colSpan={7}
// //                   className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
// //                 >
// //                   <div className="flex flex-col items-center gap-2">
// //                     <Filter className="w-8 h-8" /> No records match your
// //                     filters.
// //                   </div>
// //                 </td>
// //               </tr>
// //             ) : (
// //               history.map((record) => (
// //                 <tr
// //                   key={record.id}
// //                   className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
// //                 >
// //                   <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
// //                     {format(new Date(record.date), "MMM d, yyyy")}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span className="font-black text-foreground block uppercase text-xs">
// //                       {record.farmName}
// //                     </span>
// //                     <span className="block text-[10px] font-bold uppercase tracking-widest mt-1">
// //                       {record.loadId ? (
// //                         <div className="flex flex-col">
// //                           <span className="text-slate-500 dark:text-slate-400">
// //                             {record.buildingName}
// //                           </span>
// //                           <span className="text-blue-500 mt-0.5">
// //                             {record.loadName || `Load ${record.loadId}`}
// //                           </span>
// //                         </div>
// //                       ) : (
// //                         <div className="flex flex-col gap-1.5 mt-1.5">
// //                           <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
// //                             <Users className="w-3 h-3" /> Farm-Wide Shared Cost
// //                           </span>
// //                           {record.sharedWith &&
// //                             record.sharedWith.length > 0 && (
// //                               <div className="flex flex-wrap items-center gap-1">
// //                                 <span className="text-[8px] text-slate-400 dark:text-slate-500">
// //                                   SPLIT:
// //                                 </span>
// //                                 {record.sharedWith.map((bName: string) => (
// //                                   <span
// //                                     key={bName}
// //                                     className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded"
// //                                   >
// //                                     {bName}
// //                                   </span>
// //                                 ))}
// //                               </div>
// //                             )}
// //                         </div>
// //                       )}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-center">
// //                     <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-foreground">
// //                       {record.type}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-pre-wrap min-w-[200px]">
// //                     {record.remarks
// //                       ? record.remarks.replace(
// //                           /\.\s*(Total (Loaded|Added):)/gi,
// //                           ".\n$1",
// //                         )
// //                       : "-"}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap font-black text-red-600 dark:text-red-400 text-right text-base">
// //                     {Number(record.amount).toLocaleString("en-US", {
// //                       minimumFractionDigits: 2,
// //                     })}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-muted-foreground uppercase text-right tracking-widest">
// //                     {record.staffName || "Unknown"}
// //                   </td>
// //                   <td className="px-3 py-4 text-right bg-slate-50/50 dark:bg-slate-900/20">
// //                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
// //                       <EditExpenseModal expense={record} loads={loads} />
// //                       <DeleteExpenseButton expense={record} />
// //                     </div>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* 3. PAGINATION */}
// //       <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
// //         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
// //           Page {currentPage} / {totalPages || 1}
// //         </p>
// //         <div className="flex items-center gap-2">
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={() => goToPage(currentPage - 1)}
// //             disabled={currentPage <= 1 || isPending}
// //             className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
// //           >
// //             <ChevronLeft className="w-4 h-4 mr-1" /> Prev
// //           </Button>
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={() => goToPage(currentPage + 1)}
// //             disabled={currentPage >= totalPages || isPending}
// //             className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
// //           >
// //             Next <ChevronRight className="w-4 h-4 ml-1" />
// //           </Button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

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
//   ListFilter,
//   Layers,
//   Lock,
// } from "lucide-react";
// import { format, parseISO } from "date-fns";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { toast } from "sonner";
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
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// import EditExpenseModal from "./EditExpenseModal";
// import DeleteExpenseButton from "./DeleteExpenseButton";

// const categories = [
//   { label: "Chick Purchase", value: "chick_purchase" }, // <--- ADDED to filters!
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
//   loads = [],
//   totalPages,
//   currentPage,
//   userRole = "staff",
// }: {
//   history: any[];
//   fullHistory: any[];
//   farms: string[];
//   buildings: string[];
//   loads?: any[];
//   totalPages: number;
//   currentPage: number;
//   userRole?: string;
// }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const pathname = usePathname();
//   const [isPending, startTransition] = useTransition();

//   const [openFarm, setOpenFarm] = useState(false);
//   const [openBuilding, setOpenBuilding] = useState(false);
//   const [openLoad, setOpenLoad] = useState(false);
//   const [openCat, setOpenCat] = useState(false);
//   const [openDate, setOpenDate] = useState(false);

//   const selectedFarm = searchParams.get("farm") || "all";
//   const selectedBuilding = searchParams.get("building") || "all";
//   const selectedLoad = searchParams.get("load") || "all";
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

//       let target = "";
//       if (r.loadId) {
//         target = `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`;
//       } else if (r.sharedWith && r.sharedWith.length > 0) {
//         target = `${r.farmName} (Split: ${r.sharedWith.join(", ")})`;
//       } else {
//         target = `${r.farmName} (Shared Cost)`;
//       }

//       let cleanRemarks = r.remarks ? r.remarks.replace(/[₱±]/g, "PHP ") : "-";

//       cleanRemarks = cleanRemarks.replace(
//         /\.\s*(Total (Loaded|Added):)/gi,
//         ".\n$1",
//       );

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
//       styles: {
//         fontSize: 8,
//         cellPadding: 3,
//         overflow: "linebreak",
//       },
//       columnStyles: {
//         0: { cellWidth: 25 },
//         1: { cellWidth: 80 },
//         2: { cellWidth: 25 },
//         3: { cellWidth: 75 },
//         4: { cellWidth: 30 },
//         5: { cellWidth: 34, halign: "right" },
//       },
//     });

//     doc.save(`Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
//   };

//   return (
//     <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
//       <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4">
//         {/* ROW 1: Title & Export Menu */}
//         <div className="flex items-center justify-between w-full">
//           <div className="flex items-center gap-3 shrink-0">
//             <h2 className="font-black text-foreground text-lg uppercase tracking-tight">
//               Transaction History
//             </h2>
//             {isPending && (
//               <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
//             )}
//           </div>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
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
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>

//         {/* ROW 2: Dedicated Filter Bar */}
//         <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 w-full">
//           <div className="hidden md:flex items-center gap-1.5 text-muted-foreground mr-2">
//             <ListFilter className="w-4 h-4" />
//             <span className="text-[10px] font-black uppercase tracking-widest">
//               Filters:
//             </span>
//           </div>

//           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
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
//                     <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-50" />
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
//                   defaultMonth={dateValue || new Date()}
//                   captionLayout="dropdown"
//                   fromYear={2020}
//                   toYear={new Date().getFullYear()}
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

//           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openFarm} onOpenChange={setOpenFarm}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
//                 >
//                   <div className="flex items-center truncate">
//                     <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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

//           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   disabled={selectedFarm === "all" || isPending}
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
//                 >
//                   <div className="flex items-center truncate">
//                     <Home className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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

//           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openLoad} onOpenChange={setOpenLoad}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   disabled={selectedBuilding === "all" || isPending}
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
//                 >
//                   <div className="flex items-center truncate">
//                     <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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
//                       {loads?.map((l) => (
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

//           <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
//             <Popover open={openCat} onOpenChange={setOpenCat}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
//                 >
//                   <div className="flex items-center truncate">
//                     <PieChart className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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
//               disabled={isPending}
//               onClick={resetFilters}
//               className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto lg:ml-0"
//             >
//               <X className="w-3.5 h-3.5 mr-1" /> Reset
//             </Button>
//           )}
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
//               <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap bg-slate-50 dark:bg-slate-900/50">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-border/50">
//             {history.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={7}
//                   className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
//                 >
//                   <div className="flex flex-col items-center gap-2">
//                     <Filter className="w-8 h-8" /> No records match your
//                     filters.
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               history.map((record) => {
//                 // ---> THE FIX: Logic to check if this is an automated feed OR chick expense <---
//                 const isSystemGeneratedFeed =
//                   record.type === "feeds" && record.loadId !== null;
//                 const isSystemGeneratedChick =
//                   (record.type === "chicks" ||
//                     record.type === "chick_purchase") &&
//                   record.loadId !== null;
//                 const isSystemLocked =
//                   isSystemGeneratedFeed || isSystemGeneratedChick;

//                 // Ensure non-owners cannot see edit/delete controls at all
//                 const isOwner = userRole === "owner";

//                 return (
//                   <tr
//                     key={record.id}
//                     className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
//                       {format(new Date(record.date), "MMM d, yyyy")}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="font-black text-foreground block uppercase text-xs">
//                         {record.farmName}
//                       </span>
//                       <span className="block text-[10px] font-bold uppercase tracking-widest mt-1">
//                         {record.loadId ? (
//                           <div className="flex flex-col">
//                             <span className="text-slate-500 dark:text-slate-400">
//                               {record.buildingName}
//                             </span>
//                             <span className="text-blue-500 mt-0.5">
//                               {record.loadName || `Load ${record.loadId}`}
//                             </span>
//                           </div>
//                         ) : (
//                           <div className="flex flex-col gap-1.5 mt-1.5">
//                             <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
//                               <Users className="w-3 h-3" /> Farm-Wide Shared
//                               Cost
//                             </span>
//                             {record.sharedWith &&
//                               record.sharedWith.length > 0 && (
//                                 <div className="flex flex-wrap items-center gap-1">
//                                   <span className="text-[8px] text-slate-400 dark:text-slate-500">
//                                     SPLIT:
//                                   </span>
//                                   {record.sharedWith.map((bName: string) => (
//                                     <span
//                                       key={bName}
//                                       className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded"
//                                     >
//                                       {bName}
//                                     </span>
//                                   ))}
//                                 </div>
//                               )}
//                           </div>
//                         )}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-center">
//                       <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-foreground">
//                         {record.type}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-pre-wrap min-w-[200px]">
//                       {record.remarks
//                         ? record.remarks.replace(
//                             /\.\s*(Total (Loaded|Added):)/gi,
//                             ".\n$1",
//                           )
//                         : "-"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap font-black text-red-600 dark:text-red-400 text-right text-base">
//                       {Number(record.amount).toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-muted-foreground uppercase text-right tracking-widest">
//                       {record.staffName || "Unknown"}
//                     </td>
//                     <td className="px-3 py-4 text-right bg-slate-50/50 dark:bg-slate-900/20">
//                       <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                         {!isOwner ? (
//                           <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
//                             <Lock className="w-3 h-3" />
//                             <span className="text-[9px] font-bold uppercase tracking-widest">
//                               Locked
//                             </span>
//                           </div>
//                         ) : isSystemLocked ? (
//                           // ---> THE FIX: Safely Lock Feed AND Chick Expenses <---
//                           <TooltipProvider>
//                             <Tooltip delayDuration={100}>
//                               <TooltipTrigger asChild>
//                                 <Button
//                                   variant="ghost"
//                                   size="icon"
//                                   onClick={() =>
//                                     toast.error("System Locked", {
//                                       description: isSystemGeneratedFeed
//                                         ? "This is an automated inventory cost. To edit or delete it, please modify the specific log in the Daily Monitoring tab."
//                                         : "This is an automated batch cost. To edit or delete it, please modify the batch in the Chick Loading menu.",
//                                     })
//                                   }
//                                   className="h-8 w-8 rounded-lg border border-border/50 bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 transition-all"
//                                 >
//                                   <Lock className="w-4 h-4 text-slate-500" />
//                                 </Button>
//                               </TooltipTrigger>
//                               <TooltipContent
//                                 side="left"
//                                 className="max-w-[200px] bg-slate-900 text-slate-50 p-3 rounded-xl border border-border/50 shadow-2xl"
//                               >
//                                 <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">
//                                   System Locked
//                                 </p>
//                                 <p className="text-[11px] font-medium leading-tight">
//                                   {isSystemGeneratedFeed
//                                     ? "This is an automated inventory cost. To edit or delete it, please modify the corresponding log in the "
//                                     : "This is an automated batch cost. To edit or delete it, please modify the batch in the "}
//                                   <strong className="text-white">
//                                     {isSystemGeneratedFeed
//                                       ? "Daily Monitoring"
//                                       : "Chick Loading"}
//                                   </strong>{" "}
//                                   {isSystemGeneratedFeed ? "tab." : "menu."}
//                                 </p>
//                               </TooltipContent>
//                             </Tooltip>
//                           </TooltipProvider>
//                         ) : (
//                           <>
//                             <EditExpenseModal expense={record} loads={loads} />
//                             <DeleteExpenseButton expense={record} />
//                           </>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
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
  ListFilter,
  Layers,
  Lock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import EditExpenseModal from "./EditExpenseModal";
import DeleteExpenseButton from "./DeleteExpenseButton";

const categories = [
  { label: "Chick Purchase", value: "chick_purchase" },
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
  userRole = "staff",
}: {
  history: any[];
  fullHistory: any[];
  farms: string[];
  buildings: string[];
  loads?: any[];
  totalPages: number;
  currentPage: number;
  userRole?: string;
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

      let target = "";
      if (r.loadId) {
        target = `${r.farmName} - ${r.buildingName} (${r.loadName || "Load " + r.loadId})`;
      } else if (r.sharedWith && r.sharedWith.length > 0) {
        target = `${r.farmName} (Split: ${r.sharedWith.join(", ")})`;
      } else {
        target = `${r.farmName} (Shared Cost)`;
      }

      let cleanRemarks = r.remarks ? r.remarks.replace(/[₱±]/g, "PHP ") : "-";

      cleanRemarks = cleanRemarks.replace(
        /\.\s*(Total (Loaded|Added):)/gi,
        ".\n$1",
      );

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
      showFoot: "lastPage", // <--- THE FIX: Ensures Grand Total only prints on the final page!
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 25 },
        3: { cellWidth: 75 },
        4: { cellWidth: 30 },
        5: { cellWidth: 34, halign: "right" },
      },
    });

    doc.save(`Otso_Financial_Ledger_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
      <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4">
        {/* ROW 1: Title & Export Menu */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="font-black text-foreground text-lg uppercase tracking-tight">
              Transaction History
            </h2>
            {isPending && (
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            )}
          </div>

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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ROW 2: Dedicated Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 w-full">
          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground mr-2">
            <ListFilter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filters:
            </span>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  className={cn(
                    "w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]",
                    !selectedDateParam && "text-slate-500",
                  )}
                >
                  <div className="flex items-center truncate">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-50" />
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
                  defaultMonth={dateValue || new Date()}
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={new Date().getFullYear()}
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all" || isPending}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
                >
                  <div className="flex items-center truncate">
                    <Home className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openLoad} onOpenChange={setOpenLoad}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedBuilding === "all" || isPending}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
                >
                  <div className="flex items-center truncate">
                    <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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
                      {loads?.map((l) => (
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openCat} onOpenChange={setOpenCat}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <PieChart className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
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
              disabled={isPending}
              onClick={resetFilters}
              className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto lg:ml-0"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}
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
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap bg-slate-50 dark:bg-slate-900/50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8" /> No records match your
                    filters.
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => {
                const isSystemGeneratedFeed =
                  record.type === "feeds" && record.loadId !== null;
                const isSystemGeneratedChick =
                  (record.type === "chicks" ||
                    record.type === "chick_purchase") &&
                  record.loadId !== null;
                const isSystemLocked =
                  isSystemGeneratedFeed || isSystemGeneratedChick;

                const isOwner = userRole === "owner";

                return (
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
                            <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                              <Users className="w-3 h-3" /> Farm-Wide Shared
                              Cost
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
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-pre-wrap min-w-[200px]">
                      {record.remarks
                        ? record.remarks.replace(
                            /\.\s*(Total (Loaded|Added):)/gi,
                            ".\n$1",
                          )
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
                    <td className="px-3 py-4 text-right bg-slate-50/50 dark:bg-slate-900/20">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isOwner ? (
                          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            <Lock className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              Locked
                            </span>
                          </div>
                        ) : isSystemLocked ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    toast.error("System Locked", {
                                      description: isSystemGeneratedFeed
                                        ? "This is an automated inventory cost. To edit or delete it, please modify the specific log in the Daily Monitoring tab."
                                        : "This is an automated batch cost. To edit or delete it, please modify the batch in the Chick Loading menu.",
                                    })
                                  }
                                  className="h-8 w-8 rounded-lg border border-border/50 bg-slate-100 dark:bg-slate-800 opacity-60 cursor-not-allowed hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 transition-all"
                                >
                                  <Lock className="w-4 h-4 text-slate-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="max-w-[200px] bg-slate-900 text-slate-50 p-3 rounded-xl border border-border/50 shadow-2xl"
                              >
                                <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">
                                  System Locked
                                </p>
                                <p className="text-[11px] font-medium leading-tight">
                                  {isSystemGeneratedFeed
                                    ? "This is an automated inventory cost. To edit or delete it, please modify the corresponding log in the "
                                    : "This is an automated batch cost. To edit or delete it, please modify the batch in the "}
                                  <strong className="text-white">
                                    {isSystemGeneratedFeed
                                      ? "Daily Monitoring"
                                      : "Chick Loading"}
                                  </strong>{" "}
                                  {isSystemGeneratedFeed ? "tab." : "menu."}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <>
                            <EditExpenseModal expense={record} loads={loads} />
                            <DeleteExpenseButton expense={record} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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
