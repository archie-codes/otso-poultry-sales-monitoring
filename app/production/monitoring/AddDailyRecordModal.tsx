"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDailyRecord } from "./actions";
import {
  X,
  Loader2,
  Save,
  Activity,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Package,
  MapPin, // Added for Farm Icon
  Warehouse, // Added for Building Icon
  AlertCircle, // Added for low stock warning
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export default function AddDailyRecordModal({
  activeLoads,
}: {
  activeLoads: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // CASCADING STATES
  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [loadId, setLoadId] = useState("");
  const [openLoadSearch, setOpenLoadSearch] = useState(false);

  const [recordDate, setRecordDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [feedType, setFeedType] = useState("");
  const [openFeedType, setOpenFeedType] = useState(false);
  const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // FILTER LOGIC
  const uniqueFarms = Array.from(new Set(activeLoads.map((l) => l.farmName)));
  const filteredLoads = selectedFarm
    ? activeLoads.filter((l) => l.farmName === selectedFarm)
    : [];

  const selectedLoad = activeLoads.find((l) => String(l.id) === loadId);

  // LIVE STOCK CALCULATION
  const availableStock =
    selectedLoad && feedType && selectedLoad.feedStock
      ? selectedLoad.feedStock[feedType] || 0
      : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loadId) {
      toast.error("Missing Field", {
        description: "Please select a building.",
      });
      return;
    }
    if (!recordDate) {
      toast.error("Missing Field", { description: "Please select a date." });
      return;
    }

    const feedsConsumed = Number(
      (e.currentTarget.elements.namedItem("feedsConsumed") as HTMLInputElement)
        .value,
    );

    if (feedType === "" && feedsConsumed > 0) {
      toast.error("Missing Feed Type", {
        description: "Please select the type of feed consumed.",
      });
      return;
    }

    // Optional: Warn if they consume more than available stock, but don't strictly block it
    // in case they just haven't logged the delivery receipt yet.
    if (feedsConsumed > availableStock && feedType !== "") {
      toast.warning("Stock Alert", {
        description:
          "You are logging more sacks than currently registered in inventory.",
      });
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("feedType", feedType);
    formData.set("recordDate", format(recordDate, "yyyy-MM-dd"));

    const result = await addDailyRecord(formData);

    if (result.error) {
      toast.error("Error Saving Data", { description: result.error });
    } else {
      toast.success("Record Saved!", {
        description: "The daily monitoring data has been logged.",
      });
      setIsOpen(false);

      // Reset Form
      setSelectedFarm("");
      setLoadId("");
      setFeedType("");
      setRecordDate(new Date());

      const params = new URLSearchParams(searchParams.toString());
      params.set("newId", String(result.newId));
      params.set("page", "1");
      params.delete("farm");
      params.delete("building");
      params.delete("date");

      router.push(`?${params.toString()}`, { scroll: false });
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95"
      >
        <Activity className="w-5 h-5 mr-2" />
        <span className="truncate">Log Daily Data</span>
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-xl border bg-background p-6 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black text-emerald-600">
                    Daily Input
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Log mortality and feed consumption.
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
                {/* STEP 1: FARM & BUILDING CASCADING */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SELECT FARM */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      1. Select Farm *
                    </label>
                    <Popover
                      open={openFarmSearch}
                      onOpenChange={setOpenFarmSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-bold"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-600 opacity-70" />
                            <span className="truncate">
                              {selectedFarm || "Choose Farm..."}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search farm..." />
                          <CommandList>
                            <CommandEmpty>No farms found.</CommandEmpty>
                            <CommandGroup>
                              {uniqueFarms.map((farm) => (
                                <CommandItem
                                  key={farm}
                                  onSelect={() => {
                                    setSelectedFarm(farm);
                                    setLoadId(""); // Reset building when farm changes
                                    setOpenFarmSearch(false);
                                  }}
                                  className="font-bold py-2.5"
                                >
                                  {farm}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      selectedFarm === farm
                                        ? "opacity-100 text-emerald-600"
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

                  {/* SELECT BUILDING */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      2. Select Building *
                    </label>
                    <Popover
                      open={openLoadSearch}
                      onOpenChange={setOpenLoadSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!selectedFarm}
                          className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 disabled:opacity-50"
                        >
                          {selectedLoad ? (
                            <div className="flex items-center gap-2 font-bold">
                              <Warehouse className="h-4 w-4 text-emerald-600 opacity-70" />
                              <span className="truncate">
                                {selectedLoad.buildingName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-semibold">
                              {selectedFarm
                                ? "Choose Building..."
                                : "Select farm first"}
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search building..." />
                          <CommandList className="max-h-[300px] custom-scrollbar">
                            <CommandEmpty>
                              No active buildings found.
                            </CommandEmpty>
                            <CommandGroup
                              heading="Active Flocks"
                              className="text-emerald-600 font-black tracking-widest"
                            >
                              {filteredLoads.map((l: any) => (
                                <CommandItem
                                  key={l.id}
                                  onSelect={() => {
                                    setLoadId(String(l.id));
                                    setOpenLoadSearch(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="font-bold text-sm">
                                      {l.buildingName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                      {l.quantity.toLocaleString()} Birds
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      loadId === String(l.id)
                                        ? "opacity-100 text-emerald-600"
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

                {/* STEP 2: DATE & FEED TYPE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Record Date *
                    </label>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 rounded-xl justify-between border-input px-4 font-bold",
                            !recordDate && "text-muted-foreground",
                          )}
                        >
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                            {recordDate
                              ? format(recordDate, "MMM d, yyyy")
                              : "Pick a date"}
                          </div>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-200">
                        <Calendar
                          mode="single"
                          selected={recordDate}
                          onSelect={(date) => {
                            setRecordDate(date);
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Feed Type Consumed
                    </label>
                    <Popover open={openFeedType} onOpenChange={setOpenFeedType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl justify-between bg-background border-input px-4 font-bold"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-600 opacity-70" />
                            <span>{feedType || "Select Feed Type..."}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {feedTypes.map((type) => (
                                <CommandItem
                                  key={type}
                                  onSelect={() => {
                                    setFeedType(type);
                                    setOpenFeedType(false);
                                  }}
                                  className="py-3 font-bold"
                                >
                                  {type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* STEP 3: INPUT DATA & STOCK DISPLAY */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500">
                        Mortality (Head)
                      </label>
                      <Input
                        type="number"
                        name="mortality"
                        defaultValue={0}
                        min="0"
                        className="h-11 rounded-xl bg-background font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-500">
                          Feeds (Sacks)
                        </label>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        name="feedsConsumed"
                        defaultValue={0}
                        min="0"
                        className="h-11 rounded-xl bg-background font-bold"
                      />
                    </div>
                  </div>

                  {/* THE LIVE STOCK INDICATOR */}
                  {selectedLoad && feedType && (
                    <div
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border",
                        availableStock > 10
                          ? "bg-emerald-50/50 border-emerald-100"
                          : "bg-red-50/50 border-red-100",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {availableStock > 10 ? (
                          <Package className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {feedType} Stock in {selectedLoad.buildingName}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-black",
                          availableStock > 10
                            ? "text-emerald-700"
                            : "text-red-600",
                        )}
                      >
                        {availableStock} Sacks
                      </span>
                    </div>
                  )}
                </div>

                {/* REMARKS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Remarks / Notes
                  </label>
                  <Textarea
                    name="remarks"
                    placeholder="e.g., Temperature high, added vitamins..."
                    rows={2}
                    className="rounded-xl bg-background resize-none border-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-2">
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
                    className="h-12 px-10 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> Submit Record
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
