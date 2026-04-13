// "use client";

// import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import { addLoad } from "./actions";
// import {
//   X,
//   Loader2,
//   Save,
//   CalendarIcon,
//   Check,
//   ChevronsUpDown,
//   ChevronDown,
//   MapPin,
//   Wallet,
// } from "lucide-react";
// import { toast } from "sonner";
// import { format, addMonths, addDays } from "date-fns";
// import { cn } from "@/lib/utils";
// import { useRouter } from "next/navigation";

// // SHADCN UI
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
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
// import Image from "next/image";
// import henIcon from "@/public/hen.png";
// import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

// const HenIcon = ({ className }: { className?: string }) => (
//   <span className={`relative block shrink-0 ${className ?? ""}`}>
//     <Image
//       src={henIcon}
//       alt="Hen"
//       fill
//       sizes="64px"
//       className="object-contain brightness-0 invert"
//     />
//   </span>
// );

// const chickBreeds = [
//   "Cobb 500 (Broiler)",
//   "Ross 308 (Broiler)",
//   "Arbor Acres (Broiler)",
//   "Dekalb White (Layer)",
//   "ISA Brown (Layer)",
//   "Lohmann (Layer)",
//   "Babcock White (Layer)",
//   "Babcock Brown (Layer)",
//   "Sasso (Colored/Free-Range)",
//   "Kabir (Colored/Free-Range)",
//   "Philippine Native",
//   "Other / Mixed",
// ];

// export default function AddLoadModal({
//   availableBuildings,
// }: {
//   availableBuildings: any[];
// }) {
//   const router = useRouter();
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const [selectedFarm, setSelectedFarm] = useState("");
//   const [openFarmSearch, setOpenFarmSearch] = useState(false);

//   const [buildingId, setBuildingId] = useState("");
//   const [openBuildingSearch, setOpenBuildingSearch] = useState(false);

//   const [chickType, setChickType] = useState("");
//   const [openChickType, setOpenChickType] = useState(false);

//   const [loadDate, setLoadDate] = useState<Date | undefined>(new Date());
//   const [openLoadDate, setOpenLoadDate] = useState(false);

//   const [harvestDate, setHarvestDate] = useState<Date | undefined>(
//     addMonths(new Date(), 4),
//   );
//   const [openHarvestDate, setOpenHarvestDate] = useState(false);

//   const [quantityInput, setQuantityInput] = useState("");
//   const [pricePerChickInput, setPricePerChickInput] = useState("");

//   useEffect(() => {
//     setMounted(true);
//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setIsOpen(false);
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, []);

//   const uniqueFarms = Array.from(
//     new Set(availableBuildings.map((b) => b.farmName)),
//   );

//   const filteredBuildings = selectedFarm
//     ? availableBuildings.filter((b) => b.farmName === selectedFarm)
//     : [];

//   const selectedBuilding = availableBuildings.find(
//     (b) => String(b.id) === buildingId,
//   );

//   function handleLoadDateChange(date: Date | undefined) {
//     setLoadDate(date);
//     if (date) setHarvestDate(addMonths(date, 4));
//   }

//   const cleanQuantity = Number(quantityInput.replace(/,/g, "")) || 0;
//   const cleanPricePerChick = Number(pricePerChickInput.replace(/,/g, "")) || 0;
//   const computedTotalCapital = cleanQuantity * cleanPricePerChick;

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     const formData = new FormData(e.currentTarget);
//     const batchName = formData.get("name") as string;

//     if (!selectedFarm) {
//       toast.error("Missing Field", {
//         description: "Please select a farm first.",
//       });
//       return;
//     }

//     if (!buildingId) {
//       toast.error("Missing Field", {
//         description: "Please select a building first.",
//       });
//       return;
//     }

//     if (!batchName || batchName.trim() === "") {
//       toast.error("Missing Field", {
//         description: "Please enter a Batch / Load Name.",
//       });
//       return;
//     }

//     if (!chickType) {
//       toast.error("Missing Field", {
//         description: "Please select the Type of Chick.",
//       });
//       return;
//     }

//     const today = new Date();
//     today.setHours(23, 59, 59, 999);

//     if (loadDate && loadDate > today) {
//       toast.error("Invalid Timeline", {
//         description: "You cannot set a Load Date in the future.",
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//       return;
//     }

//     // ---> STRICT VALIDATION ON SUBMIT: Enforce 7-Day Cleaning Period <---
//     const CLEANING_DAYS = 7;

//     if (loadDate && selectedBuilding?.lastHarvestDate) {
//       const lastHarvest = new Date(selectedBuilding.lastHarvestDate);
//       lastHarvest.setHours(0, 0, 0, 0);

//       const earliestLoadDate = addDays(lastHarvest, CLEANING_DAYS);

//       const newLoadD = new Date(loadDate);
//       newLoadD.setHours(0, 0, 0, 0);

//       if (newLoadD.getTime() < earliestLoadDate.getTime()) {
//         toast.error("Building Needs Cleaning!", {
//           description: `Harvested on ${format(lastHarvest, "MMM d")}. Needs a ${CLEANING_DAYS}-day rest. Earliest load date is ${format(earliestLoadDate, "MMM d, yyyy")}.`,
//           style: { backgroundColor: "red", color: "white", border: "none" },
//         });
//         return;
//       }
//     }

//     if (loadDate && harvestDate && harvestDate <= loadDate) {
//       toast.error("Invalid Timeline", {
//         description: "The estimated harvest date must be AFTER the load date.",
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//       return;
//     }

//     setLoading(true);

//     formData.set("name", batchName.toUpperCase().trim());

//     const customerName = formData.get("customerName") as string;
//     if (customerName) {
//       formData.set("customerName", customerName.toUpperCase().trim());
//     }

//     formData.set("buildingId", buildingId);
//     formData.set("chickType", chickType);
//     if (loadDate) formData.set("loadDate", format(loadDate, "yyyy-MM-dd"));
//     if (harvestDate)
//       formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));

//     if (quantityInput)
//       formData.set("actualQuantityLoad", String(cleanQuantity));

//     const sp = formData.get("sellingPrice") as string;
//     if (sp) formData.set("sellingPrice", sp.replace(/,/g, ""));

//     formData.set("initialCapital", String(computedTotalCapital));

//     const result = await addLoad(formData);

//     if (result.error) {
//       toast.error("Error", {
//         description: result.error,
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//     } else {
//       toast.success("Success!", {
//         description: "Load details saved and building activated.",
//         style: { backgroundColor: "blue", color: "white", border: "none" },
//       });

//       setIsOpen(false);
//       setSelectedFarm("");
//       setBuildingId("");
//       setChickType("");
//       setQuantityInput("");
//       setPricePerChickInput("");

//       if (result.id) {
//         router.push(`/production/loading?newId=${result.id}`);
//         setTimeout(() => {
//           router.replace("/production/loading", { scroll: false });
//         }, 4000);
//       }
//     }
//     setLoading(false);
//   }

//   return (
//     <>
//       <Button
//         onClick={() => setIsOpen(true)}
//         className="h-11 px-6 rounded-xl font-bold shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
//       >
//         <HenIcon className="h-6 w-6 mr-2" />
//         <span className="truncate">Load New Chicks</span>
//       </Button>

//       {isOpen &&
//         mounted &&
//         createPortal(
//           <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//             <div className="fixed z-101 w-full max-w-3xl border border-border/50 bg-background shadow-2xl sm:rounded-[2.5rem] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
//               <div className="flex justify-between items-center p-6 pb-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 z-10 shrink-0">
//                 <div>
//                   <h2 className="text-2xl font-black text-blue-600">
//                     New Load Entry
//                   </h2>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Select a Farm, choose an available Building, and set batch
//                     details.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="p-2 rounded-full hover:bg-secondary transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
//                 <form
//                   onSubmit={handleSubmit}
//                   className="space-y-6"
//                   id="addLoadForm"
//                 >
//                   <div className="grid md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
//                     <div className="space-y-2">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         1. Select Farm <span className="text-red-500">*</span>
//                       </label>
//                       <Popover
//                         open={openFarmSearch}
//                         onOpenChange={setOpenFarmSearch}
//                       >
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             role="combobox"
//                             className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal"
//                           >
//                             <div className="flex items-center gap-2 overflow-hidden">
//                               <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
//                               <span className="truncate font-bold text-sm">
//                                 {selectedFarm || "Choose a Farm..."}
//                               </span>
//                             </div>
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200 shadow-xl">
//                           <Command>
//                             <CommandInput placeholder="Search farm..." />
//                             <CommandList className="max-h-[200px]">
//                               <CommandEmpty>No farms available.</CommandEmpty>
//                               <CommandGroup>
//                                 {uniqueFarms.map((farm) => (
//                                   <CommandItem
//                                     key={farm}
//                                     value={farm}
//                                     onSelect={(currentValue) => {
//                                       const actualFarm =
//                                         uniqueFarms.find(
//                                           (f) =>
//                                             f.toLowerCase() ===
//                                             currentValue.toLowerCase(),
//                                         ) || currentValue;

//                                       setSelectedFarm(actualFarm);
//                                       setBuildingId("");
//                                       setOpenFarmSearch(false);
//                                     }}
//                                     className="py-3 px-4 cursor-pointer"
//                                   >
//                                     <span className="font-bold text-sm">
//                                       {farm}
//                                     </span>
//                                     <Check
//                                       className={cn(
//                                         "ml-auto h-4 w-4 text-blue-600",
//                                         selectedFarm === farm
//                                           ? "opacity-100"
//                                           : "opacity-0",
//                                       )}
//                                     />
//                                   </CommandItem>
//                                 ))}
//                               </CommandGroup>
//                             </CommandList>
//                           </Command>
//                         </PopoverContent>
//                       </Popover>
//                     </div>

//                     <div className="space-y-2">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         2. Select Building{" "}
//                         <span className="text-red-500">*</span>
//                       </label>
//                       <Popover
//                         open={openBuildingSearch}
//                         onOpenChange={setOpenBuildingSearch}
//                       >
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             role="combobox"
//                             disabled={!selectedFarm}
//                             className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal disabled:opacity-50"
//                           >
//                             {selectedBuilding ? (
//                               <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
//                                 <span className="font-bold text-sm truncate">
//                                   {selectedBuilding.name}
//                                 </span>
//                               </div>
//                             ) : (
//                               <span className="text-muted-foreground">
//                                 {selectedFarm
//                                   ? "Choose a Building..."
//                                   : "Pick a Farm first"}
//                               </span>
//                             )}
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200 shadow-xl">
//                           <Command>
//                             <CommandInput placeholder="Search building..." />
//                             <CommandList className="max-h-[200px]">
//                               <CommandEmpty>
//                                 No empty buildings found.
//                               </CommandEmpty>
//                               <CommandGroup>
//                                 {filteredBuildings.map((b) => (
//                                   <CommandItem
//                                     key={b.id}
//                                     value={b.name}
//                                     onSelect={() => {
//                                       setBuildingId(String(b.id));
//                                       setOpenBuildingSearch(false);

//                                       // If the current loadDate is invalid based on the new building, reset it
//                                       if (b.lastHarvestDate && loadDate) {
//                                         const CLEANING_DAYS = 7;
//                                         const lastHarvest = new Date(
//                                           b.lastHarvestDate,
//                                         );
//                                         lastHarvest.setHours(0, 0, 0, 0);

//                                         const earliestLoadDate = addDays(
//                                           lastHarvest,
//                                           CLEANING_DAYS,
//                                         );

//                                         const currentLoadDate = new Date(
//                                           loadDate,
//                                         );
//                                         currentLoadDate.setHours(0, 0, 0, 0);

//                                         if (
//                                           currentLoadDate.getTime() <
//                                           earliestLoadDate.getTime()
//                                         ) {
//                                           setLoadDate(undefined);
//                                         }
//                                       }
//                                     }}
//                                     className="py-3 px-4 cursor-pointer"
//                                   >
//                                     <span className="font-bold text-sm">
//                                       {b.name}
//                                     </span>
//                                     <Check
//                                       className={cn(
//                                         "ml-auto h-4 w-4 text-blue-600",
//                                         buildingId === String(b.id)
//                                           ? "opacity-100"
//                                           : "opacity-0",
//                                       )}
//                                     />
//                                   </CommandItem>
//                                 ))}
//                               </CommandGroup>
//                             </CommandList>
//                           </Command>
//                         </PopoverContent>
//                       </Popover>
//                     </div>
//                   </div>

//                   <div className="grid md:grid-cols-2 gap-5">
//                     <div className="space-y-2">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         Load Date <span className="text-red-500">*</span>
//                       </label>
//                       <Popover
//                         open={openLoadDate}
//                         onOpenChange={setOpenLoadDate}
//                       >
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             className={cn(
//                               "w-full h-12 rounded-xl justify-between border-input px-4 font-normal",
//                               !loadDate && "text-muted-foreground",
//                             )}
//                           >
//                             <div className="flex items-center">
//                               <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
//                               {loadDate
//                                 ? format(loadDate, "MMM d, yyyy")
//                                 : "Pick date"}
//                             </div>
//                             <ChevronDown className="h-4 w-4 opacity-50" />
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent
//                           className="w-auto p-0 z-200"
//                           align="start"
//                         >
//                           <Calendar
//                             mode="single"
//                             selected={loadDate}
//                             defaultMonth={loadDate || new Date()}
//                             captionLayout="dropdown"
//                             fromYear={2020}
//                             toYear={new Date().getFullYear()}
//                             onSelect={(date) => {
//                               handleLoadDateChange(date);
//                               setOpenLoadDate(false);
//                             }}
//                             disabled={(date) => {
//                               const today = new Date();
//                               today.setHours(23, 59, 59, 999);
//                               if (date > today) return true; // Block Future Dates

//                               // ---> THE FIX: BLOCK 7 DAYS AFTER LAST HARVEST <---
//                               if (selectedBuilding?.lastHarvestDate) {
//                                 const CLEANING_DAYS = 7;
//                                 const lastHarvest = new Date(
//                                   selectedBuilding.lastHarvestDate,
//                                 );
//                                 lastHarvest.setHours(0, 0, 0, 0);

//                                 const earliestLoadDate = addDays(
//                                   lastHarvest,
//                                   CLEANING_DAYS,
//                                 );

//                                 const checkDate = new Date(date);
//                                 checkDate.setHours(0, 0, 0, 0);

//                                 if (
//                                   checkDate.getTime() <
//                                   earliestLoadDate.getTime()
//                                 )
//                                   return true;
//                               }

//                               return false;
//                             }}
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>

//                       {/* HELPER TEXT SHOWING MANDATORY REST */}
//                       {selectedBuilding?.lastHarvestDate && (
//                         <div className="flex flex-col mt-1">
//                           <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
//                             Last Harvested:{" "}
//                             {format(
//                               new Date(selectedBuilding.lastHarvestDate),
//                               "MMM d, yyyy",
//                             )}
//                           </p>
//                           <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
//                             (Locked for 7-Day Sanitation)
//                           </p>
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-2.5">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         Est Harvest{" "}
//                         <span className="text-red-500 lowercase tracking-normal text-[10px] ml-1 opacity-80">
//                           (4 Months Estimated)
//                         </span>
//                       </label>
//                       <Popover
//                         open={openHarvestDate}
//                         onOpenChange={setOpenHarvestDate}
//                       >
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             className={cn(
//                               "w-full h-12 rounded-xl justify-between border-input font-normal px-4",
//                               !harvestDate && "text-muted-foreground",
//                             )}
//                           >
//                             <div className="flex items-center">
//                               <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
//                               {harvestDate
//                                 ? format(harvestDate, "MMM d, yyyy")
//                                 : "Pick date"}
//                             </div>
//                             <ChevronDown className="h-4 w-4 opacity-50" />
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent
//                           className="w-auto p-0 z-[00"
//                           align="start"
//                         >
//                           <Calendar
//                             mode="single"
//                             selected={harvestDate}
//                             defaultMonth={harvestDate || new Date()}
//                             captionLayout="dropdown"
//                             fromYear={2020}
//                             toYear={new Date().getFullYear() + 5} // Allow future planning
//                             onSelect={(date) => {
//                               setHarvestDate(date);
//                               setOpenHarvestDate(false); // Auto-close
//                             }}
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </div>
//                   </div>

//                   <div className="grid md:grid-cols-3 gap-5">
//                     <div className="space-y-2">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         Batch Name <span className="text-red-500">*</span>
//                       </label>
//                       <Input
//                         name="name"
//                         required
//                         placeholder="e.g. Loading 1"
//                         className="h-12 rounded-xl border-input px-4 font-bold uppercase"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         Chick Type <span className="text-red-500">*</span>
//                       </label>
//                       <Popover
//                         open={openChickType}
//                         onOpenChange={setOpenChickType}
//                       >
//                         <PopoverTrigger asChild>
//                           <Button
//                             variant="outline"
//                             role="combobox"
//                             className="w-full h-12 justify-between rounded-xl font-normal border-input overflow-hidden px-4"
//                           >
//                             <span className="truncate">
//                               {chickType || "Select breed..."}
//                             </span>
//                             <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
//                           <Command>
//                             <CommandInput
//                               placeholder="Search breed..."
//                               className="h-11"
//                             />
//                             <CommandList className="max-h-[200px] overflow-y-auto">
//                               <CommandEmpty>No breed found.</CommandEmpty>
//                               <CommandGroup>
//                                 {chickBreeds.map((breed) => (
//                                   <CommandItem
//                                     key={breed}
//                                     value={breed}
//                                     onSelect={(v) => {
//                                       const selectedBreed =
//                                         chickBreeds.find(
//                                           (b) =>
//                                             b.toLowerCase() === v.toLowerCase(),
//                                         ) || v;
//                                       setChickType(selectedBreed);
//                                       setOpenChickType(false); // Auto-close
//                                     }}
//                                     className="py-2.5"
//                                   >
//                                     <Check
//                                       className={cn(
//                                         "mr-2 h-4 w-4",
//                                         chickType === breed
//                                           ? "opacity-100"
//                                           : "opacity-0",
//                                       )}
//                                     />
//                                     {breed}
//                                   </CommandItem>
//                                 ))}
//                               </CommandGroup>
//                             </CommandList>
//                           </Command>
//                         </PopoverContent>
//                       </Popover>
//                     </div>

//                     <div className="space-y-2.5">
//                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                         Customer / Source
//                       </label>
//                       <Input
//                         name="customerName"
//                         placeholder="e.g. Magnolia"
//                         className="h-12 rounded-xl border-input px-4 uppercase"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid md:grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
//                     <div
//                       className="space-y-2"
//                       onKeyUp={(e) => {
//                         const target = e.target as HTMLInputElement;
//                         if (target.value !== undefined)
//                           setQuantityInput(target.value);
//                       }}
//                     >
//                       <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
//                         Quantity *
//                       </label>
//                       <FormattedNumberInput
//                         name="quantity"
//                         required
//                         placeholder="10,000"
//                         className="h-11 rounded-xl bg-background font-bold text-lg border-blue-200 focus-visible:ring-blue-500"
//                       />
//                     </div>

//                     <div
//                       className="space-y-2"
//                       onKeyUp={(e) => {
//                         const target = e.target as HTMLInputElement;
//                         if (target.value !== undefined)
//                           setPricePerChickInput(target.value);
//                       }}
//                     >
//                       <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500">
//                         Price per Chick (₱) *
//                       </label>
//                       <FormattedNumberInput
//                         name="pricePerChick"
//                         required
//                         allowDecimals={true}
//                         placeholder="e.g. 40.00"
//                         className="h-11 rounded-xl bg-background font-bold border-emerald-200 focus-visible:ring-emerald-500"
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
//                         Target Selling (₱)
//                       </label>
//                       <FormattedNumberInput
//                         name="sellingPrice"
//                         allowDecimals={true}
//                         placeholder="210.00"
//                         className="h-11 rounded-xl bg-background font-bold"
//                       />
//                     </div>
//                   </div>

//                   <div className="bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300">
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600">
//                         <Wallet className="w-5 h-5" />
//                       </div>
//                       <div>
//                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
//                           Calculated Initial Capital
//                         </p>
//                         <p className="text-xs font-bold text-muted-foreground mt-0.5">
//                           {cleanQuantity > 0 && cleanPricePerChick > 0
//                             ? `${cleanQuantity.toLocaleString()} birds × ₱${cleanPricePerChick.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
//                             : "Enter Quantity and Price"}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
//                       ₱
//                       {computedTotalCapital.toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </div>
//                   </div>
//                 </form>
//               </div>

//               <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   onClick={() => setIsOpen(false)}
//                   className="h-12 px-6 rounded-xl font-bold"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   form="addLoadForm"
//                   disabled={loading || computedTotalCapital <= 0}
//                   className="h-12 px-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="mr-2 h-5 w-5" /> Save & Load
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </div>,
//           document.body,
//         )}
//     </>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addLoad } from "./actions";
import {
  X,
  Loader2,
  Save,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  MapPin,
  Wallet,
  Bird,
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// SHADCN UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Image from "next/image";
import henIcon from "@/public/hen.png";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

const HenIcon = ({ className }: { className?: string }) => (
  <span className={`relative block shrink-0 ${className ?? ""}`}>
    <Image
      src={henIcon}
      alt="Hen"
      fill
      sizes="64px"
      className="object-contain brightness-0 invert"
    />
  </span>
);

const chickBreeds = [
  "Cobb 500 (Broiler)",
  "Ross 308 (Broiler)",
  "Arbor Acres (Broiler)",
  "Dekalb White (Layer)",
  "ISA Brown (Layer)",
  "Lohmann (Layer)",
  "Babcock White (Layer)",
  "Babcock Brown (Layer)",
  "Sasso (Colored/Free-Range)",
  "Kabir (Colored/Free-Range)",
  "Philippine Native",
  "Other / Mixed",
];

export default function AddLoadModal({
  availableBuildings,
}: {
  availableBuildings: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [buildingId, setBuildingId] = useState("");
  const [openBuildingSearch, setOpenBuildingSearch] = useState(false);

  const [chickType, setChickType] = useState("");
  const [openChickType, setOpenChickType] = useState(false);

  const [loadDate, setLoadDate] = useState<Date | undefined>(new Date());
  const [openLoadDate, setOpenLoadDate] = useState(false);

  const [harvestDate, setHarvestDate] = useState<Date | undefined>(
    addMonths(new Date(), 4),
  );
  const [openHarvestDate, setOpenHarvestDate] = useState(false);

  // ---> NEW STATE FOR SPLIT QUANTITIES <---
  const [paidQuantityInput, setPaidQuantityInput] = useState("");
  const [allowanceQuantityInput, setAllowanceQuantityInput] = useState("");
  const [pricePerChickInput, setPricePerChickInput] = useState("");

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const uniqueFarms = Array.from(
    new Set(availableBuildings.map((b) => b.farmName)),
  );

  const filteredBuildings = selectedFarm
    ? availableBuildings.filter((b) => b.farmName === selectedFarm)
    : [];

  const selectedBuilding = availableBuildings.find(
    (b) => String(b.id) === buildingId,
  );

  function handleLoadDateChange(date: Date | undefined) {
    setLoadDate(date);
    if (date) setHarvestDate(addMonths(date, 4));
  }

  // ---> NEW MATH LOGIC <---
  const cleanPaidQuantity = Number(paidQuantityInput.replace(/,/g, "")) || 0;
  const cleanAllowanceQuantity =
    Number(allowanceQuantityInput.replace(/,/g, "")) || 0;
  const cleanPricePerChick = Number(pricePerChickInput.replace(/,/g, "")) || 0;

  const totalFlockSize = cleanPaidQuantity + cleanAllowanceQuantity;
  const computedTotalCapital = cleanPaidQuantity * cleanPricePerChick;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const batchName = formData.get("name") as string;

    if (!selectedFarm || !buildingId || !batchName || !chickType) {
      toast.error("Missing Field", {
        description: "Please fill in all required setup details.",
      });
      return;
    }

    if (cleanPaidQuantity <= 0) {
      toast.error("Invalid Quantity", {
        description: "You must enter a Paid Quantity greater than zero.",
      });
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (loadDate && loadDate > today) {
      toast.error("Invalid Timeline", {
        description: "You cannot set a Load Date in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    // Enforce 7-Day Cleaning Period
    const CLEANING_DAYS = 7;
    if (loadDate && selectedBuilding?.lastHarvestDate) {
      const lastHarvest = new Date(selectedBuilding.lastHarvestDate);
      lastHarvest.setHours(0, 0, 0, 0);

      const earliestLoadDate = addDays(lastHarvest, CLEANING_DAYS);
      const newLoadD = new Date(loadDate);
      newLoadD.setHours(0, 0, 0, 0);

      if (newLoadD.getTime() < earliestLoadDate.getTime()) {
        toast.error("Building Needs Cleaning!", {
          description: `Harvested on ${format(lastHarvest, "MMM d")}. Needs a ${CLEANING_DAYS}-day rest. Earliest load date is ${format(earliestLoadDate, "MMM d, yyyy")}.`,
          style: { backgroundColor: "red", color: "white", border: "none" },
        });
        return;
      }
    }

    if (loadDate && harvestDate && harvestDate <= loadDate) {
      toast.error("Invalid Timeline", {
        description: "The estimated harvest date must be AFTER the load date.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    setLoading(true);

    // Standardize text formats
    formData.set("name", batchName.toUpperCase().trim());
    const customerName = formData.get("customerName") as string;
    if (customerName) {
      formData.set("customerName", customerName.toUpperCase().trim());
    }

    formData.set("buildingId", buildingId);
    formData.set("chickType", chickType);
    if (loadDate) formData.set("loadDate", format(loadDate, "yyyy-MM-dd"));
    if (harvestDate)
      formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));

    // Ensure the cleaned numerical values are pushed to the formData
    formData.set("paidQuantity", String(cleanPaidQuantity));
    formData.set("allowanceQuantity", String(cleanAllowanceQuantity));

    const sp = formData.get("sellingPrice") as string;
    if (sp) formData.set("sellingPrice", sp.replace(/,/g, ""));

    const result = await addLoad(formData);

    if (result.error) {
      toast.error("Error", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Success!", {
        description: "Load details saved and building activated.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });

      setIsOpen(false);
      // Reset Form State
      setSelectedFarm("");
      setBuildingId("");
      setChickType("");
      setPaidQuantityInput("");
      setAllowanceQuantityInput("");
      setPricePerChickInput("");

      if (result.id) {
        router.push(`/production/loading?newId=${result.id}`);
        setTimeout(() => {
          router.replace("/production/loading", { scroll: false });
        }, 4000);
      }
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl font-bold shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
      >
        <HenIcon className="h-6 w-6 mr-2" />
        <span className="truncate">Load New Chicks</span>
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-4xl border border-border/50 bg-background shadow-2xl sm:rounded-[2.5rem] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 pb-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-blue-600">
                    New Load Entry
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a Farm, choose an available Building, and set batch
                    details.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  id="addLoadForm"
                >
                  <div className="grid md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        1. Select Farm <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={openFarmSearch}
                        onOpenChange={setOpenFarmSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="truncate font-bold text-sm">
                                {selectedFarm || "Choose a Farm..."}
                              </span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200 shadow-xl">
                          <Command>
                            <CommandInput placeholder="Search farm..." />
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty>No farms available.</CommandEmpty>
                              <CommandGroup>
                                {uniqueFarms.map((farm) => (
                                  <CommandItem
                                    key={farm}
                                    value={farm}
                                    onSelect={(currentValue) => {
                                      const actualFarm =
                                        uniqueFarms.find(
                                          (f) =>
                                            f.toLowerCase() ===
                                            currentValue.toLowerCase(),
                                        ) || currentValue;

                                      setSelectedFarm(actualFarm);
                                      setBuildingId("");
                                      setOpenFarmSearch(false);
                                    }}
                                    className="py-3 px-4 cursor-pointer"
                                  >
                                    <span className="font-bold text-sm">
                                      {farm}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4 text-blue-600",
                                        selectedFarm === farm
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        2. Select Building{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={openBuildingSearch}
                        onOpenChange={setOpenBuildingSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedFarm}
                            className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal disabled:opacity-50"
                          >
                            {selectedBuilding ? (
                              <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                                <span className="font-bold text-sm truncate">
                                  {selectedBuilding.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {selectedFarm
                                  ? "Choose a Building..."
                                  : "Pick a Farm first"}
                              </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200 shadow-xl">
                          <Command>
                            <CommandInput placeholder="Search building..." />
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty>
                                No empty buildings found.
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredBuildings.map((b) => (
                                  <CommandItem
                                    key={b.id}
                                    value={b.name}
                                    onSelect={() => {
                                      setBuildingId(String(b.id));
                                      setOpenBuildingSearch(false);

                                      // If the current loadDate is invalid based on the new building, reset it
                                      if (b.lastHarvestDate && loadDate) {
                                        const CLEANING_DAYS = 7;
                                        const lastHarvest = new Date(
                                          b.lastHarvestDate,
                                        );
                                        lastHarvest.setHours(0, 0, 0, 0);

                                        const earliestLoadDate = addDays(
                                          lastHarvest,
                                          CLEANING_DAYS,
                                        );

                                        const currentLoadDate = new Date(
                                          loadDate,
                                        );
                                        currentLoadDate.setHours(0, 0, 0, 0);

                                        if (
                                          currentLoadDate.getTime() <
                                          earliestLoadDate.getTime()
                                        ) {
                                          setLoadDate(undefined);
                                        }
                                      }
                                    }}
                                    className="py-3 px-4 cursor-pointer"
                                  >
                                    <span className="font-bold text-sm">
                                      {b.name}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4 text-blue-600",
                                        buildingId === String(b.id)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* HELPER TEXT SHOWING MANDATORY REST */}
                      {selectedBuilding?.lastHarvestDate && (
                        <div className="flex flex-col mt-1">
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                            Last Harvested:{" "}
                            {format(
                              new Date(selectedBuilding.lastHarvestDate),
                              "MMM d, yyyy",
                            )}
                          </p>
                          <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
                            (Locked for 7-Day Sanitation)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Load Date <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={openLoadDate}
                        onOpenChange={setOpenLoadDate}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 rounded-xl justify-between border-input px-4 font-normal",
                              !loadDate && "text-muted-foreground",
                            )}
                          >
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                              {loadDate
                                ? format(loadDate, "MMM d, yyyy")
                                : "Pick date"}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-200"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={loadDate}
                            defaultMonth={loadDate || new Date()}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear()}
                            onSelect={(date) => {
                              handleLoadDateChange(date);
                              setOpenLoadDate(false);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(23, 59, 59, 999);
                              if (date > today) return true; // Block Future Dates

                              if (selectedBuilding?.lastHarvestDate) {
                                const CLEANING_DAYS = 7;
                                const lastHarvest = new Date(
                                  selectedBuilding.lastHarvestDate,
                                );
                                lastHarvest.setHours(0, 0, 0, 0);

                                const earliestLoadDate = addDays(
                                  lastHarvest,
                                  CLEANING_DAYS,
                                );

                                const checkDate = new Date(date);
                                checkDate.setHours(0, 0, 0, 0);

                                if (
                                  checkDate.getTime() <
                                  earliestLoadDate.getTime()
                                )
                                  return true;
                              }

                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Est Harvest{" "}
                        <span className="text-red-500 lowercase tracking-normal text-[10px] ml-1 opacity-80">
                          (4 Months Estimated)
                        </span>
                      </label>
                      <Popover
                        open={openHarvestDate}
                        onOpenChange={setOpenHarvestDate}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 rounded-xl justify-between border-input font-normal px-4",
                              !harvestDate && "text-muted-foreground",
                            )}
                          >
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                              {harvestDate
                                ? format(harvestDate, "MMM d, yyyy")
                                : "Pick date"}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-200"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={harvestDate}
                            defaultMonth={harvestDate || new Date()}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear() + 5}
                            onSelect={(date) => {
                              setHarvestDate(date);
                              setOpenHarvestDate(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Batch Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        name="name"
                        required
                        placeholder="e.g. Loading 1"
                        className="h-12 rounded-xl border-input px-4 font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Chick Type <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={openChickType}
                        onOpenChange={setOpenChickType}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-12 justify-between rounded-xl font-normal border-input overflow-hidden px-4"
                          >
                            <span className="truncate">
                              {chickType || "Select breed..."}
                            </span>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                          <Command>
                            <CommandInput
                              placeholder="Search breed..."
                              className="h-11"
                            />
                            <CommandList className="max-h-[200px] overflow-y-auto">
                              <CommandEmpty>No breed found.</CommandEmpty>
                              <CommandGroup>
                                {chickBreeds.map((breed) => (
                                  <CommandItem
                                    key={breed}
                                    value={breed}
                                    onSelect={(v) => {
                                      const selectedBreed =
                                        chickBreeds.find(
                                          (b) =>
                                            b.toLowerCase() === v.toLowerCase(),
                                        ) || v;
                                      setChickType(selectedBreed);
                                      setOpenChickType(false);
                                    }}
                                    className="py-2.5"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        chickType === breed
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {breed}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Supplier / Source
                      </label>
                      <Input
                        name="customerName"
                        placeholder="e.g. Magnolia"
                        className="h-12 rounded-xl border-input px-4 uppercase"
                      />
                    </div>
                  </div>

                  {/* ---> NEW FINANCIAL ENTRY GRID <--- */}
                  <div className="grid md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                    <div
                      className="space-y-2"
                      onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value !== undefined)
                          setPaidQuantityInput(target.value);
                      }}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                        Paid Qty *
                      </label>
                      <FormattedNumberInput
                        name="paidQuantity"
                        required
                        placeholder="10,000"
                        className="h-11 rounded-xl bg-background font-bold text-lg border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>

                    <div
                      className="space-y-2"
                      onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value !== undefined)
                          setAllowanceQuantityInput(target.value);
                      }}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-500">
                        Allowance (Free)
                      </label>
                      <FormattedNumberInput
                        name="allowanceQuantity"
                        placeholder="e.g. 600"
                        className="h-11 rounded-xl bg-background font-bold text-lg border-amber-200 focus-visible:ring-amber-500"
                      />
                    </div>

                    <div
                      className="space-y-2"
                      onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value !== undefined)
                          setPricePerChickInput(target.value);
                      }}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500">
                        Price/Chick *
                      </label>
                      <FormattedNumberInput
                        name="pricePerChick"
                        required
                        allowDecimals={true}
                        placeholder="₱40.00"
                        className="h-11 rounded-xl bg-background font-bold border-emerald-200 focus-visible:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Target Selling (₱)
                      </label>
                      <FormattedNumberInput
                        name="sellingPrice"
                        allowDecimals={true}
                        placeholder="300.00"
                        className="h-11 rounded-xl bg-background font-bold"
                      />
                    </div>
                  </div>

                  {/* CALCULATION SUMMARY */}
                  <div className="bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 flex flex-col items-center">
                        <Wallet className="w-5 h-5 mb-1" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                          Calculated Capital
                        </p>
                        <p className="text-xs font-bold text-muted-foreground mt-0.5">
                          {cleanPaidQuantity > 0 && cleanPricePerChick > 0
                            ? `${cleanPaidQuantity.toLocaleString()} birds × ₱${cleanPricePerChick.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "Enter Paid Qty & Price"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₱
                        {computedTotalCapital.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <Bird className="w-3 h-3" /> Total Flock:{" "}
                        {totalFlockSize.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-12 px-6 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="addLoadForm"
                  disabled={
                    loading || cleanPaidQuantity <= 0 || cleanPricePerChick <= 0
                  }
                  className="h-12 px-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" /> Save & Load
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
