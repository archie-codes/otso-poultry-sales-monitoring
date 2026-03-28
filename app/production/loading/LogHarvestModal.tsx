"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRightLeft,
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

async function fetchOtherBuildingsInFarm(
  farmName: string,
  currentLoadId: number,
) {
  const res = await fetch(`/api/loads?farm=${encodeURIComponent(farmName)}`);
  if (!res.ok) return [];
  const loads = await res.json();
  return loads.filter((l: any) => l.isActive && l.id !== currentLoadId);
}

export default function LogHarvestModal({ load }: { load: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [availableBirds, setAvailableBirds] = useState<number | null>(null);
  const [totalExpenses, setTotalExpenses] = useState<number | null>(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [harvestDate, setHarvestDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isManualClose, setIsManualClose] = useState(false);

  const [autoFillKey, setAutoFillKey] = useState(0);

  const [harvestQuantity, setHarvestQuantity] = useState<string>("");
  const [sellingPriceInput, setSellingPriceInput] = useState<string>(
    load.sellingPrice?.toString() || "",
  );

  const cleanQuantity = Number(harvestQuantity.replace(/,/g, "").trim()) || 0;
  const cleanSellingPrice =
    Number(sellingPriceInput.replace(/,/g, "").trim()) || 0;
  const computedRevenue = cleanQuantity * cleanSellingPrice;

  const leftoverFeedsQty = Number(load.remainingFeeds || 0);
  const [otherActiveLoads, setOtherActiveLoads] = useState<any[]>([]);

  // ---> STRICT TIMEZONE SAFE PARSER <---
  let safeLoadDateObj: Date | null = null;
  if (load && load.loadDate) {
    const parts = String(load.loadDate).split("T")[0].split("-");
    if (parts.length === 3) {
      safeLoadDateObj = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      safeLoadDateObj.setHours(0, 0, 0, 0);
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Only reset data if we aren't currently showing the success screen
      if (!successData) {
        setFetchingData(true);
        setHarvestQuantity("");
        setSellingPriceInput(load.sellingPrice?.toString() || "");
        setHarvestDate(new Date());
        setIsManualClose(false);
        setAutoFillKey(0);

        Promise.all([
          getLiveBirdCount(load.id),
          getLoadTotalExpensesForHarvest(load.id),
        ]).then(([count, expenses]) => {
          setAvailableBirds(count);
          setTotalExpenses(expenses);
          setFetchingData(false);
        });

        if (leftoverFeedsQty > 0) {
          fetchOtherBuildingsInFarm(load.farmName, load.id).then((data) => {
            setOtherActiveLoads(data);
          });
        }
      }
    } else {
      // Only clear success data AFTER the modal has fully closed visually
      setTimeout(() => setSuccessData(null), 300);
    }
  }, [
    isOpen,
    load.id,
    load.sellingPrice,
    leftoverFeedsQty,
    load.farmName,
    successData,
  ]);

  const isAutoFinalHarvest =
    availableBirds !== null &&
    cleanQuantity === availableBirds &&
    availableBirds > 0;

  const isExceeding = availableBirds !== null && cleanQuantity > availableBirds;
  const remainingAfterHarvest = (availableBirds || 0) - cleanQuantity;

  const isDiscrepancy =
    !isAutoFinalHarvest && isManualClose && remainingAfterHarvest > 0;

  const isClosingBuilding = isAutoFinalHarvest || isManualClose;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!harvestDate) return toast.error("Please select a harvest date.");
    if (isExceeding)
      return toast.error("Cannot harvest more birds than available!");

    // ---> STRICT DATE VALIDATION <---
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (harvestDate.getTime() > today.getTime()) {
      toast.error("Invalid Date", {
        description: "Cannot log a harvest for a future date.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    if (safeLoadDateObj) {
      const hDate = new Date(harvestDate);
      hDate.setHours(0, 0, 0, 0);

      if (hDate.getTime() < safeLoadDateObj.getTime()) {
        toast.error("Invalid Date", {
          description: `Cannot harvest before load date (${format(safeLoadDateObj, "MMM d, yyyy")}).`,
          style: { backgroundColor: "red", color: "white", border: "none" },
        });
        return;
      }
    }
    // --------------------------------------

    const formData = new FormData(e.currentTarget);

    if (isDiscrepancy) {
      const confirmed = window.confirm(
        `⚠️ WARNING: DISCREPANCY DETECTED ⚠️\n\nYou are closing this building, but the system shows ${remainingAfterHarvest.toLocaleString()} birds are still inside.\n\nAre you absolutely sure this building is completely empty?`,
      );
      if (!confirmed) return;
    }

    setLoading(true);
    formData.set("loadId", String(load.id));
    formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));
    formData.set("quantity", String(cleanQuantity));
    formData.set("sellingPrice", String(cleanSellingPrice));

    if (isClosingBuilding) {
      formData.set("isFinalHarvest", "on");
      formData.set(
        "leftoverResolution",
        leftoverFeedsQty > 0 ? "transfer" : "none",
      );
    }

    const result = await logHarvest(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      // ---> THE FIX: Set success data but DO NOT close the modal yet! <---
      setSuccessData(result);
      if (isClosingBuilding && leftoverFeedsQty > 0) {
        toast.success("Batch Closed & Feeds Transferred!", {
          description: `${leftoverFeedsQty} sacks successfully moved to the new building.`,
        });
      }
    }
    setLoading(false);
  }

  // ---> THE FIX: Explicit close and refresh function <---
  function handleCloseAndRefresh() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Prevent accidental closing if the success screen is showing
        if (!open && successData) return;
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300 font-bold tracking-widest uppercase text-[10px] xl:text-xs px-2 rounded-xl shadow-sm transition-all overflow-hidden"
        >
          <Truck className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1.5 shrink-0" />
          <span className="truncate">Harvest</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => {
          // Force them to click the button if on success screen
          if (successData) e.preventDefault();
        }}
        // Force them to click the button if on success screen (hide X)
        showCloseButton={!successData}
        className="max-w-md rounded-[2rem] p-0 overflow-y-auto max-h-[90vh] no-scrollbar border-border/50 shadow-2xl"
      >
        {successData ? (
          <div className="p-6 md:p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground mb-2">
              Harvest Successful!
            </DialogTitle>
            <p className="text-muted-foreground text-sm font-medium mb-6">
              You harvested{" "}
              <span className="font-black text-foreground">
                {successData.harvested.toLocaleString()}
              </span>{" "}
              birds from {load.buildingName}.
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground uppercase tracking-widest text-[9px]">
                  Previous Available
                </span>
                <span className="text-foreground">
                  {successData.previousAvailable.toLocaleString()} birds
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-red-500 uppercase tracking-widest text-[9px]">
                  Just Harvested
                </span>
                <span className="text-red-600 dark:text-red-400">
                  - {successData.harvested.toLocaleString()} birds
                </span>
              </div>
              <div className="pt-3 border-t border-border/50 flex justify-between items-center text-sm font-black">
                <span className="text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-[9px]">
                  Remaining Now
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {successData.remainingNow.toLocaleString()} birds
                </span>
              </div>
            </div>

            {successData.isClosed && (
              <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-6">
                Building is now empty & available
              </div>
            )}

            <Button
              onClick={handleCloseAndRefresh}
              className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm"
            >
              Got it, Close
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-emerald-600 p-4 md:p-5 text-white flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Log Harvest Batch
                </DialogTitle>
                <p className="text-emerald-100 font-medium text-xs mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  <span>{load.buildingName}</span>
                  <span className="opacity-50">•</span>
                  <span className="text-white font-black">
                    {load.name || "UNNAMED BATCH"}
                  </span>
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 md:p-5 space-y-3.5 bg-card"
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Info className="w-3 h-3 text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">
                      Live Birds
                    </span>
                  </div>
                  <div className="text-base font-black text-blue-700">
                    {fetchingData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `${availableBirds?.toLocaleString()}`
                    )}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Wallet className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                      Total Capital
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-700 truncate">
                    {fetchingData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `₱${Number(totalExpenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
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
                          "w-full h-10 rounded-xl justify-between border-input font-normal px-3 bg-secondary/50",
                          !harvestDate && "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center text-md">
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-70 shrink-0" />
                          <span className="truncate">
                            {harvestDate
                              ? format(harvestDate, "MMM d, yyyy")
                              : "Pick date"}
                          </span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-200" align="start">
                      <Calendar
                        mode="single"
                        selected={harvestDate}
                        defaultMonth={harvestDate || new Date()}
                        captionLayout="dropdown"
                        fromYear={
                          safeLoadDateObj ? safeLoadDateObj.getFullYear() : 2020
                        }
                        toYear={new Date().getFullYear()}
                        onSelect={(date) => {
                          setHarvestDate(date);
                          setIsCalendarOpen(false); // Auto close
                        }}
                        disabled={(date) => {
                          // ---> DISABLED DATE LOGIC <---
                          const today = new Date();
                          today.setHours(23, 59, 59, 999);
                          if (date > today) return true; // Block future

                          if (safeLoadDateObj) {
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            if (checkDate.getTime() < safeLoadDateObj.getTime())
                              return true; // Block before load
                          }
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div
                  className="space-y-1"
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.value !== undefined) {
                      setHarvestQuantity(target.value);
                    }
                  }}
                >
                  <label className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                    Quantity Harvested *
                  </label>
                  <FormattedNumberInput
                    key={`qty-input-${autoFillKey}`}
                    name="displayQuantity"
                    required
                    defaultValue={harvestQuantity}
                    placeholder="e.g. 1,000"
                    className="h-10 rounded-xl font-black text-sm bg-emerald-50/50 border-emerald-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div
                  className="space-y-1"
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.value !== undefined) {
                      setSellingPriceInput(target.value);
                    }
                  }}
                >
                  <label className="text-[9px] font-bold uppercase tracking-widest text-blue-600">
                    Selling Price (₱) *
                  </label>
                  <FormattedNumberInput
                    name="displaySellingPrice"
                    required
                    allowDecimals={true}
                    defaultValue={load.sellingPrice?.toString() || ""}
                    placeholder="e.g. 180.50"
                    className="h-10 rounded-xl font-black text-sm bg-blue-50/50 border-blue-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    name="customerName"
                    placeholder="e.g. Magnolia"
                    className="h-10 rounded-xl font-bold text-sm bg-secondary/50"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border border-border/50 p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Estimated Revenue
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                      {cleanQuantity > 0 && cleanSellingPrice > 0
                        ? `${cleanQuantity.toLocaleString()} × ₱${cleanSellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "Enter details"}
                    </p>
                  </div>
                </div>
                <div className="text-base font-black text-emerald-600">
                  ₱
                  {computedRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Remarks
                </label>
                <Textarea
                  name="remarks"
                  placeholder="Notes..."
                  rows={1}
                  className="rounded-xl resize-none bg-secondary/50 min-h-[40px]"
                />
              </div>

              {isExceeding ? (
                <div className="bg-red-100 border border-red-300 rounded-xl p-3 flex items-start gap-2 mt-2">
                  <div className="mt-0.5 w-4 h-4 flex items-center justify-center bg-red-500 rounded-full text-white shrink-0 font-black text-[10px]">
                    !
                  </div>
                  <div>
                    <span className="block text-xs font-black text-red-700 uppercase tracking-tight">
                      Quantity Exceeds Inventory
                    </span>
                    <span className="block text-[10px] font-medium text-red-600 mt-0.5">
                      Only {availableBirds?.toLocaleString()} available.
                    </span>
                  </div>
                </div>
              ) : isAutoFinalHarvest ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex flex-col gap-2 mt-2 transition-colors">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="isFinalHarvest"
                      id="isFinalHarvest"
                      checked={true}
                      disabled={true}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 bg-emerald-200 border-emerald-300 cursor-not-allowed"
                    />
                    <label
                      htmlFor="isFinalHarvest"
                      className="cursor-not-allowed opacity-80"
                    >
                      <span className="block text-xs font-black uppercase tracking-tight text-emerald-800">
                        Final Harvest (Auto-Close)
                      </span>
                      <span className="block text-[10px] font-medium text-emerald-700 mt-0.5">
                        You are harvesting all{" "}
                        {availableBirds?.toLocaleString()} remaining birds. This
                        building will be closed automatically.
                      </span>
                    </label>
                  </div>
                  <input type="hidden" name="isFinalHarvest" value="on" />
                </div>
              ) : (
                <div
                  className={cn(
                    "rounded-xl p-3 flex flex-col gap-2 mt-2 transition-colors",
                    isManualClose
                      ? "bg-red-50 border border-red-300"
                      : "bg-slate-50 border border-slate-200",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="isFinalHarvest"
                      id="isFinalHarvest"
                      checked={isManualClose}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsManualClose(checked);

                        if (checked && availableBirds && cleanQuantity === 0) {
                          const formattedVal =
                            availableBirds.toLocaleString("en-US");
                          setHarvestQuantity(formattedVal);
                          setAutoFillKey((prev) => prev + 1);
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-red-600 cursor-pointer"
                    />
                    <label htmlFor="isFinalHarvest" className="cursor-pointer">
                      <span
                        className={cn(
                          "block text-xs font-black uppercase tracking-tight",
                          isManualClose ? "text-red-700" : "text-slate-700",
                        )}
                      >
                        Final Harvest (Close Building)
                      </span>
                      <span className="block text-[10px] font-medium text-slate-500 mt-0.5">
                        Check if building is completely empty.
                      </span>
                    </label>
                  </div>

                  {isDiscrepancy && (
                    <div className="mt-2 bg-red-100/80 p-2.5 rounded-lg border border-red-200 flex gap-2 animate-in fade-in zoom-in-95 duration-300">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <p className="text-[10px] text-red-800 leading-tight">
                        <strong className="font-black uppercase">
                          Warning:
                        </strong>{" "}
                        You are closing this building, but the system says{" "}
                        <strong>
                          {remainingAfterHarvest.toLocaleString()} birds
                        </strong>{" "}
                        are still inside! Only proceed if you are absolutely
                        sure.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isClosingBuilding && leftoverFeedsQty > 0 && (
                <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 space-y-3 animate-in slide-in-from-bottom-2 fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-800 dark:text-amber-500 uppercase tracking-tight">
                        Leftover Feeds Detected
                      </h4>
                      <p className="text-[10px] font-bold text-amber-700 mt-0.5">
                        There are{" "}
                        <strong className="text-amber-600">
                          {leftoverFeedsQty} sacks
                        </strong>{" "}
                        of feed remaining in this building. Transfer them before
                        closing.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5 mb-1.5">
                      <ArrowRightLeft className="w-3 h-3" />
                      Transfer to Building in {load.farmName} *
                    </label>

                    {otherActiveLoads.length > 0 ? (
                      <select
                        name="targetLoadId"
                        required
                        className="w-full h-10 px-3 rounded-lg border-amber-200 bg-white text-sm font-bold text-foreground focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="">-- Select Destination --</option>
                        {otherActiveLoads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.buildingName} ({l.name})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-10 flex items-center px-3 rounded-lg bg-red-100 text-red-600 text-xs font-bold border border-red-200">
                        No other active buildings found. Please add a new batch
                        first.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl font-bold h-10 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    fetchingData ||
                    isExceeding ||
                    (isClosingBuilding &&
                      leftoverFeedsQty > 0 &&
                      otherActiveLoads.length === 0)
                  }
                  className={cn(
                    "rounded-xl font-bold text-white px-6 h-10 text-xs transition-all",
                    isDiscrepancy
                      ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20"
                      : "bg-emerald-600 hover:bg-emerald-700",
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />{" "}
                      Saving...
                    </>
                  ) : isDiscrepancy ? (
                    "Force Close Building"
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
