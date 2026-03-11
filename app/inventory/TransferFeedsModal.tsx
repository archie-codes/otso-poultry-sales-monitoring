"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { transferFeedStock } from "./actions";
import {
  X,
  Loader2,
  Save,
  ArrowRightLeft,
  Package,
  Check,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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

export default function TransferFeedsModal({
  loadsWithStock,
  activeLoads,
}: {
  loadsWithStock: any[];
  activeLoads: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [sourceLoadId, setSourceLoadId] = useState("");
  const [targetLoadId, setTargetLoadId] = useState("");
  const [feedType, setFeedType] = useState("");
  const [transferDate, setTransferDate] = useState<Date | undefined>(
    new Date(),
  );

  const [openSource, setOpenSource] = useState(false);
  const [openTarget, setOpenTarget] = useState(false);
  const [openType, setOpenType] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const selectedSource = loadsWithStock.find(
    (l) => String(l.id) === sourceLoadId,
  );
  const selectedTarget = activeLoads.find((l) => String(l.id) === targetLoadId);

  // Available feed types based on what the source actually has
  const availableFeedTypes = selectedSource
    ? Object.entries(selectedSource.feedStock)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([type]) => type)
    : [];

  const maxStock =
    selectedSource && feedType ? Number(selectedSource.feedStock[feedType]) : 0;

  // ==========================================
  // SMART FILTER & SORTING LOGIC
  // ==========================================
  const sortAndGroupLoads = (loadsArray: any[]) => {
    // 1. Group by Farm
    const grouped = loadsArray.reduce((acc: any, load) => {
      if (!acc[load.farmName]) acc[load.farmName] = [];
      acc[load.farmName].push(load);
      return acc;
    }, {});

    // 2. Sort Farms Alphabetically
    const sortedFarms = Object.keys(grouped).sort();

    // 3. Sort Buildings "Naturally" inside each farm (Building 1, Building 2, Building 10)
    return sortedFarms.map((farmName) => {
      const sortedBuildings = grouped[farmName].sort((a: any, b: any) =>
        a.buildingName.localeCompare(b.buildingName, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
      return { farmName, buildings: sortedBuildings };
    });
  };

  const groupedSource = sortAndGroupLoads(loadsWithStock);
  const groupedTarget = sortAndGroupLoads(
    activeLoads.filter((l) => String(l.id) !== sourceLoadId),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sourceLoadId || !targetLoadId || !feedType || !transferDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const qty = Number(
      (e.currentTarget.elements.namedItem("quantity") as HTMLInputElement)
        .value,
    );
    if (qty <= 0 || qty > maxStock) {
      toast.error(
        `Invalid quantity. You can only transfer up to ${maxStock} sacks.`,
      );
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("sourceLoadId", sourceLoadId);
    formData.set("targetLoadId", targetLoadId);
    formData.set("feedType", feedType);
    formData.set("quantity", String(qty));
    formData.set("transferDate", format(transferDate, "yyyy-MM-dd"));
    formData.set(
      "remarks",
      (e.currentTarget.elements.namedItem("remarks") as HTMLInputElement).value,
    );

    const result = await transferFeedStock(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Feeds Transferred Successfully!");
      setIsOpen(false);
      setSourceLoadId("");
      setTargetLoadId("");
      setFeedType("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="h-11 px-4 rounded-xl font-bold border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all"
      >
        <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Feeds
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="fixed z-101 w-full max-w-lg border bg-background p-6 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-black text-amber-600 flex items-center">
                  <ArrowRightLeft className="mr-2" /> Move Inventory
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* SOURCE POPOVER */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    From (Source)
                  </label>
                  <Popover open={openSource} onOpenChange={setOpenSource}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-between rounded-xl font-bold bg-amber-50/30 px-4"
                      >
                        {selectedSource ? (
                          <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                            <span className="font-bold text-sm truncate">
                              {selectedSource.buildingName}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate">
                              {selectedSource.farmName}
                            </span>
                          </div>
                        ) : (
                          "Select source with stock..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search building..." />
                        <CommandList className="max-h-[300px] custom-scrollbar">
                          <CommandEmpty>
                            No buildings with stock found.
                          </CommandEmpty>

                          {/* Mapped Sorted & Grouped Sources */}
                          {groupedSource.map((group) => (
                            <CommandGroup
                              key={group.farmName}
                              heading={group.farmName}
                              className="text-amber-600 font-black tracking-widest"
                            >
                              {group.buildings.map((l: any) => (
                                <CommandItem
                                  key={`source-${l.id}`}
                                  value={`${l.farmName} ${l.buildingName} ${l.id}`}
                                  onSelect={() => {
                                    setSourceLoadId(String(l.id));
                                    setFeedType("");
                                    setOpenSource(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <div className="flex flex-col items-start gap-0.5 text-foreground flex-1">
                                    <span className="font-bold text-sm">
                                      {l.buildingName}
                                    </span>
                                    {!l.isActive && (
                                      <span className="text-[10px] text-red-500 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded">
                                        Harvested
                                      </span>
                                    )}
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4 shrink-0",
                                      sourceLoadId === String(l.id)
                                        ? "opacity-100 text-amber-600"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* FEED TYPE & QTY */}
                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      Feed Type
                    </label>
                    <Popover open={openType} onOpenChange={setOpenType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!sourceLoadId}
                          className="w-full h-12 justify-between rounded-xl font-bold bg-white px-4 disabled:opacity-50"
                        >
                          {feedType || "Type..."}{" "}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandList>
                            <CommandEmpty>No feeds available.</CommandEmpty>
                            <CommandGroup>
                              {availableFeedTypes.map((type) => {
                                const stock = selectedSource
                                  ? Number(
                                      selectedSource.feedStock?.[type] || 0,
                                    )
                                  : 0;
                                return (
                                  <CommandItem
                                    key={`type-${type}`}
                                    value={type}
                                    onSelect={() => {
                                      setFeedType(type);
                                      setOpenType(false);
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
                                            ? "opacity-100 text-amber-600"
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      Qty (Max: {maxStock})
                    </label>
                    <Input
                      type="number"
                      name="quantity"
                      min="1"
                      max={maxStock}
                      disabled={!feedType}
                      className="h-12 rounded-xl font-bold px-4 disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* TARGET POPOVER */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    To (Destination)
                  </label>
                  <Popover open={openTarget} onOpenChange={setOpenTarget}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-12 justify-between rounded-xl font-bold bg-emerald-50/30 px-4"
                      >
                        {selectedTarget ? (
                          <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                            <span className="font-bold text-sm truncate">
                              {selectedTarget.buildingName}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate">
                              {selectedTarget.farmName}
                            </span>
                          </div>
                        ) : (
                          "Select active building..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search building..." />
                        <CommandList className="max-h-[300px] custom-scrollbar">
                          <CommandEmpty>
                            No active buildings found.
                          </CommandEmpty>

                          {/* Mapped Sorted & Grouped Targets */}
                          {groupedTarget.map((group) => (
                            <CommandGroup
                              key={group.farmName}
                              heading={group.farmName}
                              className="text-emerald-600 font-black tracking-widest"
                            >
                              {group.buildings.map((l: any) => (
                                <CommandItem
                                  key={`target-${l.id}`}
                                  value={`${l.farmName} ${l.buildingName} ${l.id}`}
                                  onSelect={() => {
                                    setTargetLoadId(String(l.id));
                                    setOpenTarget(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
                                >
                                  <span className="font-bold text-foreground text-sm flex-1">
                                    {l.buildingName}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4 shrink-0",
                                      targetLoadId === String(l.id)
                                        ? "opacity-100 text-emerald-600"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* DATE & REMARKS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Date
                    </label>
                    <Input
                      type="date"
                      name="transferDate"
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                      className="h-12 rounded-xl font-bold px-4 border-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Remarks
                    </label>
                    <Input
                      type="text"
                      name="remarks"
                      placeholder="Optional notes"
                      className="h-12 rounded-xl px-4 border-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
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
                    className="h-12 px-8 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Transfer Sacks"
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
