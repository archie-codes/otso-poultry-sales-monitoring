// "use client";

// import { useState, useMemo } from "react";
// import { allocateFeeds } from "./actions";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Loader2,
//   ArrowRightLeft,
//   CalendarIcon,
//   ChevronDown,
//   Check,
//   MapPin,
//   Warehouse,
//   PackageSearch,
//   Building2,
// } from "lucide-react";
// import { toast } from "sonner";
// import { format } from "date-fns";
// import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

// const formatSacks = (val: number | string | null | undefined) => {
//   const num = Number(val);
//   if (!num || num === 0) return "0";

//   const whole = Math.floor(num);
//   const frac = num - whole;

//   let fracSymbol = "";
//   if (Math.abs(frac - 0.25) < 0.01) fracSymbol = "¼";
//   else if (Math.abs(frac - 0.5) < 0.01) fracSymbol = "½";
//   else if (Math.abs(frac - 0.75) < 0.01) fracSymbol = "¾";
//   else if (frac > 0) fracSymbol = frac.toFixed(2).substring(1);

//   if (whole > 0 && fracSymbol) return `${whole.toLocaleString()} ${fracSymbol}`;
//   if (whole === 0 && fracSymbol) return fracSymbol;
//   return whole.toLocaleString();
// };

// export default function TransferFeedsModal({
//   availableDeliveries,
//   activeLoads,
// }: {
//   availableDeliveries: any[];
//   activeLoads: any[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [allocatedDate, setAllocatedDate] = useState<Date | undefined>(
//     new Date(),
//   );
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

//   // ---> 1. SOURCE STATES (Warehouse) <---
//   const [openWarehouseSupplier, setOpenWarehouseSupplier] = useState(false);
//   const [selectedWarehouseSupplier, setSelectedWarehouseSupplier] =
//     useState("");

//   const [openDelivery, setOpenDelivery] = useState(false);
//   const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");

//   // ---> 2. DESTINATION STATES (Building) <---
//   const [openFarm, setOpenFarm] = useState(false);
//   const [selectedFarm, setSelectedFarm] = useState("");

//   const [openLoad, setOpenLoad] = useState(false);
//   const [selectedLoadId, setSelectedLoadId] = useState<string>("");

//   const [quantity, setQuantity] = useState<string>("");
//   const cleanQty = Number(quantity.replace(/,/g, "")) || 0;

//   // --- WAREHOUSE MATH & FILTERS ---
//   const uniqueWarehouseSuppliers = useMemo(() => {
//     const suppliers = new Set<string>();
//     availableDeliveries.forEach((d) => suppliers.add(d.supplierName));
//     return Array.from(suppliers);
//   }, [availableDeliveries]);

//   const filteredDeliveries = useMemo(() => {
//     if (!selectedWarehouseSupplier) return [];
//     return availableDeliveries.filter(
//       (d) => d.supplierName === selectedWarehouseSupplier,
//     );
//   }, [selectedWarehouseSupplier, availableDeliveries]);

//   const selectedDelivery = availableDeliveries.find(
//     (d) => String(d.id) === selectedDeliveryId,
//   );

//   // ---> THE FIX: Calculate Preview including the Cash Bond <---
//   const unitPrice = selectedDelivery ? Number(selectedDelivery.unitPrice) : 0;
//   const cashBond = selectedDelivery ? Number(selectedDelivery.cashBond) : 0;
//   const totalCostPerSack = unitPrice + cashBond;
//   const totalExpensePreview = cleanQty * totalCostPerSack;

//   const isExceeding =
//     selectedDelivery && cleanQty > Number(selectedDelivery.remainingQuantity);

//   // --- DESTINATION MATH & FILTERS ---
//   const uniqueFarms = useMemo(() => {
//     const farms = new Set<string>();
//     activeLoads.forEach((load) => farms.add(load.farmName));
//     return Array.from(farms);
//   }, [activeLoads]);

//   const filteredLoads = useMemo(() => {
//     if (!selectedFarm) return [];
//     return activeLoads.filter((load) => load.farmName === selectedFarm);
//   }, [selectedFarm, activeLoads]);

//   const selectedLoadDetails = activeLoads.find(
//     (l) => String(l.id) === selectedLoadId,
//   );

//   let minValidDate: Date | null = null;
//   if (selectedLoadDetails && selectedLoadDetails.loadDate) {
//     const parts = String(selectedLoadDetails.loadDate).split("T")[0].split("-");
//     if (parts.length === 3) {
//       minValidDate = new Date(
//         Number(parts[0]),
//         Number(parts[1]) - 1,
//         Number(parts[2]),
//       );
//       minValidDate.setHours(0, 0, 0, 0);
//     }
//   }

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!selectedWarehouseSupplier)
//       return toast.error("Please select a Warehouse Supplier.");
//     if (!selectedDeliveryId)
//       return toast.error("Please select a specific Feed Batch.");
//     if (!selectedFarm) return toast.error("Please select a Destination Farm.");
//     if (!selectedLoadId)
//       return toast.error("Please select a Destination Building.");
//     if (!allocatedDate) return toast.error("Date of transfer is required.");
//     if (cleanQty <= 0) return toast.error("Quantity must be greater than 0.");
//     if (isExceeding)
//       return toast.error("Quantity exceeds available warehouse stock!");

//     const today = new Date();
//     today.setHours(23, 59, 59, 999);
//     if (allocatedDate.getTime() > today.getTime()) {
//       return toast.error("Invalid Date", {
//         description: "Transfer date cannot be in the future.",
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//     }

//     if (minValidDate) {
//       const checkDate = new Date(allocatedDate);
//       checkDate.setHours(0, 0, 0, 0);
//       if (checkDate.getTime() < minValidDate.getTime()) {
//         return toast.error("Invalid Date", {
//           description: `Cannot transfer feeds before the flock arrived on ${format(minValidDate, "MMM d, yyyy")}.`,
//           style: { backgroundColor: "red", color: "white", border: "none" },
//         });
//       }
//     }

//     setLoading(true);
//     const formData = new FormData(e.currentTarget);
//     formData.set("allocatedDate", format(allocatedDate, "yyyy-MM-dd"));
//     formData.set("quantity", String(cleanQty));
//     formData.set("deliveryId", selectedDeliveryId);
//     formData.set("loadId", selectedLoadId);

//     const result = await allocateFeeds(formData);

//     if (result.error) {
//       toast.error(result.error);
//     } else {
//       toast.success("Feeds successfully transferred to building!");
//       setIsOpen(false);

//       setQuantity("");
//       setSelectedWarehouseSupplier("");
//       setSelectedDeliveryId("");
//       setSelectedFarm("");
//       setSelectedLoadId("");
//     }
//     setLoading(false);
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="outline"
//           className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 font-bold rounded-xl shadow-sm h-11 px-6"
//         >
//           <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer to Building
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
//         <div className="bg-emerald-600 p-6 text-white">
//           <DialogTitle className="text-2xl font-black flex items-center gap-2">
//             <ArrowRightLeft className="w-6 h-6" /> Allocate Feeds
//           </DialogTitle>
//           <p className="text-emerald-100 text-sm font-medium mt-1">
//             Move feeds securely from the warehouse to an active building.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
//           {/* ======================================= */}
//           {/* SOURCE BLOCK: WAREHOUSE SUPPLIER -> BATCH */}
//           {/* ======================================= */}
//           <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50 space-y-4">
//             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
//               <PackageSearch className="w-4 h-4 shrink-0" />
//               <span className="text-[10px] font-black uppercase tracking-widest">
//                 1. Source: Main Warehouse
//               </span>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {/* 1A. SUPPLIER */}
//               <div className="space-y-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                   Select Supplier *
//                 </label>
//                 <Popover
//                   open={openWarehouseSupplier}
//                   onOpenChange={setOpenWarehouseSupplier}
//                 >
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={openWarehouseSupplier}
//                       className={cn(
//                         "w-full h-11 rounded-xl justify-between border-input bg-white dark:bg-slate-950 font-bold px-3 shadow-sm",
//                         !selectedWarehouseSupplier && "text-muted-foreground",
//                       )}
//                     >
//                       <span className="truncate flex items-center">
//                         <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
//                         {selectedWarehouseSupplier
//                           ? selectedWarehouseSupplier
//                           : "Supplier..."}
//                       </span>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-[300px] p-0" align="start">
//                     <Command>
//                       <CommandInput
//                         placeholder="Search supplier..."
//                         className="h-10"
//                       />
//                       <CommandEmpty>No stock from this supplier.</CommandEmpty>
//                       <CommandList>
//                         <CommandGroup>
//                           {uniqueWarehouseSuppliers.map((supplier) => (
//                             <CommandItem
//                               key={supplier}
//                               value={supplier}
//                               onSelect={() => {
//                                 setSelectedWarehouseSupplier(supplier);
//                                 setSelectedDeliveryId(""); // Reset feed batch if supplier changes!
//                                 setOpenWarehouseSupplier(false);
//                               }}
//                               className="font-bold cursor-pointer"
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4 text-emerald-600",
//                                   selectedWarehouseSupplier === supplier
//                                     ? "opacity-100"
//                                     : "opacity-0",
//                                 )}
//                               />
//                               {supplier}
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>
//               </div>

//               {/* 1B. FEED BATCH (DISABLED IF NO SUPPLIER) */}
//               <div className="space-y-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                   Select Feed Batch *
//                 </label>
//                 <Popover open={openDelivery} onOpenChange={setOpenDelivery}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={openDelivery}
//                       disabled={!selectedWarehouseSupplier}
//                       className={cn(
//                         "w-full h-11 rounded-xl justify-between border-input bg-white dark:bg-slate-950 font-bold px-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
//                         !selectedDeliveryId && "text-muted-foreground",
//                       )}
//                     >
//                       <span className="truncate flex items-center">
//                         {selectedDeliveryId && selectedDelivery
//                           ? `${formatSacks(selectedDelivery.remainingQuantity)} sacks • ${selectedDelivery.feedType}`
//                           : selectedWarehouseSupplier
//                             ? "Feed Type..."
//                             : "Pick Supplier First"}
//                       </span>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-[300px] p-0" align="start">
//                     <Command>
//                       <CommandInput
//                         placeholder="Search feed type..."
//                         className="h-10"
//                       />
//                       <CommandEmpty>No feeds found.</CommandEmpty>
//                       <CommandList>
//                         <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
//                           {filteredDeliveries.map((d) => (
//                             <CommandItem
//                               key={d.id}
//                               value={`${d.feedType} ${format(new Date(d.deliveryDate), "MMM d yyyy")}`}
//                               onSelect={() => {
//                                 setSelectedDeliveryId(String(d.id));
//                                 setOpenDelivery(false);
//                               }}
//                               className="font-bold cursor-pointer border-b border-border/50 last:border-0 py-3"
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4 text-emerald-600 shrink-0",
//                                   selectedDeliveryId === String(d.id)
//                                     ? "opacity-100"
//                                     : "opacity-0",
//                                 )}
//                               />
//                               <div className="flex flex-col">
//                                 <span>
//                                   {formatSacks(d.remainingQuantity)} sacks •{" "}
//                                   <span className="text-emerald-600">
//                                     {d.feedType}
//                                   </span>
//                                 </span>
//                                 <span className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
//                                   Arrived:{" "}
//                                   {format(
//                                     new Date(d.deliveryDate),
//                                     "MMM d, yyyy",
//                                   )}
//                                 </span>
//                               </div>
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>
//               </div>
//             </div>
//           </div>

//           {/* ======================================= */}
//           {/* DESTINATION BLOCK: FARM -> BUILDING       */}
//           {/* ======================================= */}
//           <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
//             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
//               <Warehouse className="w-4 h-4 shrink-0" />
//               <span className="text-[10px] font-black uppercase tracking-widest">
//                 2. Destination: Building
//               </span>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {/* 2A. FARM */}
//               <div className="space-y-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
//                   Select Farm *
//                 </label>
//                 <Popover open={openFarm} onOpenChange={setOpenFarm}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={openFarm}
//                       className={cn(
//                         "w-full h-11 rounded-xl justify-between border-emerald-200 bg-white dark:bg-slate-950 font-bold px-3 shadow-sm",
//                         !selectedFarm && "text-muted-foreground",
//                       )}
//                     >
//                       <span className="truncate flex items-center">
//                         <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
//                         {selectedFarm ? selectedFarm : "Farm..."}
//                       </span>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-[300px] p-0" align="start">
//                     <Command>
//                       <CommandInput
//                         placeholder="Search farm..."
//                         className="h-10"
//                       />
//                       <CommandEmpty>No farm found.</CommandEmpty>
//                       <CommandList>
//                         <CommandGroup>
//                           {uniqueFarms.map((farm) => (
//                             <CommandItem
//                               key={farm}
//                               value={farm}
//                               onSelect={() => {
//                                 setSelectedFarm(farm);
//                                 setSelectedLoadId(""); // Reset building if farm changes!
//                                 setAllocatedDate(new Date()); // Reset date because the valid date boundary changed!
//                                 setOpenFarm(false);
//                               }}
//                               className="font-bold cursor-pointer"
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4 text-emerald-600",
//                                   selectedFarm === farm
//                                     ? "opacity-100"
//                                     : "opacity-0",
//                                 )}
//                               />
//                               {farm}
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>
//               </div>

//               {/* 2B. BUILDING (DISABLED IF NO FARM) */}
//               <div className="space-y-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
//                   Select Building *
//                 </label>
//                 <Popover open={openLoad} onOpenChange={setOpenLoad}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={openLoad}
//                       disabled={!selectedFarm}
//                       className={cn(
//                         "w-full h-11 rounded-xl justify-between border-emerald-200 bg-white dark:bg-slate-950 font-bold px-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
//                         !selectedLoadId && "text-muted-foreground",
//                       )}
//                     >
//                       <span className="truncate flex items-center">
//                         {selectedLoadId
//                           ? (() => {
//                               const l = filteredLoads.find(
//                                 (x) => String(x.id) === selectedLoadId,
//                               );
//                               return l
//                                 ? `${l.buildingName} (${l.name})`
//                                 : "Building...";
//                             })()
//                           : selectedFarm
//                             ? "Building..."
//                             : "Pick Farm first"}
//                       </span>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-[300px] p-0" align="start">
//                     <Command>
//                       <CommandInput placeholder="Search building..." />
//                       <CommandEmpty>No building found.</CommandEmpty>
//                       <CommandList>
//                         <CommandGroup className="max-h-[250px] overflow-auto">
//                           {filteredLoads.map((l) => (
//                             <CommandItem
//                               key={l.id}
//                               value={`${l.buildingName} ${l.name}`}
//                               onSelect={() => {
//                                 setSelectedLoadId(String(l.id));
//                                 setAllocatedDate(new Date()); // Reset Date
//                                 setOpenLoad(false);
//                               }}
//                               className="font-bold cursor-pointer py-2.5"
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4 text-emerald-600",
//                                   selectedLoadId === String(l.id)
//                                     ? "opacity-100"
//                                     : "opacity-0",
//                                 )}
//                               />
//                               {l.buildingName}{" "}
//                               <span className="text-[10px] font-medium text-muted-foreground ml-1">
//                                 ({l.name})
//                               </span>
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4 pt-2">
//               <div className="space-y-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                   Date of Transfer *
//                 </label>
//                 <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       disabled={!selectedLoadId}
//                       className={cn(
//                         "w-full h-11 rounded-xl justify-between border-input font-normal px-3 bg-secondary/30 disabled:opacity-50",
//                         !allocatedDate && "text-muted-foreground",
//                       )}
//                     >
//                       <div className="flex items-center text-sm">
//                         <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
//                         <span className="truncate">
//                           {allocatedDate
//                             ? format(allocatedDate, "MMM d, yyyy")
//                             : "Pick date"}
//                         </span>
//                       </div>
//                       <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-auto p-0 z-200" align="start">
//                     <Calendar
//                       mode="single"
//                       selected={allocatedDate}
//                       defaultMonth={allocatedDate || new Date()}
//                       captionLayout="dropdown"
//                       fromYear={
//                         minValidDate ? minValidDate.getFullYear() : 2020
//                       }
//                       toYear={new Date().getFullYear()}
//                       onSelect={(date) => {
//                         setAllocatedDate(date);
//                         setIsCalendarOpen(false);
//                       }}
//                       disabled={(date) => {
//                         // Block Future
//                         const today = new Date();
//                         today.setHours(23, 59, 59, 999);
//                         if (date > today) return true;

//                         // Block Before Flock Arrival
//                         if (minValidDate) {
//                           const checkDate = new Date(date);
//                           checkDate.setHours(0, 0, 0, 0);
//                           if (checkDate.getTime() < minValidDate.getTime())
//                             return true;
//                         }

//                         return false;
//                       }}
//                       initialFocus
//                     />
//                   </PopoverContent>
//                 </Popover>
//                 {minValidDate && (
//                   <p className="text-[9px] font-bold text-emerald-600 mt-1">
//                     Valid from {format(minValidDate, "MMM d, yyyy")}
//                   </p>
//                 )}
//               </div>

//               <div
//                 className="space-y-1.5"
//                 onChange={(e) =>
//                   setQuantity((e.target as HTMLInputElement).value)
//                 }
//               >
//                 <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
//                   Quantity (Sacks) *
//                 </label>
//                 <FormattedNumberInput
//                   name="displayQuantity"
//                   required
//                   allowDecimals={true}
//                   placeholder="0"
//                   className="h-11 rounded-xl font-black bg-emerald-50 border-emerald-200"
//                 />
//               </div>
//             </div>

//             {/* FINANCIAL PREVIEW */}
//             {selectedDelivery && cleanQty > 0 && (
//               <div
//                 className={cn(
//                   "p-4 rounded-xl border flex items-center justify-between transition-colors",
//                   isExceeding
//                     ? "bg-red-50 border-red-200"
//                     : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
//                 )}
//               >
//                 <div>
//                   <p
//                     className={cn(
//                       "text-[10px] font-black uppercase tracking-widest",
//                       isExceeding ? "text-red-600" : "text-emerald-700",
//                     )}
//                   >
//                     {isExceeding
//                       ? "Exceeds Stock!"
//                       : "Financial Expense to Building"}
//                   </p>
//                   <p
//                     className={cn(
//                       "text-xs font-bold mt-0.5",
//                       isExceeding ? "text-red-500" : "text-emerald-600/80",
//                     )}
//                   >
//                     {formatSacks(cleanQty)} sacks × ₱
//                     {totalCostPerSack.toLocaleString(undefined, {
//                       minimumFractionDigits: 2,
//                     })}
//                   </p>
//                 </div>
//                 <div
//                   className={cn(
//                     "text-lg font-black",
//                     isExceeding ? "text-red-600" : "text-emerald-700",
//                   )}
//                 >
//                   ₱
//                   {totalExpensePreview.toLocaleString("en-US", {
//                     minimumFractionDigits: 2,
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
//             <Button
//               type="button"
//               variant="ghost"
//               onClick={() => setIsOpen(false)}
//               className="h-11 rounded-xl font-bold px-6"
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={loading || isExceeding}
//               className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-8"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
//                   Transferring...
//                 </>
//               ) : (
//                 "Confirm Transfer"
//               )}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import { useState, useMemo } from "react";
import { allocateFeeds } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Loader2,
  ArrowRightLeft,
  CalendarIcon,
  ChevronDown,
  Check,
  MapPin,
  Warehouse,
  PackageSearch,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

const formatSacks = (val: number | string | null | undefined) => {
  const num = Number(val);
  if (!num || num === 0) return "0";

  const whole = Math.floor(num);
  const frac = num - whole;

  let fracSymbol = "";
  if (Math.abs(frac - 0.25) < 0.01) fracSymbol = "¼";
  else if (Math.abs(frac - 0.5) < 0.01) fracSymbol = "½";
  else if (Math.abs(frac - 0.75) < 0.01) fracSymbol = "¾";
  else if (frac > 0) fracSymbol = frac.toFixed(2).substring(1);

  if (whole > 0 && fracSymbol) return `${whole.toLocaleString()} ${fracSymbol}`;
  if (whole === 0 && fracSymbol) return fracSymbol;
  return whole.toLocaleString();
};

export default function TransferFeedsModal({
  availableDeliveries,
  activeLoads,
}: {
  availableDeliveries: any[];
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allocatedDate, setAllocatedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // ---> 1. SOURCE STATES (Warehouse) <---
  const [openWarehouseSupplier, setOpenWarehouseSupplier] = useState(false);
  const [selectedWarehouseSupplier, setSelectedWarehouseSupplier] =
    useState("");

  const [openDelivery, setOpenDelivery] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("");

  // ---> 2. DESTINATION STATES (Building) <---
  const [openFarm, setOpenFarm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState("");

  const [openLoad, setOpenLoad] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState<string>("");

  const [quantity, setQuantity] = useState<string>("");
  const cleanQty = Number(quantity.replace(/,/g, "")) || 0;

  // --- WAREHOUSE MATH & FILTERS ---
  const uniqueWarehouseSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    availableDeliveries.forEach((d) => suppliers.add(d.supplierName));
    return Array.from(suppliers);
  }, [availableDeliveries]);

  const filteredDeliveries = useMemo(() => {
    if (!selectedWarehouseSupplier) return [];
    return availableDeliveries.filter(
      (d) => d.supplierName === selectedWarehouseSupplier,
    );
  }, [selectedWarehouseSupplier, availableDeliveries]);

  const selectedDelivery = availableDeliveries.find(
    (d) => String(d.id) === selectedDeliveryId,
  );

  const unitPrice = selectedDelivery ? Number(selectedDelivery.unitPrice) : 0;
  const cashBond = selectedDelivery ? Number(selectedDelivery.cashBond) : 0;
  const totalCostPerSack = unitPrice + cashBond;
  const totalExpensePreview = cleanQty * totalCostPerSack;

  const isExceeding =
    selectedDelivery && cleanQty > Number(selectedDelivery.remainingQuantity);

  // --- DESTINATION MATH & FILTERS ---
  const uniqueFarms = useMemo(() => {
    const farms = new Set<string>();
    activeLoads.forEach((load) => farms.add(load.farmName));
    return Array.from(farms);
  }, [activeLoads]);

  const filteredLoads = useMemo(() => {
    if (!selectedFarm) return [];
    return activeLoads.filter((load) => load.farmName === selectedFarm);
  }, [selectedFarm, activeLoads]);

  const selectedLoadDetails = activeLoads.find(
    (l) => String(l.id) === selectedLoadId,
  );

  let minValidDate: Date | null = null;
  if (selectedLoadDetails && selectedLoadDetails.loadDate) {
    const parts = String(selectedLoadDetails.loadDate).split("T")[0].split("-");
    if (parts.length === 3) {
      minValidDate = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      minValidDate.setHours(0, 0, 0, 0);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedWarehouseSupplier)
      return toast.error("Please select a Warehouse Supplier.");
    if (!selectedDeliveryId)
      return toast.error("Please select a specific Feed Batch.");
    if (!selectedFarm) return toast.error("Please select a Destination Farm.");
    if (!selectedLoadId)
      return toast.error("Please select a Destination Building.");
    if (!allocatedDate) return toast.error("Date of transfer is required.");
    if (cleanQty <= 0) return toast.error("Quantity must be greater than 0.");
    if (isExceeding)
      return toast.error("Quantity exceeds available warehouse stock!");

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (allocatedDate.getTime() > today.getTime()) {
      return toast.error("Invalid Date", {
        description: "Transfer date cannot be in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    }

    if (minValidDate) {
      const checkDate = new Date(allocatedDate);
      checkDate.setHours(0, 0, 0, 0);
      if (checkDate.getTime() < minValidDate.getTime()) {
        return toast.error("Invalid Date", {
          description: `Cannot transfer feeds before the flock arrived on ${format(minValidDate, "MMM d, yyyy")}.`,
          style: { backgroundColor: "red", color: "white", border: "none" },
        });
      }
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("allocatedDate", format(allocatedDate, "yyyy-MM-dd"));
    formData.set("quantity", String(cleanQty));
    formData.set("deliveryId", selectedDeliveryId);
    formData.set("loadId", selectedLoadId);

    const result = await allocateFeeds(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Feeds successfully transferred to building!");
      setIsOpen(false);

      setQuantity("");
      setSelectedWarehouseSupplier("");
      setSelectedDeliveryId("");
      setSelectedFarm("");
      setSelectedLoadId("");
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 font-bold rounded-xl shadow-sm h-11 px-6"
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer to Building
        </Button>
      </DialogTrigger>

      {/* ---> THE FIX: Added flex-col and max-h-[90vh] <--- */}
      <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header - Stays Fixed (shrink-0) */}
        <div className="bg-emerald-600 p-6 text-white shrink-0">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" /> Allocate Feeds
          </DialogTitle>
          <p className="text-emerald-100 text-sm font-medium mt-1">
            Move feeds securely from the warehouse to an active building.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden bg-card"
        >
          {/* ---> THE FIX: Scrollable Area <--- */}
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            {/* ======================================= */}
            {/* SOURCE BLOCK: WAREHOUSE SUPPLIER -> BATCH */}
            {/* ======================================= */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50 space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <PackageSearch className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  1. Source: Main Warehouse
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1A. SUPPLIER */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Select Supplier *
                  </label>
                  <Popover
                    open={openWarehouseSupplier}
                    onOpenChange={setOpenWarehouseSupplier}
                  >
                    <PopoverTrigger asChild>
                      {/* ---> THE FIX: min-h-[44px] h-auto whitespace-normal text-left <--- */}
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openWarehouseSupplier}
                        className={cn(
                          "w-full min-h-[44px] h-auto py-2 flex items-center justify-between rounded-xl border-input bg-white dark:bg-slate-950 font-bold px-3 shadow-sm whitespace-normal text-left text-sm",
                          !selectedWarehouseSupplier && "text-muted-foreground",
                        )}
                      >
                        <span className="flex-1 leading-tight pr-2">
                          {selectedWarehouseSupplier
                            ? selectedWarehouseSupplier
                            : "Supplier..."}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    {/* ---> THE FIX: Responsive Dropdown Width <--- */}
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search supplier..."
                          className="h-10"
                        />
                        <CommandEmpty>
                          No stock from this supplier.
                        </CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {uniqueWarehouseSuppliers.map((supplier) => (
                              <CommandItem
                                key={supplier}
                                value={supplier}
                                onSelect={() => {
                                  setSelectedWarehouseSupplier(supplier);
                                  setSelectedDeliveryId(""); // Reset feed batch
                                  setOpenWarehouseSupplier(false);
                                }}
                                className="font-bold cursor-pointer py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-emerald-600 shrink-0",
                                    selectedWarehouseSupplier === supplier
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="leading-tight">
                                  {supplier}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 1B. FEED BATCH (DISABLED IF NO SUPPLIER) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Select Feed Batch *
                  </label>
                  <Popover open={openDelivery} onOpenChange={setOpenDelivery}>
                    <PopoverTrigger asChild>
                      {/* ---> THE FIX: min-h-[44px] h-auto whitespace-normal text-left <--- */}
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDelivery}
                        disabled={!selectedWarehouseSupplier}
                        className={cn(
                          "w-full min-h-[44px] h-auto py-2 flex items-center justify-between rounded-xl border-input bg-white dark:bg-slate-950 font-bold px-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-normal text-left text-sm",
                          !selectedDeliveryId && "text-muted-foreground",
                        )}
                      >
                        <span className="flex-1 leading-tight pr-2">
                          {selectedDeliveryId && selectedDelivery
                            ? `${formatSacks(selectedDelivery.remainingQuantity)} sacks • ${selectedDelivery.feedType}`
                            : selectedWarehouseSupplier
                              ? "Feed Type..."
                              : "Pick Supplier First"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search feed type..."
                          className="h-10"
                        />
                        <CommandEmpty>No feeds found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
                            {filteredDeliveries.map((d) => (
                              <CommandItem
                                key={d.id}
                                value={`${d.feedType} ${format(new Date(d.deliveryDate), "MMM d yyyy")}`}
                                onSelect={() => {
                                  setSelectedDeliveryId(String(d.id));
                                  setOpenDelivery(false);
                                }}
                                className="font-bold cursor-pointer border-b border-border/50 last:border-0 py-3"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-emerald-600 shrink-0",
                                    selectedDeliveryId === String(d.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="leading-tight">
                                    {formatSacks(d.remainingQuantity)} sacks •{" "}
                                    <span className="text-emerald-600">
                                      {d.feedType}
                                    </span>
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                    Arrived:{" "}
                                    {format(
                                      new Date(d.deliveryDate),
                                      "MMM d, yyyy",
                                    )}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* ======================================= */}
            {/* DESTINATION BLOCK: FARM -> BUILDING       */}
            {/* ======================================= */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                <Warehouse className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  2. Destination: Building
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2A. FARM */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Select Farm *
                  </label>
                  <Popover open={openFarm} onOpenChange={setOpenFarm}>
                    <PopoverTrigger asChild>
                      {/* ---> THE FIX: min-h-[44px] h-auto whitespace-normal text-left <--- */}
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openFarm}
                        className={cn(
                          "w-full min-h-[44px] h-auto py-2 flex items-center justify-between rounded-xl border-emerald-200 bg-white dark:bg-slate-950 font-bold px-3 shadow-sm whitespace-normal text-left text-sm",
                          !selectedFarm && "text-muted-foreground",
                        )}
                      >
                        <span className="flex-1 leading-tight pr-2">
                          {selectedFarm ? selectedFarm : "Farm..."}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search farm..."
                          className="h-10"
                        />
                        <CommandEmpty>No farm found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {uniqueFarms.map((farm) => (
                              <CommandItem
                                key={farm}
                                value={farm}
                                onSelect={() => {
                                  setSelectedFarm(farm);
                                  setSelectedLoadId("");
                                  setAllocatedDate(new Date());
                                  setOpenFarm(false);
                                }}
                                className="font-bold cursor-pointer py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-emerald-600 shrink-0",
                                    selectedFarm === farm
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="leading-tight">{farm}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 2B. BUILDING (DISABLED IF NO FARM) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Select Building *
                  </label>
                  <Popover open={openLoad} onOpenChange={setOpenLoad}>
                    <PopoverTrigger asChild>
                      {/* ---> THE FIX: min-h-[44px] h-auto whitespace-normal text-left <--- */}
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openLoad}
                        disabled={!selectedFarm}
                        className={cn(
                          "w-full min-h-[44px] h-auto py-2 flex items-center justify-between rounded-xl border-emerald-200 bg-white dark:bg-slate-950 font-bold px-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-normal text-left text-sm",
                          !selectedLoadId && "text-muted-foreground",
                        )}
                      >
                        <span className="flex-1 leading-tight pr-2">
                          {selectedLoadId
                            ? (() => {
                                const l = filteredLoads.find(
                                  (x) => String(x.id) === selectedLoadId,
                                );
                                return l
                                  ? `${l.buildingName} (${l.name})`
                                  : "Building...";
                              })()
                            : selectedFarm
                              ? "Building..."
                              : "Pick Farm first"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search building..." />
                        <CommandEmpty>No building found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup className="max-h-[250px] overflow-auto">
                            {filteredLoads.map((l) => (
                              <CommandItem
                                key={l.id}
                                value={`${l.buildingName} ${l.name}`}
                                onSelect={() => {
                                  setSelectedLoadId(String(l.id));
                                  setAllocatedDate(new Date());
                                  setOpenLoad(false);
                                }}
                                className="font-bold cursor-pointer py-2.5"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-emerald-600 shrink-0",
                                    selectedLoadId === String(l.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="leading-tight">
                                    {l.buildingName}
                                  </span>
                                  <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                    ({l.name})
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Date of Transfer *
                  </label>
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!selectedLoadId}
                        className={cn(
                          "w-full h-11 rounded-xl justify-between border-input font-normal px-3 bg-secondary/30 disabled:opacity-50",
                          !allocatedDate && "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                          <span className="truncate">
                            {allocatedDate
                              ? format(allocatedDate, "MMM d, yyyy")
                              : "Pick date"}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-200" align="start">
                      <Calendar
                        mode="single"
                        selected={allocatedDate}
                        defaultMonth={allocatedDate || new Date()}
                        captionLayout="dropdown"
                        fromYear={
                          minValidDate ? minValidDate.getFullYear() : 2020
                        }
                        toYear={new Date().getFullYear()}
                        onSelect={(date) => {
                          setAllocatedDate(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(23, 59, 59, 999);
                          if (date > today) return true;

                          if (minValidDate) {
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            if (checkDate.getTime() < minValidDate.getTime())
                              return true;
                          }

                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {minValidDate && (
                    <p className="text-[9px] font-bold text-emerald-600 mt-1">
                      Valid from {format(minValidDate, "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                <div
                  className="space-y-1.5"
                  onChange={(e) =>
                    setQuantity((e.target as HTMLInputElement).value)
                  }
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    Quantity (Sacks) *
                  </label>
                  <FormattedNumberInput
                    name="displayQuantity"
                    required
                    allowDecimals={true}
                    placeholder="0"
                    className="h-11 rounded-xl font-black bg-emerald-50 border-emerald-200"
                  />
                </div>
              </div>

              {/* FINANCIAL PREVIEW */}
              {selectedDelivery && cleanQty > 0 && (
                <div
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-colors mt-2",
                    isExceeding
                      ? "bg-red-50 border-red-200"
                      : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        isExceeding ? "text-red-600" : "text-emerald-700",
                      )}
                    >
                      {isExceeding
                        ? "Exceeds Stock!"
                        : "Financial Expense to Building"}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-bold mt-0.5",
                        isExceeding ? "text-red-500" : "text-emerald-600/80",
                      )}
                    >
                      {formatSacks(cleanQty)} sacks × ₱
                      {totalCostPerSack.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "text-lg font-black",
                      isExceeding ? "text-red-600" : "text-emerald-700",
                    )}
                  >
                    ₱
                    {totalExpensePreview.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ---> THE FIX: Fixed Sticky Footer <--- */}
          <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-border/50 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-11 rounded-xl font-bold px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isExceeding}
              className="h-11 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
