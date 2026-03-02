"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Home,
  Check,
  ChevronsUpDown,
  Loader2,
  CalendarIcon,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import RecordActions from "./RecordActions";

export default function MonitoringTableClient({
  history,
  farms,
  buildings,
  totalPages,
  currentPage,
}: {
  history: any[];
  farms: string[];
  buildings: string[];
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFarm = searchParams.get("farm") || "all";
  const selectedBuilding = searchParams.get("building") || "all";
  const selectedDateParam = searchParams.get("date");
  const selectedDate =
    selectedDateParam && selectedDateParam !== "all"
      ? parseISO(selectedDateParam)
      : undefined;

  // --- NEW: HIGHLIGHT LOGIC ---
  const newIdFromUrl = searchParams.get("newId");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (newIdFromUrl) {
      setHighlightedId(newIdFromUrl);

      // After 3 seconds, remove the highlight state and silently clean the URL
      const timer = setTimeout(() => {
        setHighlightedId(null);
        const params = new URLSearchParams(window.location.search);
        params.delete("newId");
        router.replace(`?${params.toString()}`, { scroll: false });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [newIdFromUrl, router]);

  const [openFarm, setOpenFarm] = useState(false);
  const [openBuilding, setOpenBuilding] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters =
    selectedFarm !== "all" || selectedBuilding !== "all" || !!selectedDate;

  const updateFilter = (type: "farm" | "building" | "date", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(type);
      if (type === "farm") params.delete("building");
    } else {
      params.set(type, value);
      if (type === "farm") params.delete("building");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.push("?", { scroll: false });
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col relative">
      {/* TABLE HEADER & FILTERS */}
      <div className="px-6 py-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-foreground text-lg shrink-0">
            Recent Activity Logs
          </h2>
          {isPending && (
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
          <div className="flex items-center text-muted-foreground mr-1 shrink-0 px-2 lg:flex">
            <Filter className="w-4 h-4 mr-2 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filters
            </span>
          </div>

          {/* DATE FILTER */}
          <div className="w-full sm:w-auto bg-white dark:bg-slate-950 rounded-xl border border-border focus-within:ring-2 ring-emerald-500/50 transition-shadow flex items-center pr-1 shrink-0">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  className={cn(
                    "w-full sm:w-[160px] justify-between h-11 hover:bg-transparent hover:text-foreground rounded-xl px-4 text-left font-bold uppercase tracking-wider text-xs",
                    !selectedDate && "text-slate-500 dark:text-slate-400",
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <CalendarIcon className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">
                      {selectedDate
                        ? format(selectedDate, "MMM d, yyyy")
                        : "DATE"}
                    </span>
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl border-border shadow-xl">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      updateFilter("date", format(date, "yyyy-MM-dd"));
                      setOpenDate(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {selectedDate && (
              <button
                onClick={() => updateFilter("date", "all")}
                disabled={isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* FARM FILTER */}
          <div className="w-full sm:w-48 xl:w-56 bg-white dark:bg-slate-950 rounded-xl border border-border focus-within:ring-2 ring-emerald-500/50 transition-shadow shrink-0">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={openFarm}
                  disabled={isPending}
                  className="w-full justify-between h-11 hover:bg-transparent hover:text-foreground rounded-xl px-4"
                >
                  <div className="flex items-center text-slate-500 dark:text-slate-400 min-w-0">
                    <Warehouse className="w-4 h-4 mr-2 shrink-0" />
                    <span className="font-bold text-foreground uppercase tracking-wider truncate text-xs">
                      {selectedFarm === "all" ? "ALL FARMS" : selectedFarm}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="-(--radix-popover-trigger-width) p-0 rounded-xl border-border shadow-xl">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList className="max-h-[250px] custom-scrollbar">
                    <CommandEmpty>No farm found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("farm", "all");
                          setOpenFarm(false);
                        }}
                        className="font-bold uppercase tracking-wider cursor-pointer py-3 text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFarm === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL FARMS
                      </CommandItem>
                      {farms.map((f: string) => (
                        <CommandItem
                          key={f}
                          value={f}
                          onSelect={() => {
                            updateFilter("farm", f);
                            setOpenFarm(false);
                          }}
                          className="font-bold uppercase tracking-wider cursor-pointer py-3 text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFarm === f ? "opacity-100" : "opacity-0",
                            )}
                          />{" "}
                          {f}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* BUILDING FILTER */}
          <div className="w-full sm:w-48 xl:w-56 bg-white dark:bg-slate-950 rounded-xl border border-border focus-within:ring-2 ring-emerald-500/50 transition-shadow shrink-0">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={openBuilding}
                  disabled={isPending || selectedFarm === "all"}
                  className="w-full justify-between h-11 hover:bg-transparent hover:text-foreground rounded-xl px-4"
                >
                  <div className="flex items-center text-slate-500 dark:text-slate-400 min-w-0">
                    <Home className="w-4 h-4 mr-2 shrink-0" />
                    <span className="font-bold text-foreground uppercase tracking-wider truncate text-xs">
                      {selectedFarm === "all"
                        ? "SELECT FARM FIRST"
                        : selectedBuilding === "all"
                          ? "ALL BUILDINGS"
                          : selectedBuilding}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-xl border-border shadow-xl">
                <Command>
                  <CommandInput placeholder="Search building..." />
                  <CommandList className="max-h-[250px] custom-scrollbar">
                    <CommandEmpty>No building found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("building", "all");
                          setOpenBuilding(false);
                        }}
                        className="font-bold uppercase tracking-wider cursor-pointer py-3 text-xs"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBuilding === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL BUILDINGS
                      </CommandItem>
                      {buildings.map((b: string) => (
                        <CommandItem
                          key={b}
                          value={b}
                          onSelect={() => {
                            updateFilter("building", b);
                            setOpenBuilding(false);
                          }}
                          className="font-bold uppercase tracking-wider cursor-pointer py-3 text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBuilding === b
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />{" "}
                          {b}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* RESET ALL FILTERS BUTTON */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              disabled={isPending}
              className="h-11 px-4 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <div
        className={cn(
          "overflow-x-auto custom-scrollbar min-h-[400px] transition-opacity duration-300 relative",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Location
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-center whitespace-nowrap">
                Mortality
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 text-center whitespace-nowrap">
                Feeds (Sacks)
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 text-center whitespace-nowrap">
                Eggs
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Recorded By
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-muted-foreground font-semibold"
                >
                  No daily records found for this filter.
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr
                  key={record.id}
                  className={cn(
                    "group transition-colors duration-1000",
                    // --- NEW: APPLY HIGHLIGHT CLASS IF THIS IS THE NEW RECORD ---
                    highlightedId === String(record.id)
                      ? "bg-emerald-100/60 dark:bg-emerald-900/40"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-900/20",
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold block text-foreground">
                      {record.buildingName}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {record.farmName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black",
                        record.mortality > 0
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {Number(record.mortality)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-foreground">
                    {Number(record.feeds)}{" "}
                    <span className="text-xs font-semibold text-muted-foreground">
                      sacks
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-foreground">
                    {Number(record.eggs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {record.staffName || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RecordActions record={record} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="h-9 px-4 rounded-xl font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
