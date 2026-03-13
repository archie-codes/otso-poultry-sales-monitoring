"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { logFeedDelivery } from "./actions";
import {
  X,
  Loader2,
  ArrowDownToLine,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  FileText,
  MapPin, // Added for Farm
  Home, // Added for Building
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

export default function AddFeedDeliveryModal({
  activeLoads,
}: {
  activeLoads: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- NEW CASCADING STATES ---
  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [loadId, setLoadId] = useState(""); // Represents the active building
  const [openBuildingSearch, setOpenBuildingSearch] = useState(false);

  const [feedType, setFeedType] = useState("");
  const [openType, setOpenType] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

  useEffect(() => setMounted(true), []);

  // --- SMART FILTERING LOGIC ---
  // 1. Get unique farms that currently have active loads
  const uniqueFarms = Array.from(
    new Set(activeLoads.map((load) => load.farmName)),
  );

  // 2. Filter loads based on the selected farm
  const filteredLoads = selectedFarm
    ? activeLoads.filter((load) => load.farmName === selectedFarm)
    : [];

  const selectedLoad = activeLoads.find((l) => String(l.id) === loadId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // VALIDATION
    if (!selectedFarm) {
      toast.error("Missing Field", {
        description: "Please select a Farm first.",
      });
      return;
    }
    if (!loadId) {
      toast.error("Missing Field", {
        description: "Please select a Target Building.",
      });
      return;
    }
    if (!feedType) {
      toast.error("Missing Field", {
        description: "Please select a Feed Type.",
      });
      return;
    }
    if (!deliveryDate) {
      toast.error("Missing Field", {
        description: "Please select a Delivery Date.",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("feedType", feedType);
    formData.set("transactionDate", format(deliveryDate, "yyyy-MM-dd"));

    // Ensure we strip commas before sending to DB
    const qty = formData.get("quantity") as string;
    if (qty) formData.set("quantity", qty.replace(/,/g, ""));
    const cost = formData.get("costPerBag") as string;
    if (cost) formData.set("costPerBag", cost.replace(/,/g, ""));

    const result = await logFeedDelivery(formData);

    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Delivery Logged Successfully!");
      setIsOpen(false);
      setSelectedFarm("");
      setLoadId("");
      setFeedType("");
      setDeliveryDate(new Date());
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
      >
        <ArrowDownToLine className="w-4 h-4 mr-2" /> Log Delivery
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-2xl border border-border/50 bg-background p-6 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4 sticky top-0 bg-background z-10">
                <div>
                  <h2 className="text-xl font-black text-emerald-600 flex items-center gap-2">
                    <ArrowDownToLine className="w-5 h-5" /> Receive Feeds
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log incoming feed deliveries to an active building.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. TWO-STEP CASCADING DROPDOWNS (FARM -> BUILDING) */}
                <div className="grid md:grid-cols-2 gap-5 p-5 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                  {/* STEP 1: SELECT FARM */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
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
                          className="w-full h-[46px] justify-between rounded-xl bg-background border-input px-4 font-normal shadow-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="truncate font-bold text-sm">
                              {selectedFarm || "Choose a Farm..."}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search farm..." />
                          <CommandList className="max-h-[200px] custom-scrollbar">
                            <CommandEmpty>No active farms found.</CommandEmpty>
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
                                    setLoadId(""); // Reset building when farm changes!
                                    setOpenFarmSearch(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <span className="font-bold text-sm">
                                    {farm}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 text-emerald-600",
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

                  {/* STEP 2: SELECT BUILDING */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                      2. Deliver To Building{" "}
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
                          className="w-full h-[46px] justify-between rounded-xl bg-background border-input px-4 font-normal disabled:opacity-50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Home className="h-4 w-4 text-emerald-600 shrink-0" />
                            {selectedLoad ? (
                              <span className="font-bold text-sm truncate">
                                {selectedLoad.buildingName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground truncate">
                                {selectedFarm
                                  ? "Choose a Building..."
                                  : "Pick a Farm first"}
                              </span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search building..." />
                          <CommandList className="max-h-[200px] custom-scrollbar">
                            <CommandEmpty>
                              No active buildings found.
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredLoads.map((load) => (
                                <CommandItem
                                  key={load.id}
                                  value={load.buildingName}
                                  onSelect={() => {
                                    setLoadId(String(load.id));
                                    setOpenBuildingSearch(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <span className="font-bold text-sm">
                                    {load.buildingName}
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
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 2. FEED TYPE & DATE */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Feed Type <span className="text-red-500">*</span>
                    </label>
                    <Popover open={openType} onOpenChange={setOpenType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-[46px] justify-between rounded-xl font-bold bg-background border-input shadow-sm"
                        >
                          <span className="truncate">
                            {feedType || "Select feed type..."}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {feedTypes.map((type) => {
                                // Calculate stock for this specific type in the selected building
                                const currentStock =
                                  selectedLoad?.feedStock?.[type] || 0;

                                return (
                                  <CommandItem
                                    key={type}
                                    value={type}
                                    onSelect={() => {
                                      setFeedType(type);
                                      setOpenType(false);
                                    }}
                                    className="font-bold py-2.5 cursor-pointer flex justify-between items-center w-full"
                                  >
                                    <span
                                      className={cn(
                                        feedType === type
                                          ? "text-emerald-600"
                                          : "",
                                      )}
                                    >
                                      {type}
                                    </span>

                                    <div className="flex items-center gap-3">
                                      {/* DYNAMIC STOCK BADGE */}
                                      {selectedLoad ? (
                                        <span
                                          className={cn(
                                            "text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest",
                                            currentStock > 0
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-slate-100 text-slate-400",
                                          )}
                                        >
                                          {currentStock} Sacks
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest bg-slate-50 text-slate-300">
                                          Select Bldg
                                        </span>
                                      )}

                                      <Check
                                        className={cn(
                                          "h-4 w-4 text-emerald-600",
                                          feedType === type
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Date Received <span className="text-red-500">*</span>
                    </label>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-[46px] rounded-xl justify-between font-bold bg-background border-input shadow-sm transition-none",
                            !deliveryDate && "text-muted-foreground",
                          )}
                        >
                          <div className="flex items-center truncate">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                            <span className="truncate">
                              {deliveryDate
                                ? format(deliveryDate, "MMM d, yyyy")
                                : "Pick a date"}
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-200"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={(date) => {
                            setDeliveryDate(date);
                            setIsCalendarOpen(false); // Auto close
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 3. FINANCIALS (QTY & COST) */}
                <div className="grid grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
                      Total Sacks <span className="text-red-500">*</span>
                    </label>
                    <FormattedNumberInput
                      name="quantity"
                      required
                      placeholder="e.g., 50"
                      className="h-12 rounded-xl bg-background font-bold text-lg border-emerald-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">
                      Cost Per Bag (₱) <span className="text-red-500">*</span>
                    </label>
                    <FormattedNumberInput
                      name="costPerBag"
                      required
                      allowDecimals={true}
                      placeholder="1,100.00"
                      className="h-12 rounded-xl font-bold bg-background border-emerald-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 4. DR & REMARKS */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Delivery Receipt No.
                    </label>
                    <Input
                      name="referenceNumber"
                      placeholder="e.g. DR-10293"
                      className="h-[46px] rounded-xl bg-background shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Remarks / Supplier
                    </label>
                    <Input
                      name="remarks"
                      placeholder="e.g. B-MEG Supplies"
                      className="h-[46px] rounded-xl bg-background shadow-sm"
                    />
                  </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border/50 mt-2">
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
                    disabled={loading}
                    className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />{" "}
                        Saving...
                      </>
                    ) : (
                      "Save Delivery"
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
