"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addLoad } from "./actions";
import {
  X,
  Loader2,
  Save,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  MapPin, // Added for the Farm icon
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// SHADCN UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Image from "next/image";
import henIcon from "@/public/hen.png";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

const HenIcon = ({ className }: { className?: string }) => (
  <span className={`relative block shrink-0 ${className ?? ""}`}>
    <Image
      src={henIcon}
      alt="Hen"
      fill
      sizes="64px"
      className="object-contain brightness-0 invert"
    />
  </span>
);

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

export default function AddLoadModal({
  availableBuildings,
}: {
  availableBuildings: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // --- NEW: CASCADING SELECTION STATES ---
  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [buildingId, setBuildingId] = useState("");
  const [openBuildingSearch, setOpenBuildingSearch] = useState(false);

  const [chickType, setChickType] = useState("");
  const [openChickType, setOpenChickType] = useState(false);

  const [loadDate, setLoadDate] = useState<Date | undefined>(new Date());
  const [harvestDate, setHarvestDate] = useState<Date | undefined>(
    addMonths(new Date(), 4),
  );

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // --- NEW: SMART FILTERING LOGIC ---
  // 1. Extract a unique list of Farms from the available buildings
  const uniqueFarms = Array.from(
    new Set(availableBuildings.map((b) => b.farmName)),
  );

  // 2. Filter the buildings based on the selected farm
  const filteredBuildings = selectedFarm
    ? availableBuildings.filter((b) => b.farmName === selectedFarm)
    : [];

  const selectedBuilding = availableBuildings.find(
    (b) => String(b.id) === buildingId,
  );

  function handleLoadDateChange(date: Date | undefined) {
    setLoadDate(date);
    if (date) setHarvestDate(addMonths(date, 4));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!buildingId) {
      toast.error("Missing Field", {
        description: "Please select a building first.",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Inject our state variables into the form data
    formData.set("buildingId", buildingId);
    formData.set("chickType", chickType);
    if (loadDate) formData.set("loadDate", format(loadDate, "yyyy-MM-dd"));
    if (harvestDate)
      formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));

    // --- NEW: SAFELY STRIP COMMAS BEFORE SENDING TO DB ---
    const qty = formData.get("actualQuantityLoad") as string;
    if (qty) formData.set("actualQuantityLoad", qty.replace(/,/g, ""));

    const sp = formData.get("sellingPrice") as string;
    if (sp) formData.set("sellingPrice", sp.replace(/,/g, ""));

    const cap = formData.get("initialCapital") as string;
    if (cap) formData.set("initialCapital", cap.replace(/,/g, ""));
    // -----------------------------------------------------

    const result = await addLoad(formData);

    if (result.error) {
      toast.error("Error", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Success!", {
        description: "Load details saved and building activated.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });

      setIsOpen(false);
      setSelectedFarm("");
      setBuildingId("");
      setChickType("");

      if (result.id) {
        router.push(`/production/loading?newId=${result.id}`);
        setTimeout(() => {
          router.replace("/production/loading", { scroll: false });
        }, 4000);
      }
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl font-bold shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
      >
        <HenIcon className="h-6 w-6 mr-2" />
        <span className="truncate">Load New Chicks</span>
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-2xl border bg-background p-6 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black text-blue-600">
                    New Load Entry
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select a Farm, choose an available Building, and set batch
                    details.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- TWO-STEP CASCADING DROPDOWNS --- */}
                <div className="grid md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  {/* STEP 1: SELECT FARM */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      1. Select Farm *
                    </label>
                    <Popover
                      open={openFarmSearch}
                      onOpenChange={setOpenFarmSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                            <span className="truncate font-bold text-sm">
                              {selectedFarm || "Choose a Farm..."}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search farm..." />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>No farms available.</CommandEmpty>
                            <CommandGroup>
                              {uniqueFarms.map((farm) => (
                                <CommandItem
                                  key={farm}
                                  value={farm}
                                  onSelect={(currentValue) => {
                                    const actualFarm =
                                      uniqueFarms.find(
                                        (f) =>
                                          f.toLowerCase() ===
                                          currentValue.toLowerCase(),
                                      ) || currentValue;

                                    setSelectedFarm(actualFarm);
                                    // Reset building when farm changes
                                    setBuildingId("");
                                    setOpenFarmSearch(false);
                                  }}
                                  className="py-3 px-4"
                                >
                                  <span className="font-bold text-sm">
                                    {farm}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 text-blue-600",
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

                  {/* STEP 2: SELECT BUILDING */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      2. Select Building *
                    </label>
                    <Popover
                      open={openBuildingSearch}
                      onOpenChange={setOpenBuildingSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedFarm} // Disabled until Farm is picked!
                          className="w-full h-12 justify-between rounded-xl bg-background border-input px-4 font-normal disabled:opacity-50"
                        >
                          {selectedBuilding ? (
                            <div className="flex flex-col items-start gap-0.5 overflow-hidden text-left">
                              <span className="font-bold text-sm truncate">
                                {selectedBuilding.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {selectedFarm
                                ? "Choose a Building..."
                                : "Pick a Farm first"}
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search building..." />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>
                              No empty buildings found.
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredBuildings.map((b) => (
                                <CommandItem
                                  key={b.id}
                                  value={b.name}
                                  onSelect={() => {
                                    setBuildingId(String(b.id));
                                    setOpenBuildingSearch(false);
                                  }}
                                  className="py-3 px-4"
                                >
                                  <span className="font-bold text-sm">
                                    {b.name}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 text-blue-600",
                                      buildingId === String(b.id)
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
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Load Date *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl justify-between border-input px-4 font-normal"
                        >
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                            {loadDate
                              ? format(loadDate, "MMM d, yyyy")
                              : "Pick date"}
                          </div>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-200"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={loadDate}
                          onSelect={(date) => {
                            handleLoadDateChange(date);
                            // Auto-close calendar hack if you want it!
                            // document.body.click();
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
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
                          className="w-full h-12 rounded-xl justify-between border-input px-4 font-normal"
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
                      <PopoverContent
                        className="w-auto p-0 z-200"
                        align="start"
                      >
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

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Type of Chick
                    </label>
                    <Popover
                      open={openChickType}
                      onOpenChange={setOpenChickType}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full h-12 justify-between rounded-xl font-normal border-input px-4"
                        >
                          <span className="truncate">
                            {chickType || "Select breed..."}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandInput placeholder="Search breed..." />
                          <CommandList>
                            <CommandEmpty>No breed found.</CommandEmpty>
                            <CommandGroup>
                              {chickBreeds.map((breed) => (
                                <CommandItem
                                  key={breed}
                                  value={breed}
                                  onSelect={(v) => {
                                    const selectedBreed =
                                      chickBreeds.find(
                                        (b) =>
                                          b.toLowerCase() === v.toLowerCase(),
                                      ) || v;
                                    setChickType(selectedBreed);
                                    setOpenChickType(false);
                                  }}
                                  className="py-2.5 px-4"
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Supplier / Source
                    </label>
                    <Input
                      name="customerName"
                      placeholder="e.g. Magnolia"
                      className="h-12 rounded-xl border-input px-4"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                      Quantity *
                    </label>
                    <FormattedNumberInput
                      name="actualQuantityLoad"
                      required
                      placeholder="10,000"
                      className="h-11 rounded-xl bg-background font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Target Selling (₱)
                    </label>
                    <FormattedNumberInput
                      name="sellingPrice"
                      required
                      placeholder="210.00"
                      allowDecimals={true}
                      className="h-11 rounded-xl bg-background font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500">
                      Capital per Load
                    </label>
                    <FormattedNumberInput
                      name="initialCapital"
                      placeholder="1,500,000.00"
                      allowDecimals={true}
                      className="h-11 rounded-xl bg-background font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-2">
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
                    className="h-12 px-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Save &
                        Activate Load
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> Save & Activate Load
                      </>
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
