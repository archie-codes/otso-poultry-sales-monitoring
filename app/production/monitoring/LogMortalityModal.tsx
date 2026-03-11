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
  MapPin,
  Warehouse,
  ChevronDown,
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

export default function LogMortalityModal({
  activeLoads,
}: {
  activeLoads: any[];
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loadId || !recordDate) {
      toast.error("Please select a building and date.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("recordDate", format(recordDate, "yyyy-MM-dd"));
    // Explicitly set feeds to 0 since we are only doing mortality
    formData.set("feedsConsumed", "0");
    formData.set("feedType", "");

    const result = await addDailyRecord(formData);

    if (result.error)
      toast.error("Error Saving Data", { description: result.error });
    else {
      toast.success("Mortality Logged!", {
        description: "The daily mortality data has been recorded.",
      });
      setIsOpen(false);
      setSelectedFarm("");
      setLoadId("");
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
        variant="outline"
        className="h-11 px-5 rounded-xl font-bold border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all"
      >
        <Activity className="w-4 h-4 mr-2" /> Log Mortality
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="fixed z-101 w-full max-w-lg border bg-background p-6 shadow-2xl rounded-[2rem]">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-red-600 flex items-center">
                    <Activity className="mr-2" /> Log Mortality
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Record dead birds from morning rounds.
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
                {/* FARM & BUILDING */}
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
                                        ? "opacity-100 text-red-600"
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
                                        ? "opacity-100 text-red-600"
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

                {/* DATE & MORTALITY */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-red-600">
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-red-600">
                      Dead Birds
                    </label>
                    <Input
                      type="number"
                      name="mortality"
                      min="1"
                      required
                      className="h-11 rounded-xl font-black text-lg bg-white border-red-200"
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
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Save
                        Mortality
                      </>
                    ) : (
                      "Save Mortality"
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
