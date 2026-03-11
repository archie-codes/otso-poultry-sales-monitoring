"use client";

import { useTransition, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Filter,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  ArrowRightLeft,
  Activity,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  Warehouse,
  ChevronDown,
  MapPin,
  Home,
  Building2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";

export default function InventoryTableClient({
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
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectedFarm = searchParams.get("farm") || "all";
  const selectedBuilding = searchParams.get("building") || "all"; // Added Building state
  const selectedType = searchParams.get("type") || "all";
  const selectedDateParam = searchParams.get("date");
  const selectedDate =
    selectedDateParam && selectedDateParam !== "all"
      ? parseISO(selectedDateParam)
      : undefined;

  const [openFarm, setOpenFarm] = useState(false);
  const [openBuilding, setOpenBuilding] = useState(false); // Added Building state
  const [openType, setOpenType] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  const typeOptions = [
    { label: "Deliveries", value: "DELIVERY_IN" },
    { label: "Daily Usage", value: "DAILY_CONSUMPTION" },
    { label: "Transfers In", value: "TRANSFER_IN" },
    { label: "Transfers Out", value: "TRANSFER_OUT" },
  ];

  const updateFilter = (
    type: "farm" | "building" | "type" | "date",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(type);
      if (type === "farm") params.delete("building"); // Reset building if farm changes
    } else {
      params.set(type, value);
      if (type === "farm") params.delete("building"); // Reset building if farm changes
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const hasActiveFilters =
    selectedFarm !== "all" ||
    selectedBuilding !== "all" ||
    selectedType !== "all" ||
    !!selectedDate;

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "DELIVERY_IN":
        return (
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit">
            <ArrowDownToLine className="w-3 h-3" /> Delivery
          </span>
        );
      case "TRANSFER_IN":
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit">
            <ArrowRightLeft className="w-3 h-3" /> Transfer In
          </span>
        );
      case "TRANSFER_OUT":
        return (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit">
            <ArrowRightLeft className="w-3 h-3" /> Transfer Out
          </span>
        );
      case "DAILY_CONSUMPTION":
        return (
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 w-fit">
            <Activity className="w-3 h-3" /> Consumed
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit">
            {type}
          </span>
        );
    }
  };

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col relative">
      {/* 1. BULLETPROOF FILTER HEADER */}
      <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* TITLE ALWAYS ON LEFT/TOP */}
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="font-black text-foreground text-lg uppercase tracking-tight">
            Transaction Ledger
          </h2>
          {isPending && (
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          )}
        </div>

        {/* FILTERS CONTAINER (Grid on mobile, flex row on laptop) */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
          {/* EXACT DATE PICKER */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 transition-all w-full md:w-[130px]">
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  className={cn(
                    "w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]",
                    !selectedDate && "text-slate-500 dark:text-slate-400",
                  )}
                >
                  <div className="flex items-center truncate">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-50" />
                    {selectedDate ? format(selectedDate, "MMM d, yy") : "DATE"}
                  </div>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl border-border shadow-xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    updateFilter(
                      "date",
                      date ? format(date, "yyyy-MM-dd") : "all",
                    );
                    setOpenDate(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* FARM COMBOBOX */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 transition-all w-full md:w-[130px]">
            <Popover open={openFarm} onOpenChange={setOpenFarm}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedFarm === "all" ? "FARM" : selectedFarm}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
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
                              ? "opacity-100 text-amber-600"
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
                              selectedFarm === f
                                ? "opacity-100 text-amber-600"
                                : "opacity-0",
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

          {/* BUILDING COMBOBOX */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 transition-all w-full md:w-[130px]">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all"}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50"
                >
                  <div className="flex items-center truncate">
                    <Home className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedFarm === "all"
                        ? "BUILDING"
                        : selectedBuilding === "all"
                          ? "ALL BLDGS"
                          : selectedBuilding}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
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
                              ? "opacity-100 text-amber-600"
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
                                ? "opacity-100 text-amber-600"
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

          {/* TYPE FILTER */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-border shrink-0 transition-all w-full md:w-[130px]">
            <Popover open={openType} onOpenChange={setOpenType}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px]"
                >
                  <div className="flex items-center truncate">
                    <Filter className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedType === "all"
                        ? "ACTION"
                        : typeOptions.find((t) => t.value === selectedType)
                            ?.label}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("type", "all");
                          setOpenType(false);
                        }}
                        className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedType === "all"
                              ? "opacity-100 text-amber-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL ACTIONS
                      </CommandItem>
                      {typeOptions.map((t) => (
                        <CommandItem
                          key={t.value}
                          onSelect={() => {
                            updateFilter("type", t.value);
                            setOpenType(false);
                          }}
                          className="text-[10px] font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedType === t.value
                                ? "opacity-100 text-amber-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {t.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CLEAR FILTERS BUTTON */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="col-span-2 md:col-span-1 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 border border-transparent hover:border-red-100"
            >
              <X className="w-3.5 h-3.5 mr-1.5" /> Reset
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
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Action
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Feed Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap">
                Cost/Sack
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap">
                Qty
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                Remarks/Staff
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8" />
                    No transactions found
                  </div>
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {format(new Date(record.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-black block text-xs uppercase">
                      {record.buildingName}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 block">
                      {record.farmName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTransactionBadge(record.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                    {record.feedType && (
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-black border uppercase tracking-wider",
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-600 text-right">
                    {Number(record.costPerBag) > 0
                      ? formatMoney(Number(record.costPerBag))
                      : "-"}
                  </td>
                  <td
                    className={cn(
                      "px-6 py-4 whitespace-nowrap font-black text-right text-base",
                      Number(record.quantity) > 0
                        ? "text-emerald-600"
                        : "text-red-600",
                    )}
                  >
                    {Number(record.quantity) > 0 ? "+" : ""}
                    {record.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right flex flex-col items-end">
                    <span
                      className="block text-xs font-medium text-slate-600 truncate max-w-[200px]"
                      title={record.remarks || ""}
                    >
                      {record.remarks || "-"}
                    </span>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                      {record.staffName || "System"}
                    </span>
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
