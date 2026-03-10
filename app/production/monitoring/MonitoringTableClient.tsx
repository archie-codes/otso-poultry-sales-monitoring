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
  Package,
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
  userRole,
}: {
  history: any[];
  farms: string[];
  buildings: string[];
  totalPages: number;
  currentPage: number;
  userRole: string;
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

  const newIdFromUrl = searchParams.get("newId");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (newIdFromUrl) {
      setHighlightedId(newIdFromUrl);

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
    <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col relative">
      {/* FILTER HEADER */}
      <div className="px-6 py-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-foreground text-lg shrink-0 uppercase tracking-tight">
            Activity Logs
          </h2>
          {isPending && (
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* DATE FILTER */}
          <div className="w-full sm:w-auto bg-white dark:bg-slate-950 rounded-xl border border-border flex items-center pr-1 shrink-0">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  className={cn(
                    "w-full sm:w-[160px] justify-between h-11 px-4 text-left font-bold uppercase tracking-wider text-[10px]",
                    !selectedDate && "text-slate-500 dark:text-slate-400",
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <CalendarIcon className="w-4 h-4 mr-2 shrink-0 opacity-50" />
                    <span className="truncate">
                      {selectedDate
                        ? format(selectedDate, "MMM d, yyyy")
                        : "Date"}
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
          </div>

          {/* FARM FILTER */}
          <div className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-11 px-4 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Warehouse className="w-4 h-4 mr-2 opacity-50" />
                  <span className="truncate">
                    {selectedFarm === "all" ? "All Farms" : selectedFarm}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0 shadow-xl">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList>
                    <CommandEmpty>No farm found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("farm", "all");
                          setOpenFarm(false);
                        }}
                      >
                        ALL FARMS
                      </CommandItem>
                      {farms.map((f) => (
                        <CommandItem
                          key={f}
                          onSelect={() => {
                            updateFilter("farm", f);
                            setOpenFarm(false);
                          }}
                        >
                          {f}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* BUILDING FILTER (Cascaded) */}
          <div className="w-full sm:w-48 bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all"}
                  className="w-full justify-between h-11 px-4 text-[10px] font-bold uppercase tracking-wider disabled:opacity-30"
                >
                  <Home className="w-4 h-4 mr-2 opacity-50" />
                  <span className="truncate">
                    {selectedBuilding === "all"
                      ? "All Buildings"
                      : selectedBuilding}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0 shadow-xl">
                <Command>
                  <CommandInput placeholder="Search building..." />
                  <CommandList>
                    <CommandEmpty>No building found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("building", "all");
                          setOpenBuilding(false);
                        }}
                      >
                        ALL BUILDINGS
                      </CommandItem>
                      {buildings.map((b) => (
                        <CommandItem
                          key={b}
                          onSelect={() => {
                            updateFilter("building", b);
                            setOpenBuilding(false);
                          }}
                        >
                          {b}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-11 px-4 text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div
        className={cn(
          "overflow-x-auto min-h-[400px] transition-opacity duration-300",
          isPending && "opacity-50",
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
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600 text-center whitespace-nowrap">
                Feeds
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Recorded By
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8" />
                    No daily records found
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr
                  key={record.id}
                  className={cn(
                    "group transition-all duration-700",
                    highlightedId === String(record.id)
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "hover:bg-slate-50/50",
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-black block text-xs uppercase">
                      {record.buildingName}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {record.farmName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black",
                        record.mortality > 0
                          ? "bg-red-50 text-red-600"
                          : "text-slate-400",
                      )}
                    >
                      {record.mortality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {record.feeds}{" "}
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Bags
                        </span>
                      </div>
                      {/* FEED TYPE BADGE */}
                      {record.feedType && (
                        <span
                          className={cn(
                            "mt-1 px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider",
                            record.feedType === "BOOSTER"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : record.feedType === "STARTER"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : record.feedType === "GROWER"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-slate-50 text-slate-500 border-slate-100",
                          )}
                        >
                          {record.feedType}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {record.staffName || "System"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RecordActions record={record} userRole={userRole} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Page {currentPage} of {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
