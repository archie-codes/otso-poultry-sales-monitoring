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

// --- STRICT DB MAPPING CATEGORIES ---
const SHARED_CATEGORIES = [
  { label: "Electricity", value: "electricity" },
  { label: "Water", value: "water" },
  { label: "Fuel / Gas / Diesel", value: "fuel" },
  { label: "Labor / Salary", value: "labor" },
  { label: "Maintenance / Truck", value: "maintenance" },
  { label: "Miscellaneous / Meals", value: "miscellaneous" },
];

const INDIVIDUAL_CATEGORIES = [
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

  // Combobox & Date States
  const [farmId, setFarmId] = useState("");
  const [openFarm, setOpenFarm] = useState(false);

  const [loadId, setLoadId] = useState("");
  const [openLoad, setOpenLoad] = useState(false);

  const [expenseType, setExpenseType] = useState("");

  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isSharedExpense = SHARED_CATEGORIES.some(
    (cat) => cat.value === expenseType,
  );

  const isMedical = ["medicine", "vaccine", "antibiotics"].includes(
    expenseType,
  );

  // ---> DYNAMIC PLACEHOLDERS <---
  let medNamePlaceholder = "e.g. ENROFLOXACIN";
  let medQtyPlaceholder = "e.g. 24 LITERS";

  if (expenseType === "vaccine") {
    medNamePlaceholder = "e.g. GOMBURO 2";
    medQtyPlaceholder = "e.g. 8 VIALS - 2500 DOSE";
  } else if (expenseType === "antibiotics") {
    medNamePlaceholder = "e.g. DOXYCYCLINE";
    medQtyPlaceholder = "e.g. 5 KG";
  }

  // MATH ENGINE TO FIND WHO WAS ALIVE ON THIS DATE
  const eligibleLoads = useMemo(() => {
    if (!farmId || !expenseDate) return [];

    const targetDate = startOfDay(expenseDate).getTime();

    return loadTimelines.filter((load) => {
      if (load.farmId !== Number(farmId)) return false;

      const start = startOfDay(new Date(load.loadDate)).getTime();
      const end = load.isActive
        ? startOfDay(new Date()).getTime()
        : startOfDay(new Date(load.harvestDate)).getTime();

      return targetDate >= start && targetDate <= end;
    });
  }, [farmId, expenseDate, loadTimelines]);

  const canSave = eligibleLoads.length > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!farmId || !expenseType || !expenseDate) {
      toast.error("Missing Field", {
        description: "Please fill out all required fields.",
      });
      return;
    }

    if (!isSharedExpense && !loadId) {
      toast.error("Missing Field", {
        description:
          "Please select a target building for this specific expense.",
      });
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (expenseDate.getTime() > today.getTime()) {
      toast.error("Invalid Date", {
        description: "Expense date cannot be in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    if (!canSave) {
      toast.error("Invalid Date", {
        description:
          "No batches were active on this farm during the selected date.",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("farmId", farmId);
    formData.set("loadId", isSharedExpense ? "shared" : loadId);
    formData.set("expenseType", expenseType);
    formData.set("expenseDate", format(expenseDate, "yyyy-MM-dd"));

    const rawAmount = formData.get("amount") as string;
    if (rawAmount) formData.set("amount", rawAmount.replace(/,/g, ""));

    const result = await addExpense(formData);

    if (result.error) {
      toast.error("Error Saving Expense", { description: result.error });
    } else {
      toast.success("Expense Recorded!", {
        description: "The financial record has been saved.",
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
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background shadow-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* HEADER */}
              <div className="flex justify-between items-center p-6 pb-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 z-10 shrink-0">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500 w-5 h-5" /> Log
                    Expense
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Record costs and distribute budget.
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
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    {/* ---> SEARCHABLE FARM COMBOBOX <--- */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">
                        Select Farm <span className="text-red-500">*</span>
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
                                ? farms.find((f) => String(f.id) === farmId)
                                    ?.name
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
                                      setLoadId(""); // Reset building
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

                    {/* ---> REPAIRED DATE PICKER <--- */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">
                        Expense Date <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            className={cn(
                              "w-full h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold uppercase tracking-wider text-foreground hover:bg-background focus:ring-red-500 flex items-center justify-start text-left shadow-sm",
                              !expenseDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-3 h-4 w-4 opacity-70" />
                            <span className="flex-1 truncate">
                              {expenseDate
                                ? format(expenseDate, "MMM d, yyyy")
                                : "Pick a date"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-200">
                          <Calendar
                            mode="single"
                            selected={expenseDate}
                            onSelect={(date) => {
                              if (date) {
                                setExpenseDate(date);
                                setIsCalendarOpen(false); // Auto closes!
                              }
                            }}
                            disabled={(date) => date > new Date()} // Blocks Future Dates!
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Category <span className="text-red-500">*</span>
                    </label>
                    <Select value={expenseType} onValueChange={setExpenseType}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                        <SelectValue placeholder="-- Select Category --" />
                      </SelectTrigger>
                      <SelectContent className="z-200 max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel className="text-blue-600 font-black tracking-widest text-[10px] uppercase">
                            Farm Division (Shared Cost)
                          </SelectLabel>
                          {SHARED_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-emerald-600 font-black tracking-widest text-[10px] uppercase mt-2">
                            Individual (Per Building)
                          </SelectLabel>
                          {INDIVIDUAL_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {expenseType && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      {isMedical ? (
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
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Remarks (Optional)
                          </label>
                          <Input
                            name="remarks"
                            placeholder="e.g. MAY 2026 WATER BILL"
                            className="h-11 rounded-xl font-bold uppercase text-xs border-border/50"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {expenseType && farmId && expenseDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                      <div
                        className={cn(
                          "rounded-xl p-4 flex gap-3 items-start shadow-inner border",
                          canSave
                            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
                            : "bg-red-50 border-red-200 text-red-800",
                        )}
                      >
                        {canSave ? (
                          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          {canSave ? (
                            <>
                              <p className="text-sm font-black text-blue-800 dark:text-blue-300">
                                Active Buildings Detected
                              </p>
                              <p className="text-xs text-blue-700/80 dark:text-blue-400 mt-1 leading-relaxed">
                                On{" "}
                                <strong>
                                  {format(expenseDate, "MMM d, yyyy")}
                                </strong>
                                , there{" "}
                                {eligibleLoads.length === 1 ? "was" : "were"}{" "}
                                <strong>{eligibleLoads.length}</strong> active{" "}
                                {eligibleLoads.length === 1
                                  ? "building"
                                  : "buildings"}
                                : (
                                {eligibleLoads
                                  .map((l) => l.buildingName)
                                  .join(", ")}
                                ).
                                {isSharedExpense &&
                                  " This cost will be divided among them in the Historical Ledger."}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black">Invalid Date</p>
                              <p className="text-xs mt-1 leading-relaxed">
                                There were no chickens loaded in this farm on{" "}
                                {format(expenseDate, "MMM d, yyyy")}. You cannot
                                charge expenses to empty buildings.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ---> SEARCHABLE TARGET BUILDING COMBOBOX <--- */}
                      {!isSharedExpense && canSave && (
                        <div className="space-y-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <label className="text-sm font-semibold text-emerald-700 dark:text-emerald-500">
                            Which building is this for?{" "}
                            <span className="text-red-500">*</span>
                          </label>

                          <Popover open={openLoad} onOpenChange={setOpenLoad}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openLoad}
                                className={cn(
                                  "w-full h-11 justify-between rounded-xl font-normal bg-background border-emerald-200 shadow-sm",
                                  !loadId && "text-muted-foreground",
                                )}
                              >
                                <span className="truncate uppercase font-bold text-xs tracking-wider">
                                  {loadId
                                    ? eligibleLoads.find(
                                        (l) => String(l.id) === loadId,
                                      )?.buildingName + " (Active Flock)"
                                    : "-- Select Target Building --"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                              <Command>
                                <CommandInput placeholder="Search active building..." />
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty>
                                    No active building found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {eligibleLoads.map((load) => (
                                      <CommandItem
                                        key={load.id}
                                        value={load.buildingName}
                                        onSelect={() => {
                                          setLoadId(String(load.id));
                                          setOpenLoad(false);
                                        }}
                                        className="font-bold text-xs uppercase tracking-wider cursor-pointer py-2.5"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 text-emerald-600",
                                            loadId === String(load.id)
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {load.buildingName} (Active Flock)
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 pt-2">
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
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-border/50 mt-2">
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
                      disabled={
                        loading ||
                        !canSave ||
                        (!isSharedExpense && !loadId && expenseType !== "")
                      }
                      className="h-11 px-8 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
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
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
