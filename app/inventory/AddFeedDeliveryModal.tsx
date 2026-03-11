"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { logFeedDelivery } from "./actions";
import {
  X,
  Loader2,
  Save,
  ArrowDownToLine,
  Package,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

export default function AddFeedDeliveryModal({
  activeLoads,
}: {
  activeLoads: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [loadId, setLoadId] = useState("");
  const [feedType, setFeedType] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    new Date(),
  );

  const [openLoad, setOpenLoad] = useState(false);
  const [openType, setOpenType] = useState(false);

  const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

  useEffect(() => setMounted(true), []);

  const selectedLoad = activeLoads.find((l) => String(l.id) === loadId);

  // Group active loads by Farm for easier selection
  const groupedLoads = activeLoads.reduce((acc: any, load) => {
    if (!acc[load.farmName]) acc[load.farmName] = [];
    acc[load.farmName].push(load);
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loadId || !feedType || !deliveryDate) {
      toast.error("Please select Building, Feed Type, and Date.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("feedType", feedType);
    formData.set("transactionDate", format(deliveryDate, "yyyy-MM-dd"));

    const result = await logFeedDelivery(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Delivery Logged Successfully!");
      setIsOpen(false);
      setLoadId("");
      setFeedType("");
      setDeliveryDate(new Date());
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
      >
        <ArrowDownToLine className="w-4 h-4 mr-2" /> Log Delivery
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="fixed z-101 w-full max-w-lg border bg-background p-6 shadow-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-black text-emerald-600 flex items-center">
                  <ArrowDownToLine className="mr-2" /> Receive Feeds
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* TARGET BUILDING */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">
                    Deliver To (Building)
                  </label>
                  <Popover open={openLoad} onOpenChange={setOpenLoad}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-11 justify-between rounded-xl font-bold bg-emerald-50/30"
                      >
                        {selectedLoad
                          ? `${selectedLoad.buildingName} (${selectedLoad.farmName})`
                          : "Select active building..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                      <Command>
                        <CommandInput placeholder="Search building..." />
                        <CommandList className="max-h-[300px] custom-scrollbar">
                          <CommandEmpty>
                            No active buildings found.
                          </CommandEmpty>
                          {Object.entries(groupedLoads).map(
                            ([farmName, loads]: [string, any]) => (
                              <CommandGroup
                                key={farmName}
                                heading={farmName}
                                className="text-emerald-600 font-black tracking-widest"
                              >
                                {loads.map((l: any) => (
                                  <CommandItem
                                    key={l.id}
                                    value={`${l.farmName} ${l.buildingName} ${l.id}`}
                                    onSelect={() => {
                                      setLoadId(String(l.id));
                                      setOpenLoad(false);
                                    }}
                                    className="cursor-pointer py-2.5"
                                  >
                                    <span className="font-bold text-foreground text-sm">
                                      {l.buildingName}
                                    </span>
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
                            ),
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* FEED TYPE & DATE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">
                      Feed Type
                    </label>
                    <Popover open={openType} onOpenChange={setOpenType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-11 justify-between rounded-xl font-bold"
                        >
                          {feedType || "Select..."}{" "}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {feedTypes.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
                                    setFeedType(type);
                                    setOpenType(false);
                                  }}
                                  className="font-bold"
                                >
                                  {type}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      feedType === type
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
                    <label className="text-[10px] font-black uppercase text-muted-foreground">
                      Date Received
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 rounded-xl justify-start font-bold",
                            !deliveryDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {deliveryDate
                            ? format(deliveryDate, "MMM d, yyyy")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-200">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={setDeliveryDate}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* FINANCIALS (QTY & COST) */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Total Sacks
                    </label>
                    <Input
                      type="number"
                      name="quantity"
                      min="1"
                      required
                      className="h-11 rounded-xl font-bold border-input"
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Cost Per Bag (₱)
                    </label>
                    <FormattedNumberInput
                      name="costPerBag"
                      required
                      allowDecimals={true}
                      placeholder="1100.00"
                      className="h-11 rounded-xl font-bold bg-white"
                    />
                  </div>
                </div>

                {/* DR & REMARKS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Delivery Receipt No.
                  </label>
                  <Input
                    name="referenceNumber"
                    placeholder="e.g. DR-10293 (Optional)"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">
                    Remarks / Supplier
                  </label>
                  <Input
                    name="remarks"
                    placeholder="e.g. B-MEG Supplies"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Delivery"
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
