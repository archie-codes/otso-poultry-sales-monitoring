// "use client";

// import { useState, useMemo } from "react";
// import { logFeedDelivery } from "./actions";
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
// } from "@/components/ui/command";
// import {
//   Loader2,
//   PackagePlus,
//   CalendarIcon,
//   ChevronDown,
//   Receipt,
//   Check,
//   PlusCircle,
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

// // We keep a few defaults just so the box isn't empty on her very first day!
// const DEFAULT_SUPPLIERS = [
//   "NEW HOPE CENTRAL LUZON AGRICULTURE INC.",
//   "CIRCLE AND CIRCLE FEEDMILL LTD. CO.",
//   "GR8 MULTI-PURPOSE COOPERATIVE",
// ];
// const DEFAULT_FEEDS = [
//   "STARTER",
//   "GROWER",
//   "BOOSTER",
//   "FINISHER",
//   "LAYER MASH",
// ];

// export default function AddFeedDeliveryModal({
//   historicalSuppliers = [],
//   historicalFeeds = [],
// }: {
//   historicalSuppliers?: string[];
//   historicalFeeds?: string[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
//     new Date(),
//   );
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

//   // COMBINE DEFAULTS + DATABASE HISTORY
//   const allSuppliers = useMemo(
//     () => Array.from(new Set([...DEFAULT_SUPPLIERS, ...historicalSuppliers])),
//     [historicalSuppliers],
//   );
//   const allFeeds = useMemo(
//     () => Array.from(new Set([...DEFAULT_FEEDS, ...historicalFeeds])),
//     [historicalFeeds],
//   );

//   // Combobox States & Live Search Tracking
//   const [openSupplier, setOpenSupplier] = useState(false);
//   const [supplier, setSupplier] = useState("");
//   const [supplierSearch, setSupplierSearch] = useState("");

//   const [openFeed, setOpenFeed] = useState(false);
//   const [feedType, setFeedType] = useState("");
//   const [feedSearch, setFeedSearch] = useState("");

//   // Live Math States
//   const [quantity, setQuantity] = useState("");
//   const [unitPrice, setUnitPrice] = useState("");
//   const [cashBond, setCashBond] = useState("");

//   const cleanQty = Number(quantity.replace(/,/g, "")) || 0;
//   const cleanPrice = Number(unitPrice.replace(/,/g, "")) || 0;
//   const cleanBond = Number(cashBond.replace(/,/g, "")) || 0;

//   const totalCashBond = cleanQty * cleanBond;
//   const totalPayment = cleanQty * cleanPrice;
//   const actualReceipt = totalCashBond + totalPayment;

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!supplier) return toast.error("Please select or type a Supplier.");
//     if (!deliveryDate) return toast.error("Delivery Date is required.");

//     // ---> FOOLPROOF DATE SAFETY LOCK <---
//     const today = new Date();
//     today.setHours(23, 59, 59, 999); // Allow any time today
//     if (deliveryDate.getTime() > today.getTime()) {
//       return toast.error("Invalid Date", {
//         description: "Delivery date cannot be in the future.",
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//     }

//     if (!feedType)
//       return toast.error("Please select or type a Feed Description.");
//     if (!quantity || cleanQty <= 0)
//       return toast.error("Quantity must be greater than zero.");
//     if (!unitPrice || cleanPrice <= 0)
//       return toast.error("Unit Price is required.");
//     if (cashBond === "")
//       return toast.error("Cash Bond is required. Enter 0 if none.");

//     setLoading(true);
//     const formData = new FormData(e.currentTarget);
//     formData.set("deliveryDate", format(deliveryDate, "yyyy-MM-dd"));
//     formData.set("quantity", String(cleanQty));
//     formData.set("unitPrice", String(cleanPrice));
//     formData.set("cashBond", String(cleanBond));

//     // Force uppercase to keep the database perfectly clean
//     formData.set("supplierName", supplier.toUpperCase());
//     formData.set("feedType", feedType.toUpperCase());

//     const result = await logFeedDelivery(formData);

//     if (result.error) {
//       toast.error(result.error);
//     } else {
//       toast.success("Delivery logged successfully!");
//       setIsOpen(false);
//       setQuantity("");
//       setUnitPrice("");
//       setCashBond("");
//       setSupplier("");
//       setFeedType("");
//       setSupplierSearch("");
//       setFeedSearch("");
//     }
//     setLoading(false);
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm h-11 px-6">
//           <PackagePlus className="w-4 h-4 mr-2" /> Receive Delivery
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-lg rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
//         <div className="bg-blue-600 p-6 text-white">
//           <DialogTitle className="text-2xl font-black flex items-center gap-2">
//             <PackagePlus className="w-6 h-6" /> Log Warehouse Delivery
//           </DialogTitle>
//           <p className="text-blue-100 text-sm font-medium mt-1">
//             Record incoming feeds. Type a new supplier name to save it to the
//             system.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-card">
//           {/* ---> SMART SUPPLIER COMBOBOX <--- */}
//           <div className="space-y-1.5">
//             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//               Supplier Name *
//             </label>
//             <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   role="combobox"
//                   aria-expanded={openSupplier}
//                   className={cn(
//                     "w-full h-11 rounded-xl justify-between border-input bg-secondary/50 font-bold px-3",
//                     !supplier && "text-muted-foreground",
//                   )}
//                 >
//                   <span className="truncate">
//                     {supplier ? supplier : "Search or type new supplier..."}
//                   </span>
//                   <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-[400px] p-0" align="start">
//                 <Command>
//                   <CommandInput
//                     placeholder="Search or type new supplier..."
//                     value={supplierSearch}
//                     onValueChange={setSupplierSearch}
//                     className="h-10"
//                   />
//                   <CommandEmpty>No existing supplier found.</CommandEmpty>
//                   <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
//                     {allSuppliers.map((s) => (
//                       <CommandItem
//                         key={s}
//                         value={s}
//                         onSelect={() => {
//                           setSupplier(s);
//                           setOpenSupplier(false);
//                           setSupplierSearch("");
//                         }}
//                         className="font-bold cursor-pointer"
//                       >
//                         <Check
//                           className={cn(
//                             "mr-2 h-4 w-4 text-blue-600",
//                             supplier === s ? "opacity-100" : "opacity-0",
//                           )}
//                         />
//                         {s}
//                       </CommandItem>
//                     ))}

//                     {/* ---> THE MAGIC ADD BUTTON <--- */}
//                     {supplierSearch &&
//                       !allSuppliers.some(
//                         (s) => s.toLowerCase() === supplierSearch.toLowerCase(),
//                       ) && (
//                         <CommandItem
//                           value={supplierSearch}
//                           onSelect={() => {
//                             setSupplier(supplierSearch.toUpperCase());
//                             setOpenSupplier(false);
//                             setSupplierSearch("");
//                           }}
//                           className="font-black text-blue-600 cursor-pointer bg-blue-50/50 mt-1"
//                         >
//                           <PlusCircle className="mr-2 h-4 w-4" />
//                           Add "{supplierSearch.toUpperCase()}" as new
//                         </CommandItem>
//                       )}
//                   </CommandGroup>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-1.5">
//               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                 Date Delivered *
//               </label>
//               <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className={cn(
//                       "w-full h-11 rounded-xl justify-between border-input font-normal px-3",
//                       !deliveryDate && "text-muted-foreground",
//                     )}
//                   >
//                     <div className="flex items-center text-sm">
//                       <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
//                       <span className="truncate">
//                         {deliveryDate
//                           ? format(deliveryDate, "MMM d, yyyy")
//                           : "Pick date"}
//                       </span>
//                     </div>
//                     <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0 z-200" align="start">
//                   <Calendar
//                     mode="single"
//                     selected={deliveryDate}
//                     defaultMonth={deliveryDate || new Date()}
//                     // ---> SHADCN DROPDOWN UPGRADE <---
//                     captionLayout="dropdown"
//                     fromYear={2020}
//                     toYear={new Date().getFullYear()}
//                     onSelect={(date) => {
//                       setDeliveryDate(date);
//                       setIsCalendarOpen(false); // Auto close
//                     }}
//                     disabled={(date) => {
//                       // Block Future Dates!
//                       const today = new Date();
//                       today.setHours(23, 59, 59, 999);
//                       if (date > today) return true;
//                       return false;
//                     }}
//                     initialFocus
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>

//             {/* ---> SMART FEED TYPE COMBOBOX <--- */}
//             <div className="space-y-1.5">
//               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
//                 Description *
//               </label>
//               <Popover open={openFeed} onOpenChange={setOpenFeed}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     role="combobox"
//                     aria-expanded={openFeed}
//                     className={cn(
//                       "w-full h-11 rounded-xl justify-between border-input bg-secondary/50 font-bold px-3",
//                       !feedType && "text-muted-foreground",
//                     )}
//                   >
//                     <span className="truncate">
//                       {feedType ? feedType : "Search or type new..."}
//                     </span>
//                     <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-full p-0 z-200" align="start">
//                   <Command>
//                     <CommandInput
//                       placeholder="Search or type new..."
//                       value={feedSearch}
//                       onValueChange={setFeedSearch}
//                       className="h-10"
//                     />
//                     <CommandEmpty>No feed type found.</CommandEmpty>
//                     <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
//                       {allFeeds.map((f) => (
//                         <CommandItem
//                           key={f}
//                           value={f}
//                           onSelect={() => {
//                             setFeedType(f);
//                             setOpenFeed(false);
//                             setFeedSearch("");
//                           }}
//                           className="font-bold cursor-pointer"
//                         >
//                           <Check
//                             className={cn(
//                               "mr-2 h-4 w-4 text-blue-600",
//                               feedType === f ? "opacity-100" : "opacity-0",
//                             )}
//                           />
//                           {f}
//                         </CommandItem>
//                       ))}

//                       {/* ---> THE MAGIC ADD BUTTON <--- */}
//                       {feedSearch &&
//                         !allFeeds.some(
//                           (f) => f.toLowerCase() === feedSearch.toLowerCase(),
//                         ) && (
//                           <CommandItem
//                             value={feedSearch}
//                             onSelect={() => {
//                               setFeedType(feedSearch.toUpperCase());
//                               setOpenFeed(false);
//                               setFeedSearch("");
//                             }}
//                             className="font-black text-blue-600 cursor-pointer bg-blue-50/50 mt-1"
//                           >
//                             <PlusCircle className="mr-2 h-4 w-4" />
//                             Add "{feedSearch.toUpperCase()}"
//                           </CommandItem>
//                         )}
//                     </CommandGroup>
//                   </Command>
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-border/50">
//             <div
//               className="space-y-1.5"
//               onChange={(e) =>
//                 setQuantity((e.target as HTMLInputElement).value)
//               }
//             >
//               <label className="text-[9px] font-bold uppercase tracking-widest text-blue-600">
//                 Qty (Sacks) *
//               </label>
//               <FormattedNumberInput
//                 name="displayQuantity"
//                 required
//                 placeholder="0"
//                 className="h-10 rounded-xl font-black bg-white dark:bg-slate-950"
//               />
//             </div>
//             <div
//               className="space-y-1.5"
//               onChange={(e) =>
//                 setUnitPrice((e.target as HTMLInputElement).value)
//               }
//             >
//               <label className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
//                 Unit Price *
//               </label>
//               <FormattedNumberInput
//                 name="displayUnitPrice"
//                 required
//                 allowDecimals={true}
//                 placeholder="0.00"
//                 className="h-10 rounded-xl font-black bg-white dark:bg-slate-950"
//               />
//             </div>
//             <div
//               className="space-y-1.5"
//               onChange={(e) =>
//                 setCashBond((e.target as HTMLInputElement).value)
//               }
//             >
//               <label className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
//                 Cash Bond *
//               </label>
//               <FormattedNumberInput
//                 name="displayCashBond"
//                 required
//                 allowDecimals={true}
//                 placeholder="0.00"
//                 className="h-10 rounded-xl font-black bg-white dark:bg-slate-950"
//               />
//             </div>
//           </div>

//           {/* LIVE RECEIPT PREVIEW */}
//           <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-border/50 space-y-2 mt-2">
//             <div className="flex items-center gap-2 mb-3 text-slate-500">
//               <Receipt className="w-4 h-4" />
//               <span className="text-[10px] font-black uppercase tracking-widest">
//                 Expected Receipt Math
//               </span>
//             </div>
//             <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
//               <span>
//                 Total Payment ({cleanQty || 0} × ₱{cleanPrice.toLocaleString()})
//               </span>
//               <span>
//                 ₱
//                 {totalPayment.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//             <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
//               <span>
//                 Total Cash Bond ({cleanQty || 0} × ₱{cleanBond.toLocaleString()}
//                 )
//               </span>
//               <span>
//                 ₱
//                 {totalCashBond.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//             <div className="pt-2 mt-2 border-t border-border/50 flex justify-between text-sm font-black text-foreground">
//               <span className="text-emerald-600 uppercase tracking-widest text-[10px] mt-0.5">
//                 Actual Receipt Total
//               </span>
//               <span className="text-emerald-600">
//                 ₱
//                 {actualReceipt.toLocaleString("en-US", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//           </div>

//           <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
//             <Button
//               type="button"
//               variant="ghost"
//               onClick={() => setIsOpen(false)}
//               className="rounded-xl font-bold h-11"
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={loading}
//               className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-8 h-11"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
//                 </>
//               ) : (
//                 "Save Delivery"
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
import { logFeedDelivery } from "./actions";
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
} from "@/components/ui/command";
import {
  Loader2,
  PackagePlus,
  CalendarIcon,
  ChevronDown,
  Receipt,
  Check,
  PlusCircle,
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

// We keep a few defaults just so the box isn't empty on her very first day!
const DEFAULT_SUPPLIERS = [
  "NEW HOPE CENTRAL LUZON AGRICULTURE INC.",
  "CIRCLE AND CIRCLE FEEDMILL LTD. CO.",
  "GR8 MULTI-PURPOSE COOPERATIVE",
];
const DEFAULT_FEEDS = [
  "STARTER",
  "GROWER",
  "BOOSTER",
  "FINISHER",
  "LAYER MASH",
];

export default function AddFeedDeliveryModal({
  historicalSuppliers = [],
  historicalFeeds = [],
}: {
  historicalSuppliers?: string[];
  historicalFeeds?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // COMBINE DEFAULTS + DATABASE HISTORY
  const allSuppliers = useMemo(
    () => Array.from(new Set([...DEFAULT_SUPPLIERS, ...historicalSuppliers])),
    [historicalSuppliers],
  );
  const allFeeds = useMemo(
    () => Array.from(new Set([...DEFAULT_FEEDS, ...historicalFeeds])),
    [historicalFeeds],
  );

  // Combobox States & Live Search Tracking
  const [openSupplier, setOpenSupplier] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const [openFeed, setOpenFeed] = useState(false);
  const [feedType, setFeedType] = useState("");
  const [feedSearch, setFeedSearch] = useState("");

  // Live Math States
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cashBond, setCashBond] = useState("");

  const cleanQty = Number(quantity.replace(/,/g, "")) || 0;
  const cleanPrice = Number(unitPrice.replace(/,/g, "")) || 0;
  const cleanBond = Number(cashBond.replace(/,/g, "")) || 0;

  const totalCashBond = cleanQty * cleanBond;
  const totalPayment = cleanQty * cleanPrice;
  const actualReceipt = totalCashBond + totalPayment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supplier) return toast.error("Please select or type a Supplier.");
    if (!deliveryDate) return toast.error("Delivery Date is required.");

    // ---> FOOLPROOF DATE SAFETY LOCK <---
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow any time today
    if (deliveryDate.getTime() > today.getTime()) {
      return toast.error("Invalid Date", {
        description: "Delivery date cannot be in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    }

    if (!feedType)
      return toast.error("Please select or type a Feed Description.");
    if (!quantity || cleanQty <= 0)
      return toast.error("Quantity must be greater than zero.");
    if (!unitPrice || cleanPrice <= 0)
      return toast.error("Unit Price is required.");
    if (cashBond === "")
      return toast.error("Cash Bond is required. Enter 0 if none.");

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("deliveryDate", format(deliveryDate, "yyyy-MM-dd"));
    formData.set("quantity", String(cleanQty));
    formData.set("unitPrice", String(cleanPrice));
    formData.set("cashBond", String(cleanBond));

    // Force uppercase to keep the database perfectly clean
    formData.set("supplierName", supplier.toUpperCase());
    formData.set("feedType", feedType.toUpperCase());

    const result = await logFeedDelivery(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Delivery logged successfully!");
      setIsOpen(false);
      setQuantity("");
      setUnitPrice("");
      setCashBond("");
      setSupplier("");
      setFeedType("");
      setSupplierSearch("");
      setFeedSearch("");
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm h-11 px-6">
          <PackagePlus className="w-4 h-4 mr-2" /> Receive Delivery
        </Button>
      </DialogTrigger>
      {/* ---> THE FIX: Added flex-col and max-h-[90vh] <--- */}
      <DialogContent className="max-w-lg rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header - Stays Fixed */}
        <div className="bg-blue-600 p-6 text-white shrink-0">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <PackagePlus className="w-6 h-6" /> Log Warehouse Delivery
          </DialogTitle>
          <p className="text-blue-100 text-sm font-medium mt-1">
            Record incoming feeds. Type a new supplier name to save it to the
            system.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden bg-card"
        >
          {/* ---> THE FIX: Scrollable Area <--- */}
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {/* ---> SMART SUPPLIER COMBOBOX <--- */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Supplier Name *
              </label>
              <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupplier}
                    className={cn(
                      "w-full min-h-[44px] h-auto py-2 rounded-xl justify-between border-input bg-secondary/50 font-bold px-3 whitespace-normal text-left",
                      !supplier && "text-muted-foreground",
                    )}
                  >
                    <span className="flex-1 leading-tight pr-2">
                      {supplier ? supplier : "Search or type new supplier..."}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                {/* ---> THE FIX: Responsive Dropdown Width <--- */}
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search or type new supplier..."
                      value={supplierSearch}
                      onValueChange={setSupplierSearch}
                      className="h-10"
                    />
                    <CommandEmpty>No existing supplier found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
                      {allSuppliers.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => {
                            setSupplier(s);
                            setOpenSupplier(false);
                            setSupplierSearch("");
                          }}
                          className="font-bold cursor-pointer py-2"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-blue-600 shrink-0",
                              supplier === s ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="leading-tight">{s}</span>
                        </CommandItem>
                      ))}

                      {/* ---> THE MAGIC ADD BUTTON <--- */}
                      {supplierSearch &&
                        !allSuppliers.some(
                          (s) =>
                            s.toLowerCase() === supplierSearch.toLowerCase(),
                        ) && (
                          <CommandItem
                            value={supplierSearch}
                            onSelect={() => {
                              setSupplier(supplierSearch.toUpperCase());
                              setOpenSupplier(false);
                              setSupplierSearch("");
                            }}
                            className="font-black text-blue-600 cursor-pointer bg-blue-50/50 mt-1 py-2"
                          >
                            <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
                            <span className="leading-tight">
                              Add "{supplierSearch.toUpperCase()}" as new
                            </span>
                          </CommandItem>
                        )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Date Delivered *
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 rounded-xl justify-between border-input font-normal px-3",
                        !deliveryDate && "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                        <span className="truncate">
                          {deliveryDate
                            ? format(deliveryDate, "MMM d, yyyy")
                            : "Pick date"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-200" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      defaultMonth={deliveryDate || new Date()}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      onSelect={(date) => {
                        setDeliveryDate(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        if (date > today) return true;
                        return false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* ---> SMART FEED TYPE COMBOBOX <--- */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Description *
                </label>
                <Popover open={openFeed} onOpenChange={setOpenFeed}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFeed}
                      className={cn(
                        "w-full min-h-[44px] h-auto py-2 rounded-xl justify-between border-input bg-secondary/50 font-bold px-3 whitespace-normal text-left",
                        !feedType && "text-muted-foreground",
                      )}
                    >
                      <span className="flex-1 leading-tight pr-2">
                        {feedType ? feedType : "Search or type new..."}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0 z-200 rounded-xl shadow-xl"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search or type new..."
                        value={feedSearch}
                        onValueChange={setFeedSearch}
                        className="h-10"
                      />
                      <CommandEmpty>No feed type found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
                        {allFeeds.map((f) => (
                          <CommandItem
                            key={f}
                            value={f}
                            onSelect={() => {
                              setFeedType(f);
                              setOpenFeed(false);
                              setFeedSearch("");
                            }}
                            className="font-bold cursor-pointer py-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-blue-600 shrink-0",
                                feedType === f ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="leading-tight">{f}</span>
                          </CommandItem>
                        ))}

                        {/* ---> THE MAGIC ADD BUTTON <--- */}
                        {feedSearch &&
                          !allFeeds.some(
                            (f) => f.toLowerCase() === feedSearch.toLowerCase(),
                          ) && (
                            <CommandItem
                              value={feedSearch}
                              onSelect={() => {
                                setFeedType(feedSearch.toUpperCase());
                                setOpenFeed(false);
                                setFeedSearch("");
                              }}
                              className="font-black text-blue-600 cursor-pointer bg-blue-50/50 mt-1 py-2"
                            >
                              <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
                              <span className="leading-tight">
                                Add "{feedSearch.toUpperCase()}"
                              </span>
                            </CommandItem>
                          )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-border/50">
              <div
                className="space-y-1.5"
                onChange={(e) =>
                  setQuantity((e.target as HTMLInputElement).value)
                }
              >
                <label className="text-[9px] font-bold uppercase tracking-widest text-blue-600">
                  Qty (Sacks) *
                </label>
                <FormattedNumberInput
                  name="displayQuantity"
                  required
                  placeholder="0"
                  className="h-10 rounded-xl font-black bg-white dark:bg-slate-950 w-full"
                />
              </div>
              <div
                className="space-y-1.5"
                onChange={(e) =>
                  setUnitPrice((e.target as HTMLInputElement).value)
                }
              >
                <label className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                  Unit Price *
                </label>
                <FormattedNumberInput
                  name="displayUnitPrice"
                  required
                  allowDecimals={true}
                  placeholder="0.00"
                  className="h-10 rounded-xl font-black bg-white dark:bg-slate-950 w-full"
                />
              </div>
              <div
                className="space-y-1.5"
                onChange={(e) =>
                  setCashBond((e.target as HTMLInputElement).value)
                }
              >
                <label className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
                  Cash Bond *
                </label>
                <FormattedNumberInput
                  name="displayCashBond"
                  required
                  allowDecimals={true}
                  placeholder="0.00"
                  className="h-10 rounded-xl font-black bg-white dark:bg-slate-950 w-full"
                />
              </div>
            </div>

            {/* LIVE RECEIPT PREVIEW */}
            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-border/50 space-y-2 mt-2">
              <div className="flex items-center gap-2 mb-3 text-slate-500">
                <Receipt className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Expected Receipt Math
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>
                  Total Payment ({cleanQty || 0} × ₱
                  {cleanPrice.toLocaleString()})
                </span>
                <span>
                  ₱
                  {totalPayment.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>
                  Total Cash Bond ({cleanQty || 0} × ₱
                  {cleanBond.toLocaleString()})
                </span>
                <span>
                  ₱
                  {totalCashBond.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-border/50 flex justify-between text-sm font-black text-foreground">
                <span className="text-emerald-600 uppercase tracking-widest text-[10px] mt-0.5">
                  Actual Receipt Total
                </span>
                <span className="text-emerald-600">
                  ₱
                  {actualReceipt.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* ---> THE FIX: Fixed Sticky Footer <--- */}
          <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-border/50 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-8 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save Delivery"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
