// "use client";

// import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import { addExpense } from "./actions";
// import { X, Loader2, Save, TrendingDown } from "lucide-react";
// import { toast } from "sonner";

// export default function AddExpenseModal({
//   farms,
//   activeLoads,
// }: {
//   farms: any[];
//   activeLoads: any[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const [selectedFarmId, setSelectedFarmId] = useState("");

//   useEffect(() => setMounted(true), []);

//   // Filter the loads so it only shows buildings for the specifically selected farm
//   const availableLoads = activeLoads.filter(
//     (load) => load.farmId === Number(selectedFarmId),
//   );

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setLoading(true);

//     const formData = new FormData(e.currentTarget);
//     const result = await addExpense(formData);

//     if (result.error) {
//       toast.error("Error Saving Expense", {
//         description: result.error,
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//     } else {
//       toast.success("Expense Recorded!", {
//         description: "The financial record has been saved.",
//         style: { backgroundColor: "blue", color: "white", border: "none" },
//       });
//       setIsOpen(false);
//       setSelectedFarmId(""); // Reset the dropdown
//     }
//     setLoading(false);
//   }

//   return (
//     <>
//       <button
//         onClick={() => setIsOpen(true)}
//         className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-red-600 text-white shadow-sm hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-300"
//       >
//         <TrendingDown className="w-5 h-5 mr-2" /> Record Expense
//       </button>

//       {isOpen &&
//         mounted &&
//         createPortal(
//           <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//             <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
//               <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
//                 <div>
//                   <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
//                     <TrendingDown className="text-red-500 w-5 h-5" /> Log
//                     Expense
//                   </h2>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Record costs and distribute salary.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="p-2 rounded-full hover:bg-secondary transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-5">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">
//                       Select Farm <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       name="farmId"
//                       required
//                       value={selectedFarmId}
//                       onChange={(e) => setSelectedFarmId(e.target.value)}
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
//                     >
//                       <option value="">-- Choose Farm --</option>
//                       {farms.map((farm) => (
//                         <option key={farm.id} value={farm.id}>
//                           {farm.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">
//                       Expense Date <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="date"
//                       name="expenseDate"
//                       required
//                       defaultValue={new Date().toISOString().split("T")[0]}
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
//                     />
//                   </div>
//                 </div>

//                 {/* THE SALARY SPLITTER LOGIC */}
//                 <div className="space-y-2 p-4 bg-secondary/20 rounded-xl border border-border/50">
//                   <label className="text-sm font-semibold">
//                     Which building is this for?{" "}
//                     <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     name="loadId"
//                     required
//                     disabled={!selectedFarmId}
//                     className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 disabled:opacity-50"
//                   >
//                     <option value="">-- Select Target --</option>

//                     {/* Option 1: Shared Cost */}
//                     <option
//                       value="shared"
//                       className="font-bold text-primary bg-primary/10"
//                     >
//                       🏢 SHARED ACROSS ENTIRE FARM (E.g., Salary)
//                     </option>

//                     {/* Option 2: Direct Cost */}
//                     <optgroup label="Direct to Specific Building:">
//                       {availableLoads.map((load) => (
//                         <option key={load.id} value={load.id}>
//                           {load.buildingName} (Active Flock)
//                         </option>
//                       ))}
//                     </optgroup>
//                   </select>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     Selecting "Shared" will automatically divide the cost among
//                     all active loads during reporting.
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold">
//                       Expense Type <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       name="expenseType"
//                       required
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
//                     >
//                       <option value="">-- Category --</option>
//                       <option value="labor">Labor / Salary</option>
//                       <option value="feeds">Feeds</option>
//                       <option value="medicine">Medicine / Vaccines</option>
//                       <option value="electricity">Electricity</option>
//                       <option value="water">Water</option>
//                       <option value="fuel">Fuel</option>
//                       <option value="maintenance">Maintenance</option>
//                       <option value="miscellaneous">Miscellaneous</option>
//                     </select>
//                   </div>

//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold text-red-600 dark:text-red-400">
//                       Total Amount (₱) <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       name="amount"
//                       required
//                       placeholder="0.00"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="pt-2 flex justify-end gap-3">
//                   <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="h-11 px-6 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="h-11 px-8 rounded-xl text-sm font-bold bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="w-4 h-4 mr-2 inline" /> Save Expense
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
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
import { addExpense } from "./actions";
import { X, Loader2, Save, TrendingDown, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// SHADCN UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddExpenseModal({
  farms,
  activeLoads,
}: {
  farms: any[];
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // States
  const [farmId, setFarmId] = useState("");
  const [loadId, setLoadId] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

  useEffect(() => setMounted(true), []);

  // Filter the loads so it only shows buildings for the specifically selected farm
  const availableLoads = activeLoads.filter(
    (load) => load.farmId === Number(farmId),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!farmId) {
      toast.error("Missing Field", { description: "Please select a farm." });
      return;
    }
    if (!loadId) {
      toast.error("Missing Field", {
        description: "Please select a target building or Shared.",
      });
      return;
    }
    if (!expenseType) {
      toast.error("Missing Field", {
        description: "Please select an expense category.",
      });
      return;
    }
    if (!expenseDate) {
      toast.error("Missing Field", { description: "Please select a date." });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("farmId", farmId);
    formData.set("loadId", loadId);
    formData.set("expenseType", expenseType);
    formData.set("expenseDate", format(expenseDate, "yyyy-MM-dd"));

    const result = await addExpense(formData);

    if (result.error) {
      toast.error("Error Saving Expense", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Expense Recorded!", {
        description: "The financial record has been saved.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
      setFarmId("");
      setLoadId("");
      setExpenseType("");
      setExpenseDate(new Date());
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm hover:-translate-y-0.5 transition-all duration-300"
      >
        <TrendingDown className="w-5 h-5 mr-2" /> Record Expense
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500 w-5 h-5" /> Log
                    Expense
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Record costs and distribute salary.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Select Farm <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={farmId}
                      onValueChange={(val) => {
                        setFarmId(val);
                        setLoadId("");
                      }}
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                        <SelectValue placeholder="-- Farm --" />
                      </SelectTrigger>
                      <SelectContent className="z-200">
                        {farms.map((farm) => (
                          <SelectItem key={farm.id} value={String(farm.id)}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Date <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-11 rounded-xl justify-start text-left font-normal bg-background border-input focus:ring-red-500",
                            !expenseDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expenseDate ? (
                            format(expenseDate, "MMM d, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-200">
                        <Calendar
                          mode="single"
                          selected={expenseDate}
                          onSelect={setExpenseDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* THE SALARY SPLITTER LOGIC */}
                <div className="space-y-2 p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <label className="text-sm font-semibold">
                    Which building is this for?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={loadId}
                    onValueChange={setLoadId}
                    disabled={!farmId}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                      <SelectValue placeholder="-- Select Target --" />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      <SelectItem
                        value="shared"
                        className="font-bold text-primary focus:text-primary"
                      >
                        🏢 SHARED ACROSS ENTIRE FARM
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel>Direct to Specific Building:</SelectLabel>
                        {availableLoads.map((load) => (
                          <SelectItem key={load.id} value={String(load.id)}>
                            {load.buildingName} (Active Flock)
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecting "Shared" will automatically divide the cost among
                    all active loads.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Type <span className="text-red-500">*</span>
                    </label>
                    <Select value={expenseType} onValueChange={setExpenseType}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                        <SelectValue placeholder="-- Category --" />
                      </SelectTrigger>
                      <SelectContent className="z-200">
                        <SelectItem value="labor">Labor / Salary</SelectItem>
                        <SelectItem value="feeds">Feeds</SelectItem>
                        <SelectItem value="medicine">
                          Medicine / Vaccines
                        </SelectItem>
                        <SelectItem value="electricity">Electricity</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="miscellaneous">
                          Miscellaneous
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Total Amount (₱) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="0.00"
                      className="h-11 rounded-xl bg-background focus-visible:ring-red-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Expense
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
