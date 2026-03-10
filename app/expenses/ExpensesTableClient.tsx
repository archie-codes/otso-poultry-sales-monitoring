"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Users,
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Building2,
  Home, // <-- Added Home icon for building
  PieChart,
  ChevronDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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

const categories = [
  { label: "Labor / Salary", value: "labor" },
  { label: "Feeds", value: "feeds" },
  { label: "Medicine / Vaccines", value: "medicine" },
  { label: "Electricity", value: "electricity" },
  { label: "Water", value: "water" },
  { label: "Fuel", value: "fuel" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Miscellaneous", value: "miscellaneous" },
];

export default function ExpensesTableClient({
  history,
  farms,
  buildings, // <-- ADDED BUILDINGS PROP
  totalPages,
  currentPage,
}: {
  history: any[];
  farms: string[];
  buildings: string[]; // <-- ADDED BUILDINGS TYPE
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openFarm, setOpenFarm] = useState(false);
  const [openBuilding, setOpenBuilding] = useState(false); // <-- ADDED
  const [openCat, setOpenCat] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  const selectedFarm = searchParams.get("farm") || "all";
  const selectedBuilding = searchParams.get("building") || "all"; // <-- ADDED
  const selectedType = searchParams.get("type") || "all";
  const selectedMonthParam = searchParams.get("month");

  const dateValue = selectedMonthParam
    ? parseISO(`${selectedMonthParam}-01`)
    : undefined;

  const hasActiveFilters =
    selectedFarm !== "all" ||
    selectedBuilding !== "all" ||
    selectedType !== "all" ||
    !!selectedMonthParam;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
      if (key === "farm") params.delete("building"); // Reset building if farm changes
    } else {
      params.set(key, value);
      if (key === "farm") params.delete("building"); // Reset building if farm changes
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
    <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm flex flex-col relative">
      {/* 1. PREMIUM FILTER BAR */}
      <div className="px-6 py-5 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="font-bold text-foreground text-lg uppercase tracking-tight">
            Transaction History
          </h2>
          {isPending && (
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
          {/* 📅 MONTH PICKER */}
          <div className="w-full sm:w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 focus-within:ring-2 ring-red-500/20 transition-all flex items-center pr-1">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between h-11 px-4 font-bold uppercase tracking-wider text-[10px]",
                    !selectedMonthParam && "text-slate-400",
                  )}
                >
                  <div className="flex items-center truncate">
                    <CalendarIcon className="w-3.5 h-3.5 mr-2 shrink-0" />
                    {dateValue ? format(dateValue, "MMM yyyy") : "DATE"}
                  </div>
                  <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl shadow-xl border-border"
                align="end"
              >
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    if (date) {
                      updateFilter("month", format(date, "yyyy-MM"));
                      setOpenDate(false);
                    }
                  }}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            {selectedMonthParam && (
              <button
                onClick={() => updateFilter("month", "all")}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* FARM COMBOBOX */}
          <div className="w-full sm:w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 focus-within:ring-2 ring-red-500/20 transition-all">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-11 px-4 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <Building2 className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    {selectedFarm === "all" ? "ALL FARMS" : selectedFarm}
                  </div>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No farm found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("farm", "all");
                          setOpenFarm(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedFarm === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL FARMS
                      </CommandItem>
                      {farms.map((f) => (
                        <CommandItem
                          key={f}
                          onSelect={() => {
                            updateFilter("farm", f);
                            setOpenFarm(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
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

          {/* BUILDING COMBOBOX (NEW) */}
          <div className="w-full sm:w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 focus-within:ring-2 ring-red-500/20 transition-all">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all"}
                  className="w-full justify-between h-11 px-4 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Home className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    {selectedFarm === "all"
                      ? "SELECT FARM"
                      : selectedBuilding === "all"
                        ? "ALL BLDGS"
                        : selectedBuilding}
                  </div>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search building..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No building found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("building", "all");
                          setOpenBuilding(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedBuilding === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL BUILDINGS
                      </CommandItem>
                      {buildings.map((b) => (
                        <CommandItem
                          key={b}
                          onSelect={() => {
                            updateFilter("building", b);
                            setOpenBuilding(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
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

          {/* CATEGORY COMBOBOX */}
          <div className="w-full sm:w-[150px] bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 focus-within:ring-2 ring-red-500/20 transition-all">
            <Popover open={openCat} onOpenChange={setOpenCat}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-11 px-4 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <PieChart className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                    {selectedType === "all" ? "CATEGORIES" : selectedType}
                  </div>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search category..." />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("type", "all");
                          setOpenCat(false);
                        }}
                        className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedType === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL CATEGORIES
                      </CommandItem>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat.value}
                          onSelect={() => {
                            updateFilter("type", cat.value);
                            setOpenCat(false);
                          }}
                          className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedType === cat.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />{" "}
                          {cat.label}
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
              className="h-11 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
            >
              <X className="w-3.5 h-3.5 sm:mr-1.5" />{" "}
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. TABLE */}
      <div
        className={cn(
          "overflow-x-auto custom-scrollbar transition-opacity duration-300 min-h-[400px]",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Target
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-right">
                Amount (₱)
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                Staff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-16 text-center text-muted-foreground font-semibold"
                >
                  No records match your filters.
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-black text-foreground block uppercase text-xs">
                      {record.farmName}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-widest mt-1">
                      {record.buildingName ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          {record.buildingName}
                        </span>
                      ) : (
                        <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                          <Users className="w-3 h-3" /> Shared
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-foreground">
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-red-600 dark:text-red-400 text-right text-base">
                    {Number(record.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-muted-foreground uppercase text-right opacity-40 group-hover:opacity-100 transition-opacity tracking-widest">
                    {record.staffName || "Unknown"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. PAGINATION */}
      <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Page {currentPage} / {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all text-[10px] uppercase tracking-widest"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
