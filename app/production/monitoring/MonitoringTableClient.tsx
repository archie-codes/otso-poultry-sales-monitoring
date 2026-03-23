"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Home,
  Check,
  ChevronsUpDown,
  Loader2,
  CalendarIcon,
  ChevronDown,
  X,
  Building2,
  Activity,
  Wheat,
  HeartPulse,
  ListFilter,
  MoreVertical,
  Printer,
  Download,
  Layers,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecordActions from "./RecordActions";

const formatSacks = (val: number | string | null | undefined) => {
  const num = Number(val);
  if (!num || num === 0) return "0";

  const whole = Math.floor(num);
  const frac = num - whole;

  let fracSymbol = "";
  if (Math.abs(frac - 0.25) < 0.01) fracSymbol = "¼";
  else if (Math.abs(frac - 0.5) < 0.01) fracSymbol = "½";
  else if (Math.abs(frac - 0.75) < 0.01) fracSymbol = "¾";
  else if (frac > 0) fracSymbol = frac.toFixed(2).substring(1);

  if (whole > 0 && fracSymbol) return `${whole} ${fracSymbol}`;
  if (whole === 0 && fracSymbol) return fracSymbol;
  return whole.toString();
};

const safeFormatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Unknown Date";
  const d = new Date(dateString);
  return isValid(d) ? format(d, "MMM d, yyyy") : "Invalid Date";
};

const formatMoney = (amount: number) => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function MonitoringTableClient({
  history = [],
  farms = [],
  buildings = [],
  loads = [],
  totalPages = 1,
  currentPage = 1,
  userRole = "staff",
}: {
  history?: any[];
  farms?: string[];
  buildings?: string[];
  loads?: { id: number; name: string }[];
  totalPages?: number;
  currentPage?: number;
  userRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const selectedFarm = searchParams.get("farm") || "all";
  const selectedBuilding = searchParams.get("building") || "all";
  const selectedLoad = searchParams.get("load") || "all";
  const selectedDateParam = searchParams.get("date");

  let selectedDate: Date | undefined = undefined;
  if (selectedDateParam && selectedDateParam !== "all") {
    const parsed = parseISO(selectedDateParam);
    if (isValid(parsed)) selectedDate = parsed;
  }

  const newIdFromUrl = searchParams.get("newId");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (newIdFromUrl) {
      setHighlightedId(newIdFromUrl);
      const timer = setTimeout(() => {
        setHighlightedId(null);
        const params = new URLSearchParams(window.location.search);
        params.delete("newId");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newIdFromUrl, router, pathname]);

  const [openFarm, setOpenFarm] = useState(false);
  const [openBuilding, setOpenBuilding] = useState(false);
  const [openLoad, setOpenLoad] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters =
    selectedFarm !== "all" ||
    selectedBuilding !== "all" ||
    selectedLoad !== "all" ||
    !!selectedDate;

  const updateFilter = (
    type: "farm" | "building" | "load" | "date",
    value: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(type);
      if (type === "farm") {
        params.delete("building");
        params.delete("load");
      }
      if (type === "building") {
        params.delete("load");
      }
    } else {
      params.set(type, value);
      if (type === "farm") {
        params.delete("building");
        params.delete("load");
      }
      if (type === "building") {
        params.delete("load");
      }
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const filteredHistory = (history || []).filter((record) => {
    if (activeTab === "mortality") return Number(record.mortality) > 0;
    if (activeTab === "feeds") return Number(record.feeds) > 0;
    return true;
  });

  const selectedLoadObject = loads.find((l) => String(l.id) === selectedLoad);
  const displayLoadName = selectedLoadObject
    ? selectedLoadObject.name
    : "ALL BATCHES";

  // =========================================================================
  // EXPORT LOGIC
  // =========================================================================
  const downloadCSV = () => {
    let csv =
      "Date,Farm,Building,Batch Name,Mortality AM,Mortality PM,Total Mortality,Feeds AM (Sacks),Feeds PM (Sacks),Total Feeds (Sacks),Feed Type,Recorded By\n";
    filteredHistory.forEach((r) => {
      const cleanDate = format(new Date(r.date), "MM/dd/yyyy");
      const loadStr = r.loadName || `Load ${r.loadId}`;
      csv += `"${cleanDate}","${r.farmName}","${r.buildingName}","${loadStr}",${Number(r.mortalityAm) || 0},${Number(r.mortalityPm) || 0},${Number(r.mortality) || 0},"${formatSacks(r.feedsAm)}","${formatSacks(r.feedsPm)}","${formatSacks(r.feeds)}","${r.feedType || "N/A"}","${r.staffName || "System Admin"}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Otso_Daily_Monitoring_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Otso Poultry Farm", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Daily Monitoring Logs", 14, 26);
    doc.text(`Print Date: ${format(new Date(), "MMMM d, yyyy")}`, 14, 32);

    let filterText = "Filters Applied: ";
    filterText +=
      selectedFarm !== "all" ? `Farm: ${selectedFarm} | ` : "Farm: All | ";
    filterText +=
      selectedBuilding !== "all"
        ? `Building: ${selectedBuilding} | `
        : "Building: All | ";
    filterText +=
      selectedLoad !== "all" ? `Batch: ${displayLoadName} | ` : "Batch: All | ";
    filterText += selectedDate
      ? `Date: ${format(selectedDate, "MMM d, yyyy")}`
      : "Date: All";
    doc.text(filterText, 14, 38);

    const tableColumn = [
      "Date",
      "Location & Batch",
      "Total Mortality",
      "Total Feeds",
      "Feed Type",
      "Recorded By",
    ];
    const tableRows: any[] = [];

    let totalMortalitySum = 0;
    let totalFeedsSum = 0;

    filteredHistory.forEach((r) => {
      totalMortalitySum += Number(r.mortality) || 0;
      totalFeedsSum += Number(r.feeds) || 0;

      const loadStr = r.loadName || `Load ${r.loadId}`;

      tableRows.push([
        format(new Date(r.date), "MMM d, yyyy"),
        `${r.farmName} - ${r.buildingName} (${loadStr})`,
        Number(r.mortality) || 0,
        formatSacks(r.feeds),
        r.feedType || "-",
        r.staffName || "System",
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      foot: [
        [
          "GRAND TOTALS",
          "",
          totalMortalitySum,
          formatSacks(totalFeedsSum),
          "",
          "",
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      styles: { fontSize: 9 },
    });

    doc.save(`Otso_Daily_Monitoring_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
      <div className="px-5 py-4 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4">
        {/* ROW 1: Title, Tabs & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-foreground text-lg uppercase tracking-tight">
              Activity Logs
            </h2>
            {isPending && (
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-1 flex">
                <TabsTrigger
                  value="all"
                  className="flex-1 sm:flex-none rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-4 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5 opacity-70 hidden sm:block" />{" "}
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="mortality"
                  className="flex-1 sm:flex-none rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:shadow-sm px-4 transition-all"
                >
                  <HeartPulse className="w-3.5 h-3.5 mr-1.5 opacity-70 hidden sm:block" />{" "}
                  Mortality
                </TabsTrigger>
                <TabsTrigger
                  value="feeds"
                  className="flex-1 sm:flex-none rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm px-4 transition-all"
                >
                  <Wheat className="w-3.5 h-3.5 mr-1.5 opacity-70 hidden sm:block" />{" "}
                  Feeds
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-secondary shrink-0 border border-border/50 bg-white dark:bg-slate-950 shadow-sm"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
              >
                <DropdownMenuItem
                  onClick={generatePDF}
                  className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={downloadCSV}
                  className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Download Excel (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ROW 2: Dedicated Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 w-full">
          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground mr-2">
            <ListFilter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filters:
            </span>
          </div>

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
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
                              ? "opacity-100 text-emerald-600"
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
                                ? "opacity-100 text-emerald-600"
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openBuilding} onOpenChange={setOpenBuilding}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedFarm === "all" || isPending}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
                >
                  <div className="flex items-center truncate">
                    <Home className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedBuilding === "all"
                        ? "BUILDING"
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
                              ? "opacity-100 text-emerald-600"
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
                                ? "opacity-100 text-emerald-600"
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

          <div className="flex-1 min-w-[110px] max-w-[160px] bg-white dark:bg-slate-950 rounded-xl border border-border transition-all">
            <Popover open={openLoad} onOpenChange={setOpenLoad}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={selectedBuilding === "all" || isPending}
                  className="w-full justify-between h-10 px-3 font-bold uppercase tracking-wider text-[10px] disabled:opacity-30"
                >
                  <div className="flex items-center truncate">
                    <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {selectedLoad === "all" ? "BATCH" : displayLoadName}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-border">
                <Command>
                  <CommandInput placeholder="Search batch..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty className="py-4 text-xs text-center">
                      No batch found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          updateFilter("load", "all");
                          setOpenLoad(false);
                        }}
                        className="text-xs font-bold uppercase cursor-pointer py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5",
                            selectedLoad === "all"
                              ? "opacity-100 text-emerald-600"
                              : "opacity-0",
                          )}
                        />{" "}
                        ALL BATCHES
                      </CommandItem>
                      {loads.map((l) => (
                        <CommandItem
                          key={String(l.id)}
                          onSelect={() => {
                            updateFilter("load", String(l.id));
                            setOpenLoad(false);
                          }}
                          className="text-xs font-bold uppercase cursor-pointer py-2.5"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedLoad === String(l.id)
                                ? "opacity-100 text-emerald-600"
                                : "opacity-0",
                            )}
                          />{" "}
                          {l.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CLEAR FILTERS */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={resetFilters}
              className="h-10 px-4 rounded-xl text-[10px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto lg:ml-0"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* 2. TABLE CONTENT */}
      <div
        className={cn(
          "overflow-x-auto min-h-[400px] transition-opacity duration-300",
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
                Location & Batch
              </th>

              {activeTab !== "feeds" && (
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 text-center whitespace-nowrap">
                  Mortality Ledger
                </th>
              )}
              {activeTab !== "mortality" && (
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600 text-center whitespace-nowrap">
                  Feed Consumption
                </th>
              )}

              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Recorded By
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-20 text-center text-muted-foreground font-black uppercase tracking-widest opacity-20"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8" />
                    No {activeTab !== "all" ? activeTab : "daily"} records found
                  </div>
                </td>
              </tr>
            ) : (
              filteredHistory.map((record) => (
                <tr
                  key={record.id}
                  className={cn(
                    "group transition-all duration-700",
                    highlightedId === String(record.id)
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-900/10",
                  )}
                >
                  {/* SAFE DATE PARSING */}
                  <td className="px-6 text-xs py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                    {safeFormatDate(record.date)}
                  </td>

                  {/* STACKED LOCATION & BATCH NAME - REMOVED LINK */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-0.5 text-left">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {record.farmName}
                      </span>
                      <span className="text-xs font-black uppercase text-foreground">
                        {record.buildingName}
                      </span>
                      {/* THE FIX: Static text instead of <Link> */}
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-0.5 w-fit">
                        {record.loadName || `Load ${record.loadId}`}
                      </span>
                    </div>
                  </td>

                  {/* MORTALITY CELL */}
                  {activeTab !== "feeds" && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {Number(record.mortality) > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-black">
                          <span className="text-muted-foreground">
                            {Number(record.mortalityAm) || 0}{" "}
                            <span className="text-[9px] uppercase tracking-widest opacity-70">
                              am
                            </span>
                          </span>
                          <span className="text-border">|</span>
                          <span className="text-muted-foreground">
                            {Number(record.mortalityPm) || 0}{" "}
                            <span className="text-[9px] uppercase tracking-widest opacity-70">
                              pm
                            </span>
                          </span>
                          <span className="text-border">|</span>
                          <span className="text-red-600 text-sm">
                            {Number(record.mortality)}{" "}
                            <span className="text-[9px] uppercase tracking-widest">
                              total
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-black">
                          -
                        </span>
                      )}
                    </td>
                  )}

                  {/* FEEDS CELL WITH COMPUTED PRICE */}
                  {activeTab !== "mortality" && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {Number(record.feeds) > 0 ? (
                        <div className="flex flex-col items-center">
                          {/* Top Row: AM | PM | Total Sacks */}
                          <div className="flex items-center justify-center gap-2 text-xs font-black">
                            <span className="text-muted-foreground">
                              {formatSacks(record.feedsAm)}{" "}
                              <span className="text-[9px] uppercase tracking-widest opacity-70">
                                am
                              </span>
                            </span>
                            <span className="text-border">|</span>
                            <span className="text-muted-foreground">
                              {formatSacks(record.feedsPm)}{" "}
                              <span className="text-[9px] uppercase tracking-widest opacity-70">
                                pm
                              </span>
                            </span>
                            <span className="text-border">|</span>
                            <span className="text-slate-900 dark:text-slate-100 text-sm">
                              {formatSacks(record.feeds)}{" "}
                              <span className="text-[9px] uppercase tracking-widest opacity-70">
                                total
                              </span>
                            </span>
                          </div>

                          {/* Bottom Row: Feed Pill + Computed Price */}
                          <div className="flex flex-col items-center gap-1 mt-1.5">
                            {record.feedType && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider",
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

                            {Number(record.unitPrice) > 0 && (
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-md mt-0.5 shadow-sm">
                                Cost: ₱
                                {formatMoney(
                                  Number(record.feeds) *
                                    Number(record.unitPrice),
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-black">
                          -
                        </span>
                      )}
                    </td>
                  )}

                  {/* RECORDED BY */}
                  <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {record.staffName || "System"}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <RecordActions record={record} userRole={userRole} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. PAGINATION FOOTER */}
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
            className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
