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
  MapPin,
  Wallet,
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

  // --- CASCADING SELECTION STATES ---
  const [selectedFarm, setSelectedFarm] = useState("");
  const [openFarmSearch, setOpenFarmSearch] = useState(false);

  const [buildingId, setBuildingId] = useState("");
  const [openBuildingSearch, setOpenBuildingSearch] = useState(false);

  const [chickType, setChickType] = useState("");
  const [openChickType, setOpenChickType] = useState(false);

  // ---> NEW: CALENDAR AUTO-CLOSE STATES <---
  const [loadDate, setLoadDate] = useState<Date | undefined>(new Date());
  const [openLoadDate, setOpenLoadDate] = useState(false);

  const [harvestDate, setHarvestDate] = useState<Date | undefined>(
    addMonths(new Date(), 4),
  );
  const [openHarvestDate, setOpenHarvestDate] = useState(false);

  // --- REAL-TIME MATH STATES ---
  const [quantityInput, setQuantityInput] = useState("");
  const [pricePerChickInput, setPricePerChickInput] = useState("");

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const uniqueFarms = Array.from(
    new Set(availableBuildings.map((b) => b.farmName)),
  );

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

  // --- THE MATH ENGINE ---
  const cleanQuantity = Number(quantityInput.replace(/,/g, "")) || 0;
  const cleanPricePerChick = Number(pricePerChickInput.replace(/,/g, "")) || 0;
  const computedTotalCapital = cleanQuantity * cleanPricePerChick;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const batchName = formData.get("name") as string;

    if (!selectedFarm) {
      toast.error("Missing Field", {
        description: "Please select a farm first.",
      });
      return;
    }

    if (!buildingId) {
      toast.error("Missing Field", {
        description: "Please select a building first.",
      });
      return;
    }

    if (!batchName || batchName.trim() === "") {
      toast.error("Missing Field", {
        description: "Please enter a Batch / Load Name.",
      });
      return;
    }

    if (!chickType) {
      toast.error("Missing Field", {
        description: "Please select the Type of Chick.",
      });
      return;
    }

    // ---> LOAD DATE SAFETY LOCKS <---
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow any time today

    if (loadDate && loadDate > today) {
      toast.error("Invalid Timeline", {
        description: "You cannot set a Load Date in the future.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }

    if (loadDate && harvestDate && harvestDate <= loadDate) {
      toast.error("Invalid Timeline", {
        description: "The estimated harvest date must be AFTER the load date.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
      return;
    }
    // --------------------------------------

    setLoading(true);

    formData.set("buildingId", buildingId);
    formData.set("chickType", chickType);
    if (loadDate) formData.set("loadDate", format(loadDate, "yyyy-MM-dd"));
    if (harvestDate)
      formData.set("harvestDate", format(harvestDate, "yyyy-MM-dd"));

    if (quantityInput)
      formData.set("actualQuantityLoad", String(cleanQuantity));

    const sp = formData.get("sellingPrice") as string;
    if (sp) formData.set("sellingPrice", sp.replace(/,/g, ""));

    // Set the automatically computed initial capital
    formData.set("initialCapital", String(computedTotalCapital));

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
      setQuantityInput("");
      setPricePerChickInput("");

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
            <div className="fixed z-101 w-full max-w-3xl border bg-background p-6 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      1. Select Farm <span className="text-red-500">*</span>
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
                                    setBuildingId("");
                                    setOpenFarmSearch(false);
                                  }}
                                  className="py-3 px-4 cursor-pointer"
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

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      2. Select Building <span className="text-red-500">*</span>
                    </label>
                    <Popover
                      open={openBuildingSearch}
                      onOpenChange={setOpenBuildingSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedFarm}
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
                                  className="py-3 px-4 cursor-pointer"
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
                      Load Date <span className="text-red-500">*</span>
                    </label>
                    <Popover open={openLoadDate} onOpenChange={setOpenLoadDate}>
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
                            setOpenLoadDate(false); // Auto-close
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
                    <Popover
                      open={openHarvestDate}
                      onOpenChange={setOpenHarvestDate}
                    >
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
                          onSelect={(date) => {
                            setHarvestDate(date);
                            setOpenHarvestDate(false); // Auto-close
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 3-COLUMN BATCH DETAILS GRID */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Batch Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="name"
                      required
                      placeholder="e.g. Loading 1"
                      className="h-12 rounded-xl border-input px-4 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Type of Chick <span className="text-red-500">*</span>
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
                                    setOpenChickType(false); // Also auto-closing the combobox!
                                  }}
                                  className="py-2.5 px-4 cursor-pointer"
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

                {/* FINANCIALS & LIVE MATH ENGINE */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50 space-y-5">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* QUANTITY INPUT */}
                    <div
                      className="space-y-2"
                      onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value !== undefined) {
                          setQuantityInput(target.value);
                        }
                      }}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                        Quantity *
                      </label>
                      <FormattedNumberInput
                        name="actualQuantityLoad"
                        required
                        placeholder="e.g. 10,000"
                        className="h-11 rounded-xl bg-background font-bold text-lg border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>

                    {/* PRICE PER CHICK INPUT */}
                    <div
                      className="space-y-2"
                      onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value !== undefined) {
                          setPricePerChickInput(target.value);
                        }
                      }}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500">
                        Price per Chick (₱) *
                      </label>
                      <FormattedNumberInput
                        name="pricePerChick"
                        required
                        allowDecimals={true}
                        placeholder="e.g. 40.00"
                        className="h-11 rounded-xl bg-background font-bold border-emerald-200 focus-visible:ring-emerald-500"
                      />
                    </div>

                    {/* SELLING PRICE INPUT */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Target Selling (₱)
                      </label>
                      <FormattedNumberInput
                        name="sellingPrice"
                        required
                        placeholder="e.g. 300.00"
                        allowDecimals={true}
                        className="h-11 rounded-xl bg-background font-bold"
                      />
                    </div>
                  </div>

                  {/* VISUAL TOTAL CAPITAL DISPLAY */}
                  <div className="bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                          Calculated Initial Capital
                        </p>
                        <p className="text-xs font-bold text-muted-foreground mt-0.5">
                          {cleanQuantity > 0 && cleanPricePerChick > 0
                            ? `${cleanQuantity.toLocaleString()} birds × ₱${cleanPricePerChick.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "Enter Quantity and Price"}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₱
                      {computedTotalCapital.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
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
                    disabled={loading || computedTotalCapital <= 0}
                    className="h-12 px-10 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> Save & Load
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
