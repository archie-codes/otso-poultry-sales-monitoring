"use client";

import { useState } from "react";
import { updateLoad } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  ChevronsUpDown,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// IMPORT THE SMART INPUT COMPONENT
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

const chickBreeds = [
  "Cobb 500 (Broiler)",
  "Ross 308 (Broiler)",
  "Arbor Acres (Broiler)",
  "Dekalb White (Layer)",
  "ISA Brown (Layer)",
  "Lohmann (Layer)",
  "Babcock White (Layer)",
  "Babcock Brown (Layer)",
  "Sasso (Colored/Free-Range)",
  "Kabir (Colored/Free-Range)",
  "Philippine Native",
  "Other / Mixed",
];

export default function EditLoadModal({
  load,
  isOpen,
  onClose,
  onSuccess,
}: {
  load: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // COMBBOX STATE
  const [openChickType, setOpenChickType] = useState(false);
  const [chickType, setChickType] = useState(load.chickType || "");

  // CALENDAR STATE
  const [loadDate, setLoadDate] = useState<Date | undefined>(
    load.loadDate ? new Date(load.loadDate) : undefined,
  );
  const [openLoadDate, setOpenLoadDate] = useState(false);

  const [harvestDate, setHarvestDate] = useState<Date | undefined>(
    load.harvestDate ? new Date(load.harvestDate) : undefined,
  );
  const [openHarvestDate, setOpenHarvestDate] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loadDate) {
      toast.error("Validation Error", {
        description: "Load Date is required.",
      });
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (loadDate > today) {
      toast.error("Invalid Timeline", {
        description: "You cannot set a Load Date in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    if (harvestDate && harvestDate <= loadDate) {
      toast.error("Invalid Timeline", {
        description: "The estimated harvest date must be AFTER the load date.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("id", load.id);
    formData.set("chickType", chickType);

    // Force uppercase before saving
    const batchName = formData.get("name") as string;
    if (batchName) formData.set("name", batchName.toUpperCase().trim());

    const customerName = formData.get("customerName") as string;
    if (customerName)
      formData.set("customerName", customerName.toUpperCase().trim());

    // Clean number inputs
    const rawPaidQuantity = formData.get("paidQuantity") as string;
    if (rawPaidQuantity)
      formData.set("paidQuantity", rawPaidQuantity.replace(/,/g, ""));

    const rawAllowanceQuantity = formData.get("allowanceQuantity") as string;
    if (rawAllowanceQuantity)
      formData.set("allowanceQuantity", rawAllowanceQuantity.replace(/,/g, ""));

    const rawSellingPrice = formData.get("sellingPrice") as string;
    if (rawSellingPrice)
      formData.set("sellingPrice", rawSellingPrice.replace(/,/g, ""));

    const rawCapital = formData.get("initialCapital") as string;
    if (rawCapital)
      formData.set("initialCapital", rawCapital.replace(/,/g, ""));

    formData.set("loadDate", format(loadDate, "yyyy-MM-dd"));
    if (harvestDate) {
      formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));
    }

    const result = await updateLoad(formData);

    if (result?.error) {
      toast.error("Update Failed", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Success!", {
        description: "Load details successfully updated.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      onClose();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] p-6 sm:p-8 rounded-3xl overflow-visible border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            Edit Load Details
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* 1. DATE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Load Date *
              </label>
              <Popover open={openLoadDate} onOpenChange={setOpenLoadDate}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 rounded-xl justify-between border-input font-normal px-4",
                      !loadDate && "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                      {loadDate ? format(loadDate, "MMM d, yyyy") : "Pick date"}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-200">
                  <Calendar
                    mode="single"
                    selected={loadDate}
                    defaultMonth={loadDate || new Date()}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                    onSelect={(date) => {
                      setLoadDate(date);
                      setOpenLoadDate(false);
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Est Harvest{" "}
                <span className="text-red-500 lowercase tracking-normal text-[10px] ml-1 opacity-80">
                  (4 Months Estimated)
                </span>
              </label>
              <Popover open={openHarvestDate} onOpenChange={setOpenHarvestDate}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 rounded-xl justify-between border-input font-normal px-4",
                      !harvestDate && "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                      {harvestDate
                        ? format(harvestDate, "MMM d, yyyy")
                        : "Pick date"}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-200">
                  <Calendar
                    mode="single"
                    selected={harvestDate}
                    defaultMonth={harvestDate || new Date()}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 5}
                    onSelect={(date) => {
                      setHarvestDate(date);
                      setOpenHarvestDate(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 2. BATCH / BREED / CUSTOMER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Batch Name
              </label>
              <Input
                name="name"
                type="text"
                defaultValue={load.name || ""}
                placeholder="e.g. Loading 1"
                className="rounded-xl h-12 font-bold uppercase"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Chick Type
              </label>
              <Popover open={openChickType} onOpenChange={setOpenChickType}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-12 justify-between rounded-xl font-normal border-input overflow-hidden px-4"
                  >
                    <span className="truncate">
                      {chickType || "Select breed..."}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-200">
                  <Command>
                    <CommandInput
                      placeholder="Search breed..."
                      className="h-11"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>No breed found.</CommandEmpty>
                      <CommandGroup>
                        {chickBreeds.map((breed) => (
                          <CommandItem
                            key={breed}
                            value={breed}
                            onSelect={(v) => {
                              const selectedBreed =
                                chickBreeds.find(
                                  (b) => b.toLowerCase() === v.toLowerCase(),
                                ) || v;
                              setChickType(selectedBreed);
                              setOpenChickType(false);
                            }}
                            className="py-2.5"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                chickType === breed
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {breed}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Customer / Source
              </label>
              <Input
                name="customerName"
                type="text"
                defaultValue={load.customerName || load.customer || ""}
                placeholder="e.g. Magnolia"
                className="rounded-xl h-12 uppercase"
              />
            </div>
          </div>

          {/* 3. NUMBER GRID (Now 4 Columns to fit Paid/Allowance) */}
          <div className="grid md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Paid Qty *
              </label>
              <FormattedNumberInput
                name="paidQuantity"
                required
                // Safely fallback to actualQuantityLoad for older records
                defaultValue={
                  load.paidQuantity ?? load.actualQuantityLoad ?? ""
                }
                placeholder="10,000"
                className="h-11 rounded-xl bg-background font-bold text-lg border-blue-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
                Allowance (Free)
              </label>
              <FormattedNumberInput
                name="allowanceQuantity"
                defaultValue={load.allowanceQuantity ?? "0"}
                placeholder="600"
                className="h-11 rounded-xl bg-background font-bold text-lg border-amber-200 focus-visible:ring-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                Total Capital (₱)
              </label>
              <FormattedNumberInput
                name="initialCapital"
                allowDecimals={true}
                defaultValue={load.initialCapital}
                placeholder="1,500,000.00"
                className="h-11 rounded-xl bg-background font-bold border-emerald-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Target Selling
              </label>
              <FormattedNumberInput
                name="sellingPrice"
                allowDecimals={true}
                defaultValue={load.sellingPrice?.toString() || ""}
                placeholder="210.00"
                className="h-11 rounded-xl bg-background font-bold"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-6 mt-2 border-t border-border/50 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 px-6 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
