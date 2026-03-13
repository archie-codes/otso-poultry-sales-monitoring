"use client";

import { useState, useEffect } from "react";
// ---> FIXED: Imported the new getLoadTotalExpensesForHarvest action <---
import {
  logHarvest,
  getLiveBirdCount,
  getLoadTotalExpensesForHarvest,
} from "./actions";
import {
  Loader2,
  Truck,
  Info,
  CheckCircle2,
  CalendarIcon,
  ChevronDown,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function LogHarvestModal({ load }: { load: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [availableBirds, setAvailableBirds] = useState<number | null>(null);
  // ---> NEW: State to hold the real-time total expenses <---
  const [totalExpenses, setTotalExpenses] = useState<number | null>(null);
  const [fetchingData, setFetchingData] = useState(false);

  const [successData, setSuccessData] = useState<any>(null);

  const [harvestQuantity, setHarvestQuantity] = useState<string>("");
  const [harvestDate, setHarvestDate] = useState<Date | undefined>(new Date());

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isManualClose, setIsManualClose] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFetchingData(true);
      setHarvestQuantity("");
      setHarvestDate(new Date());
      setIsManualClose(false);

      // ---> FIXED: Fetch both birds AND total expenses at the same time <---
      Promise.all([
        getLiveBirdCount(load.id),
        getLoadTotalExpensesForHarvest(load.id),
      ]).then(([count, expenses]) => {
        setAvailableBirds(count);
        setTotalExpenses(expenses);
        setFetchingData(false);
      });
    } else {
      setTimeout(() => setSuccessData(null), 300);
    }
  }, [isOpen, load.id]);

  const cleanQuantity = Number(harvestQuantity.replace(/,/g, ""));

  const isAutoFinalHarvest =
    availableBirds !== null &&
    cleanQuantity === availableBirds &&
    availableBirds > 0;

  const isExceeding = availableBirds !== null && cleanQuantity > availableBirds;

  const remainingAfterHarvest = (availableBirds || 0) - cleanQuantity;
  const isDiscrepancy =
    !isAutoFinalHarvest && isManualClose && remainingAfterHarvest > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!harvestDate) {
      toast.error("Please select a harvest date.");
      return;
    }

    if (isExceeding) {
      toast.error("Cannot harvest more birds than available!");
      return;
    }

    // ---> DATE SAFETY LOCKS <---
    const loadDateObj = new Date(load.loadDate);
    loadDateObj.setHours(0, 0, 0, 0);

    const harvestDateCheck = new Date(harvestDate);
    harvestDateCheck.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (harvestDateCheck < loadDateObj) {
      toast.error("Invalid Date", {
        description: `You cannot harvest before the load date (${format(loadDateObj, "MMM d, yyyy")}).`,
      });
      return;
    }

    if (harvestDateCheck > today) {
      toast.error("Invalid Date", {
        description: "You cannot log a harvest for a future date.",
      });
      return;
    }
    // ----------------------------

    const formData = new FormData(e.currentTarget);
    const remainingAfterHarvest = (availableBirds || 0) - cleanQuantity;

    if (!isAutoFinalHarvest && isManualClose && remainingAfterHarvest > 0) {
      const confirmed = window.confirm(
        `⚠️ WARNING: DISCREPANCY DETECTED ⚠️\n\nYou are closing this building, but the system shows ${remainingAfterHarvest.toLocaleString()} birds are still inside.\n\nAre you absolutely sure this building is completely empty?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setLoading(true);

    formData.set("loadId", String(load.id));
    formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));

    const rawQuantity = formData.get("quantity") as string;
    if (rawQuantity) formData.set("quantity", rawQuantity.replace(/,/g, ""));

    const rawSellingPrice = formData.get("sellingPrice") as string;
    if (rawSellingPrice)
      formData.set("sellingPrice", rawSellingPrice.replace(/,/g, ""));

    if (isAutoFinalHarvest) {
      formData.set("isFinalHarvest", "on");
    }

    const result = await logHarvest(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      setSuccessData(result);
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300 font-bold tracking-widest uppercase text-xs rounded-xl shadow-sm transition-all"
        >
          <Truck className="w-4 h-4 mr-2" /> Log Harvest
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
        {successData ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-foreground mb-2">
              Harvest Successful!
            </DialogTitle>
            <p className="text-muted-foreground font-medium mb-6">
              You just successfully harvested{" "}
              <span className="font-black text-foreground">
                {successData.harvested.toLocaleString()}
              </span>{" "}
              birds from {load.buildingName}.
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-5 space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  Previous Available
                </span>
                <span className="text-foreground">
                  {successData.previousAvailable.toLocaleString()} birds
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-red-500 uppercase tracking-widest text-[10px]">
                  Just Harvested
                </span>
                <span className="text-red-600 dark:text-red-400">
                  - {successData.harvested.toLocaleString()} birds
                </span>
              </div>
              <div className="pt-4 border-t border-border/50 flex justify-between items-center text-base font-black">
                <span className="text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-[10px]">
                  Remaining Now
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {successData.remainingNow.toLocaleString()} birds
                </span>
              </div>
            </div>

            {successData.isClosed && (
              <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 p-4 rounded-xl text-xs font-bold uppercase tracking-widest mb-6">
                Building is now empty & available
              </div>
            )}

            <Button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            >
              Got it, Close
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Truck className="w-6 h-6" /> Log Harvest Batch
                </DialogTitle>
                <p className="text-emerald-100 font-medium text-sm mt-1 uppercase tracking-widest">
                  {load.buildingName} • {load.farmName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Live Bird Count */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">
                      Live Birds
                    </span>
                  </div>
                  <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                    {fetchingData ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `${availableBirds?.toLocaleString()}`
                    )}
                  </div>
                </div>

                {/* 2. REAL Total Expenses */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      Total Capital (Expenses)
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {fetchingData ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `₱${Number(totalExpenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Date of Harvest *
                  </label>
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 rounded-xl justify-between border-input font-normal px-3 bg-secondary/50",
                          !harvestDate && "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                          <span className="truncate">
                            {harvestDate
                              ? format(harvestDate, "MMM d, yyyy")
                              : "Pick date"}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-200" align="start">
                      <Calendar
                        mode="single"
                        selected={harvestDate}
                        onSelect={(date) => {
                          setHarvestDate(date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div
                  className="space-y-1.5"
                  onKeyUp={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.value !== undefined) {
                      setHarvestQuantity(target.value);
                    }
                  }}
                >
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    Quantity Harvested *
                  </label>
                  <FormattedNumberInput
                    name="quantity"
                    required
                    placeholder="e.g. 1,000"
                    className="h-11 rounded-xl font-black text-lg bg-emerald-50/50 border-emerald-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    Selling Price (₱) *
                  </label>
                  <FormattedNumberInput
                    name="sellingPrice"
                    required
                    allowDecimals={true}
                    defaultValue={load.sellingPrice?.toString() || ""}
                    placeholder="e.g. 180.50"
                    className="h-11 rounded-xl font-black text-lg bg-blue-50/50 border-blue-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    name="customerName"
                    placeholder="e.g. Otso Poultry"
                    className="h-11 rounded-xl font-bold bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Remarks
                </label>
                <Textarea
                  name="remarks"
                  placeholder="Notes about this specific batch..."
                  rows={2}
                  className="rounded-xl resize-none bg-secondary/50"
                />
              </div>

              {isExceeding ? (
                <div className="bg-red-100 border border-red-300 dark:bg-red-950/50 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3 mt-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="mt-0.5 w-5 h-5 flex items-center justify-center bg-red-500 rounded-full text-white shrink-0 font-black text-xs">
                    !
                  </div>
                  <div>
                    <span className="block text-sm font-black text-red-700 dark:text-red-500 uppercase tracking-tight">
                      Quantity Exceeds Inventory
                    </span>
                    <span className="block text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                      You typed {cleanQuantity.toLocaleString()}, but there are
                      only {availableBirds?.toLocaleString()} birds available.
                    </span>
                  </div>
                </div>
              ) : isAutoFinalHarvest ? (
                <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 rounded-xl p-4 flex items-start gap-3 mt-4 animate-in fade-in zoom-in-95 duration-300">
                  <CheckCircle2 className="mt-0.5 w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <div>
                    <span className="block text-sm font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-tight">
                      Automatic Final Harvest
                    </span>
                    <span className="block text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                      You are harvesting all remaining birds. This building will
                      be closed automatically.
                    </span>
                  </div>
                  <input type="hidden" name="isFinalHarvest" value="on" />
                </div>
              ) : (
                <div
                  className={cn(
                    "rounded-xl p-4 flex flex-col gap-3 mt-4 animate-in fade-in duration-300 transition-colors",
                    isManualClose
                      ? "bg-red-50 border border-red-300 dark:bg-red-900/20 dark:border-red-800"
                      : "bg-slate-50 border border-slate-200 dark:bg-slate-900/30 dark:border-slate-800/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="isFinalHarvest"
                      id="isFinalHarvest"
                      checked={isManualClose}
                      onChange={(e) => setIsManualClose(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="isFinalHarvest" className="cursor-pointer">
                      <span
                        className={cn(
                          "block text-sm font-black uppercase tracking-tight",
                          isManualClose
                            ? "text-red-700 dark:text-red-500"
                            : "text-slate-700 dark:text-slate-300",
                        )}
                      >
                        Final Harvest (Close Building)
                      </span>
                      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Check this manually if the building is completely empty
                        despite remaining inventory.
                      </span>
                    </label>
                  </div>

                  {isDiscrepancy && (
                    <div className="bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 p-3 rounded-lg text-xs font-bold flex gap-2 items-start border border-red-200 dark:border-red-900/50 animate-in slide-in-from-top-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <p>
                        <b>ACTION BLOCKED:</b> The system shows{" "}
                        <b>{remainingAfterHarvest.toLocaleString()} birds</b>{" "}
                        are still inside. You cannot close this building until
                        all remaining birds are accounted for or logged as
                        mortality.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading || fetchingData || isExceeding || isDiscrepancy
                  }
                  className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    "Save Harvest"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
