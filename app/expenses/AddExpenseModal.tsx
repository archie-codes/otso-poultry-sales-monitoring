"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { addExpense } from "./actions";
import {
  X,
  Loader2,
  Save,
  TrendingDown,
  CalendarIcon,
  Info,
  ChevronDown,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Globe,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// SHADCN UI
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { Input } from "@/components/ui/input";

// --- CATEGORIES ---
const EXPENSE_CATEGORIES = [
  { label: "Electricity", value: "electricity" },
  { label: "Water", value: "water" },
  { label: "Fuel / Gas / Diesel", value: "fuel" },
  { label: "Labor / Salary", value: "labor" },
  { label: "Maintenance / Truck", value: "maintenance" },
  { label: "Miscellaneous / Meals", value: "miscellaneous" },
  { label: "Multivitamins & Medicine", value: "medicine" },
  { label: "Vaccine", value: "vaccine" },
  { label: "Antibiotics", value: "antibiotics" },
];

export default function AddExpenseModal({
  farms = [],
  loadTimelines = [],
}: {
  farms: any[];
  loadTimelines: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [farmId, setFarmId] = useState("");
  const [openFarm, setOpenFarm] = useState(false);

  const [loadId, setLoadId] = useState("");
  const [openLoad, setOpenLoad] = useState(false);

  const [expenseDate, setExpenseDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [expenseType, setExpenseType] = useState("");

  useEffect(() => setMounted(true), []);

  // ---> DYNAMIC CATEGORY LOGIC <---
  const isMedical = ["medicine", "vaccine", "antibiotics"].includes(
    expenseType,
  );
  const isUtility = ["electricity", "water", "fuel"].includes(expenseType);
  const isService = ["labor", "maintenance", "miscellaneous"].includes(
    expenseType,
  );

  let medNamePlaceholder = "e.g. ENROFLOXACIN";
  let medQtyPlaceholder = "e.g. 24 LITERS";
  let remarksPlaceholder = "e.g. ADDITIONAL NOTES";

  // Smart Placeholders based on category
  if (expenseType === "vaccine") {
    medNamePlaceholder = "e.g. GOMBURO 2";
    medQtyPlaceholder = "e.g. 8 VIALS - 2500 DOSE";
  } else if (expenseType === "antibiotics") {
    medNamePlaceholder = "e.g. DOXYCYCLINE";
    medQtyPlaceholder = "e.g. 5 KG";
  } else if (expenseType === "electricity") {
    remarksPlaceholder = "e.g. MAY 2026 BILL - METER #123";
  } else if (expenseType === "water") {
    remarksPlaceholder = "e.g. MAY 2026 WATER BILL";
  } else if (expenseType === "fuel") {
    remarksPlaceholder = "e.g. 50L DIESEL FOR GENERATOR";
  } else if (expenseType === "labor") {
    remarksPlaceholder = "e.g. JUAN DELA CRUZ - WEEKLY SALARY";
  } else if (expenseType === "maintenance") {
    remarksPlaceholder = "e.g. REPAIR BUILDING 1 WATER PUMP";
  } else if (expenseType === "miscellaneous") {
    remarksPlaceholder = "e.g. STAFF LUNCH / HARDWARE SUPPLIES";
  } else if (isMedical) {
    remarksPlaceholder = "e.g. ADMINISTERED VIA DRINKING WATER";
  }

  // --- LOGIC: Get all loads for the selected farm ---
  const farmLoads = useMemo(() => {
    if (!farmId) return [];
    return loadTimelines
      .filter((l) => l.farmId === Number(farmId))
      .sort(
        (a, b) =>
          new Date(b.loadDate).getTime() - new Date(a.loadDate).getTime(),
      );
  }, [farmId, loadTimelines]);

  const activeFarmLoads = useMemo(() => {
    return farmLoads.filter((l) => l.isActive);
  }, [farmLoads]);

  // ---> THE FIX: Check if we have multiple active buildings to justify sharing <---
  const hasMultipleActiveBuildings = activeFarmLoads.length > 1;

  // --- LOGIC: Calculate exact valid date boundaries based on target ---
  const selectedLoadDetail = farmLoads.find((l) => String(l.id) === loadId);

  const dateBoundaries = useMemo(() => {
    if (loadId === "shared" && farmLoads.length > 0) {
      const earliest = new Date(
        Math.min(...farmLoads.map((l) => new Date(l.loadDate).getTime())),
      );
      return { min: startOfDay(earliest), max: startOfDay(new Date()) };
    }
    if (selectedLoadDetail) {
      const min = startOfDay(new Date(selectedLoadDetail.loadDate));
      const max = selectedLoadDetail.isActive
        ? startOfDay(new Date())
        : startOfDay(new Date(selectedLoadDetail.harvestDate));
      return { min, max };
    }
    return null;
  }, [loadId, farmLoads, selectedLoadDetail]);

  const activeSharedLoadsOnDate = useMemo(() => {
    if (loadId !== "shared" || !expenseDate || !farmId) return [];
    const targetDate = startOfDay(expenseDate).getTime();

    return farmLoads.filter((load) => {
      const start = startOfDay(new Date(load.loadDate)).getTime();
      if (start > targetDate) return false;
      if (!load.isActive && load.harvestDate) {
        const hDate = startOfDay(new Date(load.harvestDate)).getTime();
        if (targetDate >= hDate) return false;
      }
      return true;
    });
  }, [expenseDate, loadId, farmLoads, farmId]);

  const canSave =
    loadId === "shared" ? activeSharedLoadsOnDate.length > 0 : !!expenseDate;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!farmId || !loadId || !expenseDate || !expenseType) {
      toast.error("Missing Field", {
        description:
          "Please fill out all required fields, including the target allocation.",
      });
      return;
    }

    if (loadId === "shared" && activeSharedLoadsOnDate.length === 0) {
      toast.error("Invalid Date", {
        description:
          "No batches were active on this farm during the selected date to share the cost.",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("farmId", farmId);
    formData.set("loadId", loadId);
    formData.set("expenseType", expenseType);
    formData.set("expenseDate", format(expenseDate, "yyyy-MM-dd"));

    const rawAmount = formData.get("amount") as string;
    if (rawAmount) formData.set("amount", rawAmount.replace(/,/g, ""));

    const result = await addExpense(formData);

    if (result.error) {
      toast.error("Error Saving Expense", { description: result.error });
    } else {
      toast.success("Expense Recorded!", {
        description: "The financial record has been saved securely.",
      });
      setIsOpen(false);
      setFarmId("");
      setLoadId("");
      setExpenseType("");
      setExpenseDate(undefined);
    }
    setLoading(false);
  }

  // ---> REUSABLE INPUT BLOCKS FOR DYNAMIC LAYOUT <---
  const amountBlock = (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-red-600 dark:text-red-400">
        Total Amount (₱) <span className="text-red-500">*</span>
      </label>
      <FormattedNumberInput
        name="amount"
        required
        allowDecimals={true}
        placeholder="10,000.00"
        className="h-14 rounded-xl bg-background font-black text-2xl px-4 border-red-200 focus-visible:ring-red-500 placeholder:text-muted-foreground/50"
      />
    </div>
  );

  const remarksBlock = (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Remarks / Details (Optional)
      </label>
      <Input
        name="remarks"
        placeholder={remarksPlaceholder}
        className="h-14 rounded-xl font-bold uppercase text-xs border-border/50 bg-slate-50 dark:bg-slate-900/50"
      />
    </div>
  );

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
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background shadow-2xl sm:rounded-[2.5rem] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* HEADER */}
              <div className="flex justify-between items-center p-6 pb-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 z-10 shrink-0">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500 w-5 h-5" /> Log
                    Expense
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select target batch to identify valid dates.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  id="expenseForm"
                >
                  {/* 1. SELECT FARM */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      1. Select Farm <span className="text-red-500">*</span>
                    </label>
                    <Popover open={openFarm} onOpenChange={setOpenFarm}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openFarm}
                          className={cn(
                            "w-full h-11 justify-between rounded-xl font-normal bg-background border-input shadow-sm",
                            !farmId && "text-muted-foreground",
                          )}
                        >
                          <span className="truncate uppercase font-bold text-xs tracking-wider">
                            {farmId
                              ? farms.find((f) => String(f.id) === farmId)?.name
                              : "-- Select Farm --"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                        <Command>
                          <CommandInput placeholder="Search farm..." />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>No farm found.</CommandEmpty>
                            <CommandGroup>
                              {farms.map((farm) => (
                                <CommandItem
                                  key={farm.id}
                                  value={farm.name}
                                  onSelect={() => {
                                    setFarmId(String(farm.id));
                                    setLoadId(""); // Reset target
                                    setExpenseDate(undefined); // Reset date
                                    setOpenFarm(false);
                                  }}
                                  className="font-bold text-xs uppercase tracking-wider cursor-pointer py-2.5"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 text-red-600",
                                      farmId === String(farm.id)
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {farm.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* 2. SELECT TARGET (BUILDING OR SHARED) */}
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-sm font-semibold">
                      2. Target Allocation{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Popover open={openLoad} onOpenChange={setOpenLoad}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!farmId}
                          className={cn(
                            "w-full h-11 justify-between rounded-xl font-bold bg-background shadow-sm",
                            !loadId && "text-muted-foreground border-input",
                            loadId === "shared" &&
                              "text-blue-700 dark:text-blue-400 border-blue-300 bg-blue-50/50 dark:bg-blue-950/20",
                            loadId !== "" &&
                              loadId !== "shared" &&
                              "text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                          )}
                        >
                          <span className="truncate uppercase text-xs tracking-wider">
                            {loadId === "shared"
                              ? "🌐 Divide Across Active Flocks"
                              : loadId
                                ? selectedLoadDetail?.buildingName +
                                  " (" +
                                  selectedLoadDetail?.name +
                                  ")"
                                : "-- Select Who is Billed --"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                        <Command>
                          <CommandList className="max-h-[300px] overflow-auto custom-scrollbar">
                            {/* ---> THE FIX: HIDE SHARED IF ONLY 1 ACTIVE BUILDING <--- */}
                            {hasMultipleActiveBuildings && (
                              <CommandGroup heading="Farm-Wide">
                                <CommandItem
                                  onSelect={() => {
                                    setLoadId("shared");
                                    setExpenseDate(undefined); // Reset date
                                    setOpenLoad(false);
                                  }}
                                  className="font-black text-xs uppercase tracking-wider cursor-pointer py-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                                >
                                  <Globe className="w-4 h-4 mr-2" /> Divide
                                  Across Active Flocks
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      loadId === "shared"
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              </CommandGroup>
                            )}

                            <CommandGroup heading="Specific Active Buildings">
                              {activeFarmLoads.length === 0 ? (
                                <div className="py-3 px-2 text-xs text-muted-foreground text-center font-bold">
                                  No active buildings.
                                </div>
                              ) : (
                                activeFarmLoads.map((load) => (
                                  <CommandItem
                                    key={load.id}
                                    value={`${load.buildingName} ${load.name}`}
                                    onSelect={() => {
                                      setLoadId(String(load.id));
                                      setExpenseDate(undefined); // Reset date
                                      setOpenLoad(false);
                                    }}
                                    className="font-bold text-xs uppercase tracking-wider cursor-pointer py-2.5"
                                  >
                                    <Warehouse className="w-3.5 h-3.5 mr-2 opacity-50" />
                                    {load.buildingName} - {load.name}
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-200">
                                      Active
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4 text-emerald-600",
                                        loadId === String(load.id)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* 3. SELECT DATE (GATED BY TARGET) WITH DROPDOWNS */}
                  <div className="space-y-1 animate-in fade-in duration-300">
                    <label className="text-sm font-semibold">
                      3. Expense Date <span className="text-red-500">*</span>
                    </label>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          disabled={!loadId}
                          className={cn(
                            "w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold uppercase tracking-wider text-foreground hover:bg-background focus:ring-red-500 flex items-center justify-start text-left shadow-sm disabled:opacity-50",
                            !expenseDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                          <span className="flex-1 truncate">
                            {expenseDate
                              ? format(expenseDate, "MMM d, yyyy")
                              : "Pick valid date"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-200">
                        <Calendar
                          mode="single"
                          selected={expenseDate}
                          defaultMonth={
                            expenseDate ||
                            (dateBoundaries ? dateBoundaries.max : new Date())
                          }
                          captionLayout="dropdown"
                          fromYear={
                            dateBoundaries
                              ? dateBoundaries.min.getFullYear()
                              : 2020
                          }
                          toYear={new Date().getFullYear()}
                          onSelect={(date) => {
                            if (date) {
                              setExpenseDate(date);
                              setIsCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            const d = startOfDay(date).getTime();
                            const today = startOfDay(new Date()).getTime();
                            if (d > today) return true; // Block future

                            // Block dates outside the valid boundary
                            if (dateBoundaries) {
                              return (
                                d < dateBoundaries.min.getTime() ||
                                d > dateBoundaries.max.getTime()
                              );
                            }
                            return true;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {/* UI FEEDBACK FOR BACKLOG DATES */}
                    {loadId && dateBoundaries && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 pt-1">
                        Valid Range: {format(dateBoundaries.min, "MMM d, yyyy")}{" "}
                        - {format(dateBoundaries.max, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  {/* SHARED EXPENSE VISUAL FEEDBACK */}
                  {loadId === "shared" && expenseDate && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 flex gap-3 animate-in fade-in duration-300">
                      {canSave ? (
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        {canSave ? (
                          <>
                            <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                              Cost Shared Among:
                            </p>
                            <p className="text-[11px] font-bold text-blue-700/80 dark:text-blue-400 mt-1 leading-relaxed">
                              {activeSharedLoadsOnDate
                                .map((l) => `${l.buildingName} (${l.name})`)
                                .join(", ")}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] font-bold text-red-700 leading-relaxed">
                            No flocks were active on{" "}
                            {format(expenseDate, "MMM d, yyyy")} to share this
                            cost.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. SELECT CATEGORY */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <label className="text-sm font-semibold">
                      4. Expense Category{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select value={expenseType} onValueChange={setExpenseType}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500 font-bold uppercase text-xs tracking-wider">
                        <SelectValue placeholder="-- Select Category --" />
                      </SelectTrigger>
                      <SelectContent className="z-200 max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel className="text-muted-foreground font-black tracking-widest text-[10px] uppercase">
                            Available Categories
                          </SelectLabel>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem
                              key={cat.value}
                              value={cat.value}
                              className="font-bold text-xs uppercase"
                            >
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ---> DYNAMIC LAYOUTS BASED ON SELECTED CATEGORY <--- */}
                  {expenseType && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-border/50">
                      {/* LAYOUT 1: MEDICAL (Name, Qty, Amount + Remarks bottom) */}
                      {isMedical && (
                        <>
                          <div className="grid grid-cols-2 gap-4 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                                Item Name *
                              </label>
                              <Input
                                name="medName"
                                placeholder={medNamePlaceholder}
                                required
                                className="h-10 rounded-xl font-bold uppercase text-xs border-emerald-200 focus-visible:ring-emerald-500 bg-white dark:bg-slate-950"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                                Qty & Unit *
                              </label>
                              <Input
                                name="medQty"
                                placeholder={medQtyPlaceholder}
                                required
                                className="h-10 rounded-xl font-bold uppercase text-xs border-emerald-200 focus-visible:ring-emerald-500 bg-white dark:bg-slate-950"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {amountBlock}
                            {remarksBlock}
                          </div>
                        </>
                      )}

                      {/* LAYOUT 2: UTILITIES (Amount & Remarks Side-by-Side) */}
                      {isUtility && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {amountBlock}
                          {remarksBlock}
                        </div>
                      )}

                      {/* LAYOUT 3: SERVICES (Remarks first, Amount second) */}
                      {isService && (
                        <>
                          {remarksBlock}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {amountBlock}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* FOOTER */}
              <div className="p-6 pt-5 flex justify-end gap-3 border-t border-border/50 shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-11 px-6 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="expenseForm"
                  disabled={
                    loading ||
                    !canSave ||
                    !loadId ||
                    !expenseType ||
                    !expenseDate
                  }
                  className="h-11 px-8 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Expense
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
