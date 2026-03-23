"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { addFarm } from "./actions";
import {
  X,
  Loader2,
  Save,
  Tractor,
  MapPin,
  Check,
  ChevronsUpDown,
  PlusCircle, // Added for the custom input icon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// 1. LOCATION PACKAGE
import {
  provinces,
  getCityMunByProvince,
  getBarangayByMun,
} from "phil-reg-prov-mun-brgy";

// SHADCN UI
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

// TYPES
interface Province {
  prov_code: string;
  name: string;
}
interface CityMun {
  mun_code: string;
  name: string;
}
interface Barangay {
  name: string;
}

export default function AddFarmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // CASCADING STATE
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [barangayName, setBarangayName] = useState("");

  // SEARCH STATE FOR CUSTOM BARANGAY
  const [brgySearch, setBrgySearch] = useState("");

  // UI STATE FOR SEARCH BOXES
  const [openProv, setOpenProv] = useState(false);
  const [openCity, setOpenCity] = useState(false);
  const [openBrgy, setOpenBrgy] = useState(false);

  useEffect(() => setMounted(true), []);

  // DE-DUPLICATION & SORTING
  const availableProvinces = useMemo(() => {
    const raw = (provinces as Province[]) || [];
    const unique = Array.from(
      new Map(raw.map((p) => [p.prov_code, p])).values(),
    );
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const availableCities = useMemo(() => {
    if (!provinceCode) return [];
    const raw = (getCityMunByProvince(provinceCode) as CityMun[]) || [];
    const unique = Array.from(
      new Map(raw.map((c) => [c.mun_code, c])).values(),
    );
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [provinceCode]);

  const availableBarangays = useMemo(() => {
    if (!cityCode) return [];
    const raw = (getBarangayByMun(cityCode) as Barangay[]) || [];
    return Array.from(new Set(raw.map((b) => b.name.toUpperCase()))).sort();
  }, [cityCode]);

  // Check if the user's search text exists in the database
  const showCustomBrgyOption =
    brgySearch.trim().length > 0 &&
    !availableBarangays.some(
      (b) => b.toUpperCase() === brgySearch.trim().toUpperCase(),
    );

  // SELECTION HANDLERS
  const handleProvinceSelect = (code: string) => {
    setProvinceCode(code);
    setCityCode("");
    setBarangayName("");
    setBrgySearch(""); // Reset search
    setOpenProv(false);
  };

  const handleCitySelect = (code: string) => {
    setCityCode(code);
    setBarangayName("");
    setBrgySearch(""); // Reset search
    setOpenCity(false);
  };

  const handleBarangaySelect = (name: string) => {
    setBarangayName(name);
    setBrgySearch(""); // Clear the search box after selection
    setOpenBrgy(false);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const selectedProvince = availableProvinces.find(
      (p) => p.prov_code === provinceCode,
    )?.name;
    const selectedCity = availableCities.find(
      (c) => c.mun_code === cityCode,
    )?.name;

    if (!selectedProvince || !selectedCity || !barangayName) {
      toast.error("Missing Info", {
        description: "Select all location fields.",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("province", selectedProvince);
    formData.set("city", selectedCity);
    formData.set("barangay", barangayName);

    const result = await addFarm(formData);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Farm Added!", {
        description: "The farm has been added to the database.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
      setProvinceCode("");
      setCityCode("");
      setBarangayName("");
      setBrgySearch("");
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl font-bold text-white shadow-sm bg-blue-600 hover:bg-blue-700"
      >
        <Tractor className="w-5 h-5 mr-2" /> Add New Farm
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-lg border bg-background/95 backdrop-blur-xl p-6 shadow-2xl rounded-2xl">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="text-primary w-5 h-5" /> Add Farm Location
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Farm Name *</label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g., Central Luzon Farm"
                    className="h-11 rounded-xl uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PROVINCE SEARCH */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Province *</label>
                    <Popover open={openProv} onOpenChange={setOpenProv}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full h-11 justify-between rounded-xl font-normal border-input"
                        >
                          <span className="truncate">
                            {provinceCode
                              ? availableProvinces.find(
                                  (p) => p.prov_code === provinceCode,
                                )?.name
                              : "Search province..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandInput placeholder="Type province..." />
                          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            <CommandEmpty>No province found.</CommandEmpty>
                            <CommandGroup>
                              {availableProvinces.map((prov) => (
                                <CommandItem
                                  key={prov.prov_code}
                                  value={prov.name}
                                  onSelect={() =>
                                    handleProvinceSelect(prov.prov_code)
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      provinceCode === prov.prov_code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {prov.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* CITY SEARCH */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">City *</label>
                    <Popover open={openCity} onOpenChange={setOpenCity}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!provinceCode}
                          className="w-full h-11 justify-between rounded-xl font-normal border-input disabled:opacity-50"
                        >
                          <span className="truncate">
                            {cityCode
                              ? availableCities.find(
                                  (c) => c.mun_code === cityCode,
                                )?.name
                              : "Search city..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandInput placeholder="Type city..." />
                          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {availableCities.map((city) => (
                                <CommandItem
                                  key={city.mun_code}
                                  value={city.name}
                                  onSelect={() =>
                                    handleCitySelect(city.mun_code)
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      cityCode === city.mun_code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {city.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* UPGRADED BARANGAY SEARCH (CREATABLE) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold">Barangay *</label>
                    <Popover open={openBrgy} onOpenChange={setOpenBrgy}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!cityCode}
                          className="w-full h-11 justify-between rounded-xl font-normal border-input disabled:opacity-50"
                        >
                          <span className="truncate">
                            {barangayName || "Search barangay..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200">
                        <Command>
                          <CommandInput
                            placeholder="Type barangay..."
                            value={brgySearch}
                            onValueChange={setBrgySearch}
                            className="uppercase"
                          />
                          <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">
                              No barangay found in our database.
                              <br />
                              <span className="text-primary font-medium">
                                Type the name above to add it manually.
                              </span>
                            </CommandEmpty>

                            <CommandGroup>
                              {availableBarangays.map((brgy) => (
                                <CommandItem
                                  key={brgy}
                                  value={brgy}
                                  onSelect={() => handleBarangaySelect(brgy)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      barangayName === brgy
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {brgy}
                                </CommandItem>
                              ))}

                              {/* DYNAMIC CUSTOM ADD BUTTON */}
                              {showCustomBrgyOption && (
                                <CommandItem
                                  value={brgySearch}
                                  onSelect={() =>
                                    handleBarangaySelect(
                                      brgySearch.trim().toUpperCase(),
                                    )
                                  }
                                  className="font-bold text-primary cursor-pointer border-t border-border mt-1 pt-2"
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Use "{brgySearch.trim().toUpperCase()}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[11px] text-muted-foreground">
                      If your barangay is missing from the list, simply type it
                      into the search box to add it manually.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Farm
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
