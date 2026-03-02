"use client";

import { useState } from "react";
import { updateLoad } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar"; // Make sure you have this installed!
import { Separator } from "@/components/ui/separator";
import {
  Edit2,
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
  onSuccess,
}: {
  load: any;
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // COMBBOX STATE
  const [openChickType, setOpenChickType] = useState(false);
  const [chickType, setChickType] = useState(load.chickType || "");

  // CALENDAR STATE (Initialize with existing database dates)
  const [loadDate, setLoadDate] = useState<Date | undefined>(
    load.loadDate ? new Date(load.loadDate) : undefined,
  );
  const [harvestDate, setHarvestDate] = useState<Date | undefined>(
    load.harvestDate ? new Date(load.harvestDate) : undefined,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loadDate) {
      toast.error("Validation Error", {
        description: "Load Date is required.",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("id", load.id);
    formData.append("chickType", chickType);

    // Convert Dates back to strings for the database action
    formData.append("loadDate", loadDate.toISOString().split("T")[0]);
    if (harvestDate) {
      formData.append("harvestDate", harvestDate.toISOString().split("T")[0]);
    }

    const result = await updateLoad(formData);

    if (result?.error) {
      toast.error("Update Failed", { description: result.error });
    } else {
      toast.success("Load details updated successfully!"); // FIXED: Terminology updated
      setIsOpen(false);
      if (onSuccess) onSuccess(); // FIXED: Triggers the glowing card effect!
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs rounded-lg"
          >
            <p>Edit load details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[600px] p-6 sm:p-8 rounded-3xl overflow-visible border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            Edit Load Details
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* DATE GRID (Using Custom Popover Calendars) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Load Date *
              </label>
              <Popover>
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
                    onSelect={setLoadDate}
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
              <Popover>
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
                    onSelect={setHarvestDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* QUANTITY AND BREED GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Chick Quantity
              </label>
              <Input
                name="quantity"
                type="number"
                required
                defaultValue={load.quantity}
                className="rounded-xl h-12 text-lg font-bold"
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
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Capital per Load (₱)
              </label>
              <Input
                name="initialCapital"
                type="number"
                step="0.01"
                defaultValue={load.initialCapital || ""}
                placeholder="Capital per Load"
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Customer / Source
              </label>
              <Input
                name="customerName"
                type="text"
                defaultValue={load.customer || ""}
                placeholder="e.g. Magnolia"
                className="rounded-xl h-12"
              />
            </div>
          </div>

          <div className="pt-6 mt-2 border-t border-border/50 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
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
