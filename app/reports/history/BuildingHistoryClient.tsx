"use client";

import { useState } from "react";
import {
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import HistoricalBatchCard from "./HistoricalBatchCard";
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
import { cn } from "@/lib/utils";

export default function BuildingHistoryClient({
  buildingName,
  pastBatches,
}: {
  buildingName: string;
  pastBatches: any[];
}) {
  // Pagination & Filtering States
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [openBatch, setOpenBatch] = useState(false);

  const itemsPerPage = 3; // Strictly limit to 3 cards per page so it's not overwhelming!

  // 1. Filter the batches based on the Dropdown selection
  const filteredBatches =
    selectedBatch === "all"
      ? pastBatches
      : pastBatches.filter((b) => String(b.id) === selectedBatch);

  // 2. Calculate pagination on the filtered results
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginatedBatches = filteredBatches.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-border/50 rounded-[2.5rem] p-5 sm:p-8 shadow-sm">
      {/* Building Header & Batch Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Warehouse className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700 dark:text-slate-300" />
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            {buildingName}
          </h3>
        </div>

        {/* Right Side: Combobox + Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* SMART BATCH SEARCH DROPDOWN */}
          <Popover open={openBatch} onOpenChange={setOpenBatch}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openBatch}
                className="w-full md:w-[240px] justify-between h-10 rounded-xl font-bold bg-white dark:bg-slate-950 border-border/50 shadow-sm text-[11px] uppercase tracking-widest"
              >
                <span className="truncate">
                  {selectedBatch === "all"
                    ? "All Past Batches"
                    : pastBatches.find((b) => String(b.id) === selectedBatch)
                        ?.name || `Load ${selectedBatch}`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[240px] p-0 rounded-xl border-border/50 shadow-xl"
              align="end"
            >
              <Command>
                <CommandInput
                  placeholder="Search batch..."
                  className="h-9 text-xs"
                />
                <CommandList>
                  <CommandEmpty>No batch found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto custom-scrollbar">
                    <CommandItem
                      onSelect={() => {
                        setSelectedBatch("all");
                        setPage(1);
                        setOpenBatch(false);
                      }}
                      className="font-bold cursor-pointer text-xs uppercase tracking-wider py-2.5"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-emerald-600",
                          selectedBatch === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      All Past Batches
                    </CommandItem>

                    {pastBatches.map((b) => (
                      <CommandItem
                        key={b.id}
                        value={b.name || `Load ${b.id}`}
                        onSelect={() => {
                          setSelectedBatch(String(b.id));
                          setPage(1);
                          setOpenBatch(false);
                        }}
                        className="font-bold cursor-pointer text-xs uppercase tracking-wider py-2.5"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-emerald-600",
                            selectedBatch === String(b.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {b.name || `Load ${b.id}`}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <span className="bg-white dark:bg-slate-950 border border-border/50 text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] font-black px-3 py-2 rounded-xl uppercase tracking-widest shadow-sm shrink-0">
            {pastBatches.length} Load{pastBatches.length !== 1 && "s"}
          </span>
        </div>
      </div>

      {/* The Stacked Cards (Paginated & Filtered!) */}
      <div className="grid grid-cols-1 gap-6">
        {paginatedBatches.length === 0 ? (
          <p className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest py-10">
            No batches match this filter.
          </p>
        ) : (
          paginatedBatches.map((batch) => (
            <HistoricalBatchCard key={batch.id} batch={batch} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 rounded-xl px-4 font-bold text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 rounded-xl px-4 font-bold text-xs"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
