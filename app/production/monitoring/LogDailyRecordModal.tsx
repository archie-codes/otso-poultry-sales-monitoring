"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { addDailyRecord } from "./actions";
import {
  X,
  Loader2,
  Save,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ClipboardEdit,
  Warehouse,
  AlertCircle,
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
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";

export default function LogDailyRecordModal({
  activeLoads = [],
}: {
  activeLoads?: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);
  const [loadId, setLoadId] = useState("");
  const [openLoadSearch, setOpenLoadSearch] = useState(false);
  const [recordDate, setRecordDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [feedType, setFeedType] = useState("");
  const [openFeedType, setOpenFeedType] = useState(false);

  const [mortalityAm, setMortalityAm] = useState<number | string>("");
  const [mortalityPm, setMortalityPm] = useState<number | string>("");

  const [feedsAmWhole, setFeedsAmWhole] = useState<number | string>("");
  const [feedsAmFrac, setFeedsAmFrac] = useState<number>(0);
  const [feedsPmWhole, setFeedsPmWhole] = useState<number | string>("");
  const [feedsPmFrac, setFeedsPmFrac] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const safeLoads = activeLoads || [];
  const uniqueFarms = useMemo(
    () => Array.from(new Set(safeLoads.map((l) => l.farmName))).sort(),
    [safeLoads],
  );
  const filteredLoads = useMemo(() => {
    if (!selectedFarm) return [];
    return safeLoads
      .filter((l) => l.farmName === selectedFarm)
      .sort((a, b) =>
        a.buildingName.localeCompare(b.buildingName, undefined, {
          numeric: true,
        }),
      );
  }, [selectedFarm, safeLoads]);

  const selectedLoad = safeLoads.find((l) => String(l.id) === loadId);

  // ---> STRICT TIMEZONE SAFE PARSER <---
  let safeLoadDateObj: Date | null = null;
  if (selectedLoad && selectedLoad.loadDate) {
    const parts = String(selectedLoad.loadDate).split("T")[0].split("-");
    if (parts.length === 3) {
      safeLoadDateObj = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      safeLoadDateObj.setHours(0, 0, 0, 0);
    }
  }

  const availableFeedTypes = useMemo(() => {
    if (!selectedLoad || !selectedLoad.feedStock) return [];
    return Object.entries(selectedLoad.feedStock)
      .filter(([_, data]: [string, any]) => data.qty > 0)
      .map(([type, data]: [string, any]) => ({
        type,
        qty: data.qty,
        price: data.price,
      }));
  }, [selectedLoad]);

  const selectedFeedData =
    selectedLoad && feedType && selectedLoad.feedStock
      ? selectedLoad.feedStock[feedType]
      : null;
  const availableStock = selectedFeedData ? selectedFeedData.qty : 0;
  const feedPrice = selectedFeedData ? selectedFeedData.price : 0;

  const computedAmFeeds = (Number(feedsAmWhole) || 0) + feedsAmFrac;
  const computedPmFeeds = (Number(feedsPmWhole) || 0) + feedsPmFrac;
  const totalFeeds = computedAmFeeds + computedPmFeeds;
  const totalCost = totalFeeds * feedPrice;
  const totalMortality =
    (Number(mortalityAm) || 0) + (Number(mortalityPm) || 0);
  const isExceedingFeeds = feedType !== "" && totalFeeds > availableStock;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loadId || !recordDate)
      return toast.error("Please select a building and date.");

    if (totalFeeds === 0 && totalMortality === 0) {
      return toast.error("Empty Submission", {
        description:
          "You must enter at least 1 dead bird or some feed consumption to save a record.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    }

    if (totalFeeds > 0 && !feedType)
      return toast.error("Please select the Feed Type being consumed.");
    if (isExceedingFeeds)
      return toast.error(`Invalid! Only ${availableStock} sacks left.`);

    if (!selectedLoad?.loadDate) {
      toast.error("System Error", {
        description:
          "loadDate is missing. You MUST add `loadDate: loads.loadDate` to your database query in app/production/monitoring/page.tsx!",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    if (safeLoadDateObj) {
      const rDate = new Date(recordDate);
      rDate.setHours(0, 0, 0, 0);

      if (rDate.getTime() < safeLoadDateObj.getTime()) {
        toast.error("Invalid Date", {
          description: `This flock arrived on ${format(safeLoadDateObj, "MMM d, yyyy")}. You cannot log records before they arrived!`,
        });
        return;
      }
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("recordDate", format(recordDate, "yyyy-MM-dd"));
    formData.set("feedType", feedType);
    formData.set("mortalityAm", String(Number(mortalityAm) || 0));
    formData.set("mortalityPm", String(Number(mortalityPm) || 0));
    formData.set("feedsConsumedAm", String(computedAmFeeds));
    formData.set("feedsConsumedPm", String(computedPmFeeds));

    const result = await addDailyRecord(formData);

    if (result.error) {
      toast.error("Error Saving Data", { description: result.error });
    } else {
      toast.success("Daily Record Saved!", {
        description: "Mortality and Feeds successfully logged.",
      });
      setIsOpen(false);
      resetForm();

      const params = new URLSearchParams(searchParams.toString());
      params.set("newId", String(result.newId));
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
    setLoading(false);
  }

  const resetForm = () => {
    setSelectedFarm("");
    setLoadId("");
    setFeedType("");
    setMortalityAm("");
    setMortalityPm("");
    setFeedsAmWhole("");
    setFeedsAmFrac(0);
    setFeedsPmWhole("");
    setFeedsPmFrac(0);
    setRecordDate(new Date());
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-12 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
      >
        <ClipboardEdit className="w-4 h-4 mr-2" /> Log Daily Update
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-4xl border border-border/50 bg-background shadow-2xl sm:rounded-[2.5rem] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 pb-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-blue-600 flex items-center">
                    <ClipboardEdit className="mr-2" /> Log Daily Record
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    Record today's mortality and precise feed consumption.
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
                  id="dailyRecordForm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Farm *
                      </label>
                      <Popover
                        open={openFarmSearch}
                        onOpenChange={setOpenFarmSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openFarmSearch}
                            className="w-full h-11 justify-between rounded-xl font-bold bg-slate-50 dark:bg-slate-900"
                          >
                            <span className="truncate">
                              {selectedFarm || "Select Farm"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                {uniqueFarms.map((farm) => (
                                  <CommandItem
                                    key={farm}
                                    onSelect={() => {
                                      setSelectedFarm(farm);
                                      setLoadId("");
                                      setFeedType("");
                                      setOpenFarmSearch(false);
                                    }}
                                    className="font-bold cursor-pointer"
                                  >
                                    {farm}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedFarm === farm
                                          ? "opacity-100 text-blue-600"
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

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Building *
                      </label>
                      <Popover
                        open={openLoadSearch}
                        onOpenChange={setOpenLoadSearch}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openLoadSearch}
                            disabled={!selectedFarm}
                            className={cn(
                              "w-full h-11 justify-between rounded-xl font-bold bg-slate-50 dark:bg-slate-900 disabled:opacity-50",
                              !loadId && "text-muted-foreground",
                            )}
                          >
                            <span className="truncate uppercase text-xs tracking-wider">
                              {/* ---> THE FIX: Checking name, loadName, AND batchName <--- */}
                              {selectedLoad
                                ? `${selectedLoad.buildingName} - ${selectedLoad.name || selectedLoad.loadName || selectedLoad.batchName || "UNNAMED"}`
                                : "-- Select Target --"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                          <Command>
                            <CommandInput placeholder="Search building or batch..." />
                            <CommandList>
                              <CommandEmpty>
                                No active buildings found.
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredLoads.map((l: any) => {
                                  // ---> THE FIX: Checking name, loadName, AND batchName <---
                                  const batchName =
                                    l.name ||
                                    l.loadName ||
                                    l.batchName ||
                                    "UNNAMED";

                                  return (
                                    <CommandItem
                                      key={l.id}
                                      value={`${l.buildingName} ${batchName}`}
                                      onSelect={() => {
                                        setLoadId(String(l.id));
                                        setFeedType("");
                                        setOpenLoadSearch(false);

                                        if (l.loadDate && recordDate) {
                                          const parts = String(l.loadDate)
                                            .split("T")[0]
                                            .split("-");
                                          if (parts.length === 3) {
                                            const lDate = new Date(
                                              Number(parts[0]),
                                              Number(parts[1]) - 1,
                                              Number(parts[2]),
                                            );
                                            lDate.setHours(0, 0, 0, 0);
                                            const rDate = new Date(recordDate);
                                            rDate.setHours(0, 0, 0, 0);
                                            if (
                                              rDate.getTime() < lDate.getTime()
                                            )
                                              setRecordDate(lDate);
                                          }
                                        }
                                      }}
                                      className="font-bold text-xs uppercase tracking-wider cursor-pointer py-2.5"
                                    >
                                      <Warehouse className="w-3.5 h-3.5 mr-2 opacity-50" />
                                      {l.buildingName} - {batchName}
                                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-200">
                                        Active
                                      </span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4 text-emerald-600",
                                          loadId === String(l.id)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
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
                        Date *
                      </label>
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-11 rounded-xl px-3 flex items-center justify-between font-bold bg-slate-50 dark:bg-slate-900"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <CalendarIcon className="h-4 w-4 opacity-70 shrink-0" />
                              <span className="truncate">
                                {recordDate
                                  ? format(recordDate, "MMM d, yyyy")
                                  : "Select date"}
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-200">
                          <Calendar
                            mode="single"
                            selected={recordDate}
                            defaultMonth={recordDate || new Date()}
                            captionLayout="dropdown"
                            fromYear={
                              safeLoadDateObj
                                ? safeLoadDateObj.getFullYear()
                                : 2020
                            }
                            toYear={new Date().getFullYear()}
                            onSelect={(d) => {
                              if (d) {
                                setRecordDate(d);
                                setIsCalendarOpen(false); // Auto closes!
                              }
                            }}
                            disabled={(d) => {
                              const today = new Date();
                              today.setHours(23, 59, 59, 999);
                              if (d > today) return true; // Block future
                              if (safeLoadDateObj) {
                                const checkDate = new Date(d);
                                checkDate.setHours(0, 0, 0, 0);
                                if (
                                  checkDate.getTime() <
                                  safeLoadDateObj.getTime()
                                )
                                  return true; // Block past
                              }
                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-12 gap-6 items-start">
                    {/* 2. MORTALITY (Col Span 4) */}
                    <div className="md:col-span-4 bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-[2rem] p-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.2em] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> Mortality
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            AM
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={mortalityAm}
                            onChange={(e) => setMortalityAm(e.target.value)}
                            placeholder="0"
                            className="h-11 font-black bg-white dark:bg-slate-950 border-red-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            PM
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={mortalityPm}
                            onChange={(e) => setMortalityPm(e.target.value)}
                            placeholder="0"
                            className="h-11 font-black bg-white dark:bg-slate-950 border-red-200"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200/50">
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Total Dead
                        </span>
                        <span className="text-2xl font-black">
                          {totalMortality}
                        </span>
                      </div>
                    </div>

                    {/* 3. FEEDS (Col Span 8) */}
                    <div className="md:col-span-8 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] p-6 space-y-5">
                      <div className="flex justify-between items-center pb-2 border-b border-amber-200/30">
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] flex items-center gap-2">
                          <Warehouse className="w-3.5 h-3.5" /> Feeds Eaten
                        </h4>
                        <Popover
                          open={openFeedType}
                          onOpenChange={setOpenFeedType}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!selectedLoad}
                              className="h-8 text-[10px] uppercase font-bold tracking-widest px-3 bg-white dark:bg-slate-950 border-amber-200 disabled:opacity-50"
                            >
                              {feedType || "Select Type"}{" "}
                              <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="p-0 z-200 w-52"
                            align="end"
                          >
                            <Command>
                              <CommandList>
                                <CommandGroup heading="Stocks inside Building">
                                  {availableFeedTypes.length === 0 ? (
                                    <div className="p-3 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                      No stock transferred yet!
                                    </div>
                                  ) : (
                                    availableFeedTypes.map(({ type, qty }) => (
                                      <CommandItem
                                        key={type}
                                        onSelect={() => {
                                          setFeedType(type);
                                          setOpenFeedType(false);
                                        }}
                                        className="text-xs font-bold cursor-pointer uppercase flex justify-between py-2"
                                      >
                                        <span>{type}</span>
                                        <span className="text-muted-foreground text-[10px] font-bold bg-secondary px-2 py-0.5 rounded-md">
                                          {qty} Left
                                        </span>
                                      </CommandItem>
                                    ))
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                        {/* AM FRACTION UI */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">
                            AM Usage
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={feedsAmWhole}
                            onChange={(e) => setFeedsAmWhole(e.target.value)}
                            placeholder="0"
                            className="h-11 font-black bg-white dark:bg-slate-950 border-amber-200 w-full"
                            disabled={!feedType}
                          />
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            <Button
                              type="button"
                              variant={
                                feedsAmFrac === 0 ? "default" : "outline"
                              }
                              onClick={() => setFeedsAmFrac(0)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsAmFrac === 0 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              .0
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsAmFrac === 0.25 ? "default" : "outline"
                              }
                              onClick={() => setFeedsAmFrac(0.25)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsAmFrac === 0.25 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ¼
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsAmFrac === 0.5 ? "default" : "outline"
                              }
                              onClick={() => setFeedsAmFrac(0.5)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsAmFrac === 0.5 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ½
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsAmFrac === 0.75 ? "default" : "outline"
                              }
                              onClick={() => setFeedsAmFrac(0.75)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsAmFrac === 0.75 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ¾
                            </Button>
                          </div>
                        </div>

                        {/* PM FRACTION UI */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">
                            PM Usage
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={feedsPmWhole}
                            onChange={(e) => setFeedsPmWhole(e.target.value)}
                            placeholder="0"
                            className="h-11 font-black bg-white dark:bg-slate-950 border-amber-200 w-full"
                            disabled={!feedType}
                          />
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            <Button
                              type="button"
                              variant={
                                feedsPmFrac === 0 ? "default" : "outline"
                              }
                              onClick={() => setFeedsPmFrac(0)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsPmFrac === 0 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              .0
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsPmFrac === 0.25 ? "default" : "outline"
                              }
                              onClick={() => setFeedsPmFrac(0.25)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsPmFrac === 0.25 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ¼
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsPmFrac === 0.5 ? "default" : "outline"
                              }
                              onClick={() => setFeedsPmFrac(0.5)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsPmFrac === 0.5 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ½
                            </Button>
                            <Button
                              type="button"
                              variant={
                                feedsPmFrac === 0.75 ? "default" : "outline"
                              }
                              onClick={() => setFeedsPmFrac(0.75)}
                              className={cn(
                                "h-9 text-xs font-black px-0",
                                feedsPmFrac === 0.75 &&
                                  "bg-amber-500 hover:bg-amber-600 text-white",
                              )}
                              disabled={!feedType}
                            >
                              ¾
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* LIVE COST ESTIMATOR WITH PRICE */}
                      <div
                        className={cn(
                          "flex justify-between items-center p-4 rounded-2xl transition-colors border",
                          isExceedingFeeds
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-amber-100/50 dark:bg-amber-900/20 border-amber-200/50 text-amber-700 dark:text-amber-500",
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Total Sacks Consumed
                          </span>
                          {feedType && feedPrice > 0 && !isExceedingFeeds && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-0.5 tracking-wider uppercase">
                              Est. Cost: ₱
                              {totalCost.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>
                        <span className="text-2xl font-black flex items-center gap-2">
                          {totalFeeds}{" "}
                          <span className="text-[10px] font-bold opacity-70 tracking-widest uppercase">
                            / {availableStock} max
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REMARKS */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Remarks (Optional)
                    </label>
                    <Textarea
                      name="remarks"
                      placeholder="Any notes for today?"
                      rows={2}
                      className="rounded-2xl resize-none bg-slate-50 dark:bg-slate-900 border-border/50"
                    />
                  </div>
                </form>
              </div>

              {/* ---> LOCKED FOOTER <--- */}
              <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
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
                  form="dailyRecordForm"
                  disabled={loading || isExceedingFeeds || !loadId}
                  className="h-11 px-8 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}{" "}
                  Save Daily Record
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
