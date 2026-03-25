// "use client";

// import { useState, useMemo } from "react";
// import {
//   MapPin,
//   Warehouse,
//   Search,
//   Globe,
//   Building2,
//   PlusCircle,
// } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { cn } from "@/lib/utils";

// // Modal & Button Imports
// import AddFarmModal from "./AddFarmModal";
// import AddBuildingModal from "./AddBuildingModal";
// import DeleteAlertButton from "./DeleteAlertButton";

// export default function FarmsClient({
//   initialFarms,
//   initialBuildings,
// }: {
//   initialFarms: any[];
//   initialBuildings: any[];
// }) {
//   const [search, setSearch] = useState("");
//   const [activeTab, setActiveTab] = useState("all");

//   const filteredFarms = useMemo(() => {
//     return initialFarms.filter((farm) => {
//       const searchStr = search.toLowerCase();
//       const matchesSearch =
//         farm.name.toLowerCase().includes(searchStr) ||
//         farm.city.toLowerCase().includes(searchStr) ||
//         farm.barangay.toLowerCase().includes(searchStr);

//       const matchesTab = activeTab === "all" || farm.province === activeTab;

//       return matchesSearch && matchesTab;
//     });
//   }, [search, activeTab, initialFarms]);

//   const uniqueProvinces = useMemo(() => {
//     return Array.from(new Set(initialFarms.map((f) => f.province))).sort();
//   }, [initialFarms]);

//   return (
//     <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
//       {/* HEADER */}
//       <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>

//         <div className="relative z-10">
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4 border border-primary/20">
//             <Globe className="h-3 w-3" />
//             Infrastructure
//           </div>
//           <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
//             Farm Network
//           </h1>
//           <p className="text-sm font-medium text-muted-foreground mt-1">
//             Managing{" "}
//             <span className="text-foreground font-bold">
//               {initialFarms.length} Sites
//             </span>{" "}
//             across {uniqueProvinces.length} regions.
//           </p>
//         </div>
//         <AddFarmModal />
//       </div>

//       {/* SEARCH BAR */}
//       <div className="relative max-w-md group">
//         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
//         <Input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Filter by name, city, or barangay..."
//           className="pl-12 h-14 rounded-lg bg-card border-border shadow-sm text-base focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
//         />
//       </div>

//       {/* TABS SYSTEM WITH FUTURE-PROOF HORIZONTAL SCROLL */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <div className="max-w-full overflow-x-auto scrollbar-hide pb-2">
//           <TabsList className="bg-muted/50 p-1.5 rounded-lg inline-flex w-max justify-start min-w-full border border-border/40">
//             <TabsTrigger
//               value="all"
//               className="rounded-lg px-8 py-2.5 font-black text-[12px] uppercase tracking-widest whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
//             >
//               All Regions
//             </TabsTrigger>
//             {uniqueProvinces.map((prov) => (
//               <TabsTrigger
//                 key={prov}
//                 value={prov}
//                 className="rounded-lg px-8 py-2.5 font-black text-[12px] uppercase tracking-widest whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
//               >
//                 {prov}
//               </TabsTrigger>
//             ))}
//           </TabsList>
//         </div>

//         <div className="mt-8">
//           {filteredFarms.length === 0 ? (
//             <div className="py-24 flex flex-col items-center justify-center bg-card/50 rounded-lg border-2 border-dashed border-border">
//               <div className="p-4 bg-muted rounded-full mb-4">
//                 <Search className="h-8 w-8 text-muted-foreground/40" />
//               </div>
//               <h3 className="text-xl font-black uppercase tracking-tight">
//                 No match found
//               </h3>
//               <p className="text-muted-foreground font-medium mt-1">
//                 Adjust your filters or search keywords.
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               {filteredFarms.map((farm) => (
//                 <FarmCard
//                   key={farm.id}
//                   farm={farm}
//                   buildings={initialBuildings.filter(
//                     (b) => b.farmId === farm.id,
//                   )}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </Tabs>
//     </div>
//   );
// }

// function FarmCard({ farm, buildings }: { farm: any; buildings: any[] }) {
//   return (
//     <div className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 group flex flex-col">
//       {/* CARD HEADER */}
//       <div className="p-6 bg-linear-to-br from-muted/30 to-card border-b border-border/40">
//         <div className="flex justify-between items-start">
//           <div className="space-y-3 flex-1 min-w-0">
//             <div className="flex items-center gap-3">
//               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
//                 <Building2 className="h-5 w-5 text-primary" />
//               </div>
//               <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors truncate uppercase">
//                 {farm.name}
//               </h3>
//             </div>

//             <div className="flex flex-wrap gap-2">
//               <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border/50">
//                 <MapPin className="h-3 w-3" />
//                 {farm.barangay}, {farm.city}
//               </div>
//               <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
//                 {buildings.length} Buildings
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-2 shrink-0 ml-4">
//             <AddBuildingModal farmId={farm.id} farmName={farm.name} />
//             <DeleteAlertButton id={farm.id} name={farm.name} type="farm" />
//           </div>
//         </div>
//       </div>

//       {/* CONTENT BODY */}
//       <div className="p-6 grow">
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {buildings.length === 0 ? (
//             <div className="col-span-full py-8 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center bg-muted/20">
//               <PlusCircle className="h-5 w-5 mb-2 text-muted-foreground/30" />
//               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
//                 No Buildings Added
//               </p>
//             </div>
//           ) : (
//             buildings.map((b) => (
//               <div
//                 key={b.id}
//                 className={cn(
//                   "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/item",
//                   b.hasActiveLoad
//                     ? "bg-emerald-500/5 border-emerald-500/20 shadow-xs"
//                     : "bg-background border-border hover:border-primary/50 hover:shadow-md",
//                 )}
//               >
//                 <div className="flex items-center gap-3 overflow-hidden">
//                   <div
//                     className={cn(
//                       "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300",
//                       b.hasActiveLoad
//                         ? "bg-emerald-500/10 border-emerald-500/30"
//                         : "bg-muted/50 border-border group-hover/item:bg-primary/5",
//                     )}
//                   >
//                     <Warehouse
//                       className={cn(
//                         "h-5 w-5 transition-colors",
//                         b.hasActiveLoad
//                           ? "text-emerald-500"
//                           : "text-muted-foreground group-hover/item:text-primary",
//                       )}
//                     />
//                   </div>

//                   <div className="flex flex-col min-w-0">
//                     <span className="font-black text-[11px] truncate uppercase tracking-tight text-foreground">
//                       {b.name}
//                     </span>

//                     {b.hasActiveLoad ? (
//                       <div className="flex items-center gap-1.5 mt-0.5">
//                         <span className="relative flex h-1.5 w-1.5">
//                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
//                           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
//                         </span>
//                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
//                           Active
//                         </span>
//                       </div>
//                     ) : (
//                       <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
//                         Empty
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
//                   <DeleteAlertButton id={b.id} name={b.name} type="building" />
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Warehouse,
  Search,
  Globe,
  Building2,
  PlusCircle,
  MoreVertical,
} from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* HEADER - CLEAN & COMPACT */}
      <div className="rounded-xl border border-border/60 bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            <Globe className="h-3 w-3" />
            Infrastructure
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Farm Network
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Managing{" "}
            <span className="text-foreground font-bold">
              {initialFarms.length} Sites
            </span>{" "}
            across {uniqueProvinces.length} regions.
          </p>
        </div>
        <AddFarmModal />
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, city, or barangay..."
          className="pl-10 h-12 rounded-xl bg-card border-border/60 shadow-sm text-sm focus-visible:ring-primary/20 transition-all"
        />
      </div>

      {/* TABS SYSTEM */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="max-w-full overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="bg-transparent space-x-2 inline-flex w-max justify-start min-w-full p-0">
            <TabsTrigger
              value="all"
              className="rounded-lg px-6 py-2.5 font-bold text-xs uppercase tracking-wider whitespace-nowrap border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/60 data-[state=active]:shadow-sm transition-all"
            >
              All Regions
            </TabsTrigger>
            {uniqueProvinces.map((prov) => (
              <TabsTrigger
                key={prov}
                value={prov}
                className="rounded-lg px-6 py-2.5 font-bold text-xs uppercase tracking-wider whitespace-nowrap border border-transparent data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:border-border/60 data-[state=active]:shadow-sm transition-all"
              >
                {prov}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* FARM CONTENT GRID */}
        <TabsContent value={activeTab} className="mt-6 outline-none">
          {filteredFarms.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-card/30 rounded-2xl border border-dashed border-border/60">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground/80">
                No matching farms
              </h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Adjust your filters or search keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FarmCard({ farm, buildings }: { farm: any; buildings: any[] }) {
  const activeCount = buildings.filter((b) => b.hasActiveLoad).length;
  const hasActive = activeCount > 0;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
      {/* ---> GRADIENT TOP BORDER STRIP <--- */}
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-1.5 z-10",
          hasActive
            ? "bg-linear-to-r from-emerald-400 to-blue-500"
            : "bg-muted-foreground/20",
        )}
      />

      {/* CARD HEADER - CLEAN COMPACT LAYOUT */}
      <div className="px-5 py-5 pt-6 md:px-6 md:py-6 md:pt-7 border-b border-border/40 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-black tracking-tight text-foreground uppercase truncate">
              {farm.name}
            </h3>
            {activeCount > 0 && (
              <span className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                {activeCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {farm.barangay}, {farm.city}
            </span>
            <span className="text-border">•</span>
            <span className="shrink-0">
              {buildings.length} Building{buildings.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          <AddBuildingModal farmId={farm.id} farmName={farm.name} />
          <DeleteAlertButton id={farm.id} name={farm.name} type="farm" />
        </div>
      </div>

      {/* CONTENT BODY - BUILDINGS LIST */}
      <div className="p-5 md:p-6 grow bg-slate-50/30 dark:bg-slate-900/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {buildings.length === 0 ? (
            <div className="col-span-full py-8 rounded-xl border border-dashed border-border/50 flex flex-col items-center justify-center bg-transparent">
              <PlusCircle className="h-5 w-5 mb-2 text-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                No Buildings Added
              </p>
            </div>
          ) : (
            buildings.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border transition-all group/item",
                  b.hasActiveLoad
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-800/60"
                    : "bg-background border-border border-dashed hover:border-solid hover:border-border/80",
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex items-center justify-center shrink-0",
                      b.hasActiveLoad
                        ? "bg-emerald-100 dark:bg-emerald-500/20"
                        : "bg-muted",
                    )}
                  >
                    <Warehouse
                      className={cn(
                        "h-4 w-4",
                        b.hasActiveLoad
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "font-bold text-sm truncate",
                        b.hasActiveLoad
                          ? "text-emerald-950 dark:text-emerald-100"
                          : "text-foreground",
                      )}
                    >
                      {b.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {b.hasActiveLoad ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                            Active
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          Empty
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity pl-2 shrink-0">
                  <DeleteAlertButton id={b.id} name={b.name} type="building" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
