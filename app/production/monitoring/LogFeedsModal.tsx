"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDailyRecord } from "./actions";
import {
  X,
  Loader2,
  Save,
  Package,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  MapPin,
  Warehouse,
  AlertCircle,
  ChevronDownIcon,
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

export default function LogFeedsModal({ activeLoads }: { activeLoads: any[] }) {
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

  const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const uniqueFarms = Array.from(
    new Set(activeLoads.map((l) => l.farmName)),
  ).sort();
  const filteredLoads = selectedFarm
    ? activeLoads
        .filter((l) => l.farmName === selectedFarm)
        .sort((a, b) =>
          a.buildingName.localeCompare(b.buildingName, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        )
    : [];

  const selectedLoad = activeLoads.find((l) => String(l.id) === loadId);
  const availableStock =
    selectedLoad && feedType && selectedLoad.feedStock
      ? selectedLoad.feedStock[feedType] || 0
      : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loadId || !recordDate || !feedType) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const feedsConsumed = Number(
      (e.currentTarget.elements.namedItem("feedsConsumed") as HTMLInputElement)
        .value,
    );

    if (feedsConsumed > availableStock) {
      toast.error(`Invalid! You only have ${availableStock} sacks left.`);
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("feedType", feedType);
    formData.set("recordDate", format(recordDate, "yyyy-MM-dd"));
    // Explicitly set mortality to 0
    formData.set("mortality", "0");

    const result = await addDailyRecord(formData);

    if (result.error)
      toast.error("Error Saving Data", { description: result.error });
    else {
      toast.success("Feed Usage Logged!");
      setIsOpen(false);
      setSelectedFarm("");
      setLoadId("");
      setFeedType("");
      setRecordDate(new Date());

      const params = new URLSearchParams(searchParams.toString());
      params.set("newId", String(result.newId));
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
      >
        <Package className="w-4 h-4 mr-2" /> Log Feeds
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="fixed z-101 w-full max-w-lg border bg-background p-6 shadow-2xl rounded-[2rem]">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-emerald-600 flex items-center">
                    <Package className="mr-2" /> Log Feed Usage
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Record empty sacks consumed today.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
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
                          className="w-full h-11 justify-between rounded-xl font-bold bg-background"
                        >
                          <span className="truncate">
                            {selectedFarm || "Select Farm"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {uniqueFarms.map((farm) => (
                                <CommandItem
                                  key={farm}
                                  onSelect={() => {
                                    setSelectedFarm(farm);
                                    setLoadId("");
                                    setOpenFarmSearch(false);
                                  }}
                                  className="font-bold cursor-pointer"
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
                          disabled={!selectedFarm}
                          className="w-full h-11 justify-between rounded-xl font-bold bg-background disabled:opacity-50"
                        >
                          <span className="truncate">
                            {selectedLoad
                              ? selectedLoad.buildingName
                              : "Select Building"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {filteredLoads.map((l: any) => (
                                <CommandItem
                                  key={l.id}
                                  onSelect={() => {
                                    setLoadId(String(l.id));
                                    setOpenLoadSearch(false);
                                  }}
                                  className="font-bold cursor-pointer"
                                >
                                  {l.buildingName}
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

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Date
                  </label>
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl px-3 flex items-center justify-between font-semibold"
                      >
                        {/* LEFT SIDE */}
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 opacity-70" />
                          <span>
                            {recordDate
                              ? format(recordDate, "MMM d, yyyy")
                              : "Select date"}
                          </span>
                        </div>

                        {/* RIGHT SIDE */}
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-200">
                      <Calendar
                        mode="single"
                        selected={recordDate}
                        onSelect={(d) => {
                          setRecordDate(d);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(d) => d > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Feed Type
                    </label>
                    <Popover open={openFeedType} onOpenChange={setOpenFeedType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!loadId}
                          className="w-full h-11 justify-between rounded-xl font-bold bg-white px-4 disabled:opacity-50"
                        >
                          {feedType || "Select..."}{" "}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {feedTypes.map((type) => {
                                const stock = selectedLoad
                                  ? Number(selectedLoad.feedStock?.[type] || 0)
                                  : 0;
                                return (
                                  <CommandItem
                                    key={type}
                                    value={type}
                                    onSelect={() => {
                                      setFeedType(type);
                                      setOpenFeedType(false);
                                    }}
                                    className="py-3 px-4 cursor-pointer"
                                  >
                                    <div className="flex items-center w-full">
                                      <span className="w-24 font-bold text-foreground">
                                        {type}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-xs font-bold",
                                          stock > 0
                                            ? "text-emerald-600"
                                            : "text-red-500",
                                        )}
                                      >
                                        ({stock} left)
                                      </span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          feedType === type
                                            ? "opacity-100 text-emerald-600"
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex justify-between">
                      Sacks
                      {feedType && (
                        <span
                          className={availableStock === 0 ? "text-red-500" : ""}
                        >
                          Max: {availableStock}
                        </span>
                      )}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="feedsConsumed"
                      min="0.01"
                      max={availableStock}
                      disabled={!feedType || availableStock === 0}
                      className={cn(
                        "h-11 rounded-xl font-black text-lg",
                        availableStock === 0 && feedType
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-white border-emerald-200",
                      )}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Remarks (Optional)
                  </label>
                  <Textarea
                    name="remarks"
                    placeholder="Any notes?"
                    rows={2}
                    className="rounded-xl resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-11 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading || (feedType !== "" && availableStock === 0)
                    }
                    className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Save Feeds
                      </>
                    ) : (
                      "Save Feeds"
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
