"use client";

import { useState, useMemo } from "react";
import { MapPin, Warehouse, Search, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Modal & Button Imports
import AddFarmModal from "./AddFarmModal";
import AddBuildingModal from "./AddBuildingModal";
import DeleteAlertButton from "./DeleteAlertButton";

export default function FarmsClient({
  initialFarms,
  initialBuildings,
}: {
  initialFarms: any[];
  initialBuildings: any[];
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredFarms = useMemo(() => {
    return initialFarms.filter((farm) => {
      const searchStr = search.toLowerCase();
      const matchesSearch =
        farm.name.toLowerCase().includes(searchStr) ||
        farm.city.toLowerCase().includes(searchStr) ||
        farm.barangay.toLowerCase().includes(searchStr);

      const matchesTab = activeTab === "all" || farm.province === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [search, activeTab, initialFarms]);

  const uniqueProvinces = useMemo(() => {
    return Array.from(new Set(initialFarms.map((f) => f.province))).sort();
  }, [initialFarms]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 bg-card/50 backdrop-blur-xl p-8 rounded-lg border border-border/50 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Farm Network
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Infrastructure Management for{" "}
            <span className="font-bold text-foreground">Otso Poultry Farm</span>
          </p>
        </div>
        <AddFarmModal />
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search farm, city, or barangay..."
          className="pl-12 h-14 rounded-2xl bg-background border-border/50 text-base shadow-inner focus-visible:ring-primary"
        />
      </div>

      {/* TABS SYSTEM */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl inline-flex">
            <TabsTrigger
              value="all"
              className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-background"
            >
              ALL REGIONS
            </TabsTrigger>
            {uniqueProvinces.map((prov) => (
              <TabsTrigger
                key={prov}
                value={prov}
                className="rounded-xl px-8 py-2.5 font-bold uppercase data-[state=active]:bg-background"
              >
                {prov}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8">
          {filteredFarms.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
              <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold">No farms found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredFarms.map((farm) => (
                <FarmCard
                  key={farm.id}
                  farm={farm}
                  buildings={initialBuildings.filter(
                    (b) => b.farmId === farm.id,
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function FarmCard({ farm, buildings }: { farm: any; buildings: any[] }) {
  // THE ADAPTIVE GRADIENT: White/Blue in Light Mode, Slate/Navy in Dark Mode
  const arcticGradient =
    "bg-linear-to-br from-white via-blue-50/50 to-blue-100/30 dark:from-slate-900 dark:via-slate-950 dark:to-black border-t-4 border-blue-600 dark:border-blue-500";

  return (
    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col">
      {/* ADAPTIVE HEADER */}
      <div className={cn("p-6 transition-all duration-500", arcticGradient)}>
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 max-w-[70%]">
            <h3 className="text-lg sm:text-xl  font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate uppercase">
              {farm.name}
            </h3>
            {/* Location Tag */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-[0.15em] bg-blue-600/10 dark:bg-blue-500/10 w-fit px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800/50 backdrop-blur-md">
              <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-300">
                {farm.barangay}, {farm.city}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <AddBuildingModal farmId={farm.id} farmName={farm.name} />
            <DeleteAlertButton id={farm.id} name={farm.name} type="farm" />
          </div>
        </div>
      </div>

      {/* CLEAN CONTENT BODY */}
      <div className="p-6 grow bg-white/40 dark:bg-slate-900/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {buildings.length === 0 ? (
            <div className="col-span-full py-10 rounded-2xl border-2 border-dashed border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-muted-foreground bg-blue-50/20 dark:bg-blue-950/20">
              <Warehouse className="h-6 w-6 mb-2 opacity-20 text-blue-400 dark:text-blue-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-800/40 dark:text-blue-400/40">
                Ready for Infrastructure
              </p>
            </div>
          ) : (
            buildings.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all group/item",
                  b.hasActiveLoad
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md",
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Dynamic Icon Box */}
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border shadow-xs group-hover/item:scale-110 transition-all",
                      b.hasActiveLoad
                        ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800"
                        : "bg-blue-50 dark:bg-slate-900 border-blue-100 dark:border-blue-800 group-hover/item:border-blue-400",
                    )}
                  >
                    <Warehouse
                      className={cn(
                        "h-5 w-5",
                        b.hasActiveLoad
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400",
                      )}
                    />
                  </div>

                  {/* Building Name & Status */}
                  <div className="flex flex-col">
                    <span className="font-bold text-xs truncate uppercase tracking-tight text-slate-700 dark:text-slate-200">
                      {b.name}
                    </span>

                    {/* THE ACTIVE PULSING BADGE */}
                    {b.hasActiveLoad ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          Active Load
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
                        Empty
                      </span>
                    )}
                  </div>
                </div>

                <DeleteAlertButton id={b.id} name={b.name} type="building" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
