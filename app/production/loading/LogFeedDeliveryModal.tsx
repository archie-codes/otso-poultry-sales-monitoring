"use client";

import { useState, useEffect } from "react";
import { logFeedDelivery } from "./actions";
import {
  Loader2,
  ShoppingCart,
  Plus,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Info,
  Package,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

export default function LogFeedDeliveryModal({
  activeLoads,
}: {
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cascading Selection States
  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [openLoadSearch, setOpenLoadSearch] = useState(false);

  const [selectedFeedType, setSelectedFeedType] = useState("");
  const [openFeedType, setOpenFeedType] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get unique farms from active loads
  const uniqueFarms = Array.from(new Set(activeLoads.map((l) => l.farmName)));

  // Filter loads based on selected farm
  const filteredLoads = selectedFarm
    ? activeLoads.filter((l) => l.farmName === selectedFarm)
    : [];

  const selectedLoad = activeLoads.find((l) => String(l.id) === selectedLoadId);

  // Reset form
  useEffect(() => {
    if (!isOpen) {
      setSelectedFarm("");
      setSelectedLoadId("");
      setSelectedFeedType("");
      setDeliveryDate(new Date());
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("loadId", selectedLoadId);
    formData.set("feedType", selectedFeedType);
    if (deliveryDate)
      formData.set("transactionDate", format(deliveryDate, "yyyy-MM-dd"));

    const qty = formData.get("quantity") as string;
    if (qty) formData.set("quantity", qty.replace(/,/g, ""));
    const cost = formData.get("costPerBag") as string;
    if (cost) formData.set("costPerBag", cost.replace(/,/g, ""));

    const result = await logFeedDelivery(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Feed delivery logged successfully!");
      setIsOpen(false);
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Log Feed Delivery
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl">
        <div className="bg-indigo-600 p-6 text-white">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> Feed Delivery
          </DialogTitle>
          <p className="text-indigo-100 font-medium text-sm mt-1 uppercase tracking-widest">
            Inventory & Expense Tracking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
          {/* STEP 1: SELECT FARM */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              1. Select Farm *
            </label>
            <Popover open={openFarmSearch} onOpenChange={setOpenFarmSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between rounded-xl bg-secondary/30 px-4 font-bold"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span>{selectedFarm || "Choose Farm..."}</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                <Command>
                  <CommandInput placeholder="Search farm..." />
                  <CommandList>
                    <CommandEmpty>No farms found.</CommandEmpty>
                    <CommandGroup>
                      {uniqueFarms.map((farm) => (
                        <CommandItem
                          key={farm}
                          onSelect={() => {
                            setSelectedFarm(farm);
                            setSelectedLoadId(""); // Reset building
                            setOpenFarmSearch(false);
                          }}
                        >
                          <span className="font-bold">{farm}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedFarm === farm
                                ? "opacity-100"
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

          {/* STEP 2: SELECT BUILDING (CASCADED) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              2. Select Building *
            </label>
            <Popover open={openLoadSearch} onOpenChange={setOpenLoadSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!selectedFarm}
                  className="w-full h-12 justify-between rounded-xl bg-secondary/30 px-4 font-bold disabled:opacity-50"
                >
                  {selectedLoad ? (
                    <span>{selectedLoad.buildingName}</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      {selectedFarm ? "Choose Building..." : "Pick Farm first"}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                <Command>
                  <CommandInput placeholder="Search building..." />
                  <CommandList>
                    <CommandEmpty>No buildings found.</CommandEmpty>
                    <CommandGroup>
                      {filteredLoads.map((load) => (
                        <CommandItem
                          key={load.id}
                          onSelect={() => {
                            setSelectedLoadId(String(load.id));
                            setOpenLoadSearch(false);
                          }}
                        >
                          <span className="font-bold">{load.buildingName}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedLoadId === String(load.id)
                                ? "opacity-100"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Feed Type *
              </label>
              <Popover open={openFeedType} onOpenChange={setOpenFeedType}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between rounded-xl bg-secondary/30 px-4 font-bold"
                  >
                    {selectedFeedType || "Type"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {feedTypes.map((type) => (
                          <CommandItem
                            key={type}
                            onSelect={() => {
                              setSelectedFeedType(type);
                              setOpenFeedType(false);
                            }}
                          >
                            <Package className="mr-2 h-4 w-4 text-indigo-500" />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Delivery Date *
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between rounded-xl bg-secondary/30 px-3 font-bold"
                  >
                    <div className="flex items-center truncate">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                      {deliveryDate
                        ? format(deliveryDate, "MMM d, yyyy")
                        : "Date"}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-200" align="start">
                  <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={(date) => {
                      setDeliveryDate(date);
                      setIsCalendarOpen(false);
                    }} // Auto-closes!
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                Quantity (Sacks) *
              </label>
              <FormattedNumberInput
                name="quantity"
                required
                placeholder="500"
                className="h-11 rounded-xl bg-background font-black text-lg border-indigo-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                Price per Sack *
              </label>
              <FormattedNumberInput
                name="costPerBag"
                required
                allowDecimals={true}
                placeholder="1,550.00"
                className="h-11 rounded-xl bg-background font-black text-lg border-indigo-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Supplier
              </label>
              <Input
                name="supplierName"
                placeholder="B-Meg"
                className="h-11 rounded-xl bg-secondary/30 border-input font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Invoice / Reference #
              </label>
              <Input
                name="referenceNumber"
                placeholder="INV-001"
                className="h-11 rounded-xl bg-secondary/30 border-input font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Remarks
            </label>
            <Textarea
              name="remarks"
              placeholder="Notes..."
              rows={2}
              className="rounded-xl resize-none bg-secondary/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedLoadId}
              className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Delivery"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
