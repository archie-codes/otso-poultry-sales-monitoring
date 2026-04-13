// "use client";

// import { useState } from "react";
// import { transferStockMidFlock } from "./actions";
// import {
//   MoreVertical,
//   ArrowRightLeft,
//   Info,
//   Loader2,
//   Save,
//   Check,
//   ChevronsUpDown,
// } from "lucide-react";
// import { toast } from "sonner";
// import { cn } from "@/lib/utils";

// // SHADCN UI
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";

// export default function BuildingTransferMenu({
//   farmName,
//   sourceBuildingName,
//   activeStocks,
//   otherActiveLoads,
// }: {
//   farmName: string;
//   sourceBuildingName: string;
//   activeStocks: { id: number; type: string; qty: number }[];
//   otherActiveLoads: { id: number; name: string; building: string }[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);

//   // COMBOBOX STATES
//   const [openFeed, setOpenFeed] = useState(false);
//   const [selectedFeedId, setSelectedFeedId] = useState<string>("");

//   const [openDest, setOpenDest] = useState(false);
//   const [selectedDestId, setSelectedDestId] = useState<string>("");

//   const selectedFeedData = activeStocks.find(
//     (s) => String(s.id) === selectedFeedId,
//   );
//   const selectedDestData = otherActiveLoads.find(
//     (l) => String(l.id) === selectedDestId,
//   );

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();

//     if (!selectedFeedId || !selectedDestId) {
//       toast.error("Missing Information", {
//         description: "Please select both a feed and a destination.",
//       });
//       return;
//     }

//     setIsProcessing(true);

//     const formData = new FormData(e.currentTarget);
//     const result = await transferStockMidFlock(formData);

//     if (result?.error) {
//       toast.error(result.error);
//     } else {
//       toast.success("Transfer Complete!", {
//         description: "Feeds successfully moved to the target building.",
//       });
//       setIsOpen(false);
//       setSelectedFeedId("");
//       setSelectedDestId("");
//     }
//     setIsProcessing(false);
//   }

//   const hasFeeds = activeStocks.length > 0;
//   const hasDestination = otherActiveLoads.length > 0;
//   const canTransfer = hasFeeds && hasDestination;

//   return (
//     <>
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             variant="ghost"
//             size="icon"
//             className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
//           >
//             <MoreVertical className="w-4 h-4 text-muted-foreground" />
//           </Button>
//         </DropdownMenuTrigger>

//         <DropdownMenuContent
//           align="end"
//           className="w-56 rounded-2xl shadow-xl border-border/50 p-2"
//         >
//           {canTransfer ? (
//             <DropdownMenuItem
//               onClick={() => setIsOpen(true)}
//               className="font-bold text-xs cursor-pointer py-3 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
//             >
//               <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Stock
//             </DropdownMenuItem>
//           ) : (
//             <div className="p-3 bg-secondary/50 rounded-xl flex items-start gap-2">
//               <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
//               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
//                 {!hasFeeds
//                   ? "Cannot transfer. This building is out of feeds."
//                   : "Cannot transfer. No other active buildings in this farm."}
//               </p>
//             </div>
//           )}
//         </DropdownMenuContent>
//       </DropdownMenu>

//       <Dialog open={isOpen} onOpenChange={setIsOpen}>
//         <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/50">
//           <div className="bg-amber-600 p-6 text-white flex items-center gap-4">
//             <div className="p-3 bg-amber-500/50 rounded-2xl shrink-0">
//               <ArrowRightLeft className="w-6 h-6" />
//             </div>
//             <div>
//               <DialogTitle className="text-2xl font-black">
//                 Transfer Stock
//               </DialogTitle>
//               <p className="text-amber-100 text-xs font-bold mt-0.5 tracking-wider uppercase">
//                 Moving from {sourceBuildingName}
//               </p>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card">
//             {/* ---> THE FIX: ADDED THE MISSING SOURCE BUILDING HIDDEN INPUT <--- */}
//             <input type="hidden" name="sourceFeedId" value={selectedFeedId} />
//             <input type="hidden" name="targetLoadId" value={selectedDestId} />
//             <input
//               type="hidden"
//               name="sourceBuildingName"
//               value={sourceBuildingName}
//             />

//             <div className="space-y-1.5">
//               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
//                 Select Feed to Move *
//               </label>
//               <Popover open={openFeed} onOpenChange={setOpenFeed}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     role="combobox"
//                     aria-expanded={openFeed}
//                     className={cn(
//                       "w-full h-11 justify-between rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800",
//                       !selectedFeedId && "text-muted-foreground",
//                     )}
//                   >
//                     <span className="truncate">
//                       {selectedFeedData
//                         ? `${selectedFeedData.type} (${selectedFeedData.qty} sacks)`
//                         : "-- Choose Feed --"}
//                     </span>
//                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-border/50 z-200">
//                   <Command>
//                     <CommandInput
//                       placeholder="Search feed type..."
//                       className="h-10"
//                     />
//                     <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
//                       <CommandEmpty>No feeds found.</CommandEmpty>
//                       <CommandGroup>
//                         {activeStocks.map((stock) => (
//                           <CommandItem
//                             key={stock.id}
//                             value={`${stock.type} ${stock.id}`}
//                             onSelect={() => {
//                               setSelectedFeedId(String(stock.id));
//                               setOpenFeed(false);
//                             }}
//                             className="font-bold text-xs uppercase py-2.5 cursor-pointer"
//                           >
//                             <Check
//                               className={cn(
//                                 "mr-2 h-4 w-4 text-amber-600",
//                                 selectedFeedId === String(stock.id)
//                                   ? "opacity-100"
//                                   : "opacity-0",
//                               )}
//                             />
//                             {stock.type}{" "}
//                             <span className="ml-1 text-muted-foreground">
//                               ({stock.qty} sacks)
//                             </span>
//                           </CommandItem>
//                         ))}
//                       </CommandGroup>
//                     </CommandList>
//                   </Command>
//                 </PopoverContent>
//               </Popover>
//             </div>

//             {selectedFeedId && (
//               <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">
//                   Quantity to Transfer (Sacks) *
//                 </label>
//                 <Input
//                   type="number"
//                   name="transferQty"
//                   step="0.01"
//                   min="0.01"
//                   max={selectedFeedData?.qty || 0}
//                   required
//                   placeholder="0"
//                   className="h-11 rounded-xl font-black bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
//                 />
//                 <p className="text-[10px] font-bold text-muted-foreground text-right mt-1">
//                   Max Available: {selectedFeedData?.qty}
//                 </p>
//               </div>
//             )}

//             <div className="space-y-1.5">
//               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
//                 Destination Building ({farmName}) *
//               </label>
//               <Popover open={openDest} onOpenChange={setOpenDest}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     role="combobox"
//                     aria-expanded={openDest}
//                     className={cn(
//                       "w-full h-11 justify-between rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800",
//                       !selectedDestId && "text-muted-foreground",
//                     )}
//                   >
//                     <span className="truncate">
//                       {selectedDestData
//                         ? `${selectedDestData.building} (${selectedDestData.name})`
//                         : "-- Select Destination --"}
//                     </span>
//                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-border/50 z-200">
//                   <Command>
//                     <CommandInput
//                       placeholder="Search building or batch..."
//                       className="h-10"
//                     />
//                     <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
//                       <CommandEmpty>No active buildings found.</CommandEmpty>
//                       <CommandGroup>
//                         {otherActiveLoads.map((load) => (
//                           <CommandItem
//                             key={load.id}
//                             value={`${load.building} ${load.name}`}
//                             onSelect={() => {
//                               setSelectedDestId(String(load.id));
//                               setOpenDest(false);
//                             }}
//                             className="font-bold text-xs uppercase py-2.5 cursor-pointer"
//                           >
//                             <Check
//                               className={cn(
//                                 "mr-2 h-4 w-4 text-amber-600",
//                                 selectedDestId === String(load.id)
//                                   ? "opacity-100"
//                                   : "opacity-0",
//                               )}
//                             />
//                             {load.building}{" "}
//                             <span className="ml-1 text-muted-foreground">
//                               ({load.name})
//                             </span>
//                           </CommandItem>
//                         ))}
//                       </CommandGroup>
//                     </CommandList>
//                   </Command>
//                 </PopoverContent>
//               </Popover>
//             </div>

//             <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border/50">
//               <Button
//                 type="button"
//                 variant="ghost"
//                 onClick={() => setIsOpen(false)}
//                 className="h-11 rounded-xl font-bold px-6"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={isProcessing}
//                 className="h-11 px-8 rounded-xl font-black bg-amber-600 hover:bg-amber-700 text-white"
//               >
//                 {isProcessing ? (
//                   <Loader2 className="w-4 h-4 animate-spin mr-2" />
//                 ) : (
//                   <Save className="w-4 h-4 mr-2" />
//                 )}{" "}
//                 Confirm Transfer
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

"use client";

import { useState } from "react";
import { transferStockMidFlock } from "./actions";
import {
  MoreVertical,
  ArrowRightLeft,
  Info,
  Loader2,
  Save,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// SHADCN UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

export default function BuildingTransferMenu({
  farmName,
  sourceBuildingName,
  sourceBatchName,
  activeStocks,
  otherActiveLoads,
}: {
  farmName: string;
  sourceBuildingName: string;
  sourceBatchName: string;
  activeStocks: { id: number; type: string; qty: number }[];
  // ---> THE FIX: Added 'farm' to the type definition <---
  otherActiveLoads: {
    id: number;
    name: string;
    building: string;
    farm: string;
  }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // COMBOBOX STATES
  const [openFeed, setOpenFeed] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string>("");

  const [openDest, setOpenDest] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState<string>("");

  const selectedFeedData = activeStocks.find(
    (s) => String(s.id) === selectedFeedId,
  );
  const selectedDestData = otherActiveLoads.find(
    (l) => String(l.id) === selectedDestId,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedFeedId || !selectedDestId) {
      toast.error("Missing Information", {
        description: "Please select both a feed and a destination.",
      });
      return;
    }

    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const result = await transferStockMidFlock(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Transfer Complete!", {
        description: "Feeds successfully moved to the target building.",
      });
      setIsOpen(false);
      setSelectedFeedId("");
      setSelectedDestId("");
    }
    setIsProcessing(false);
  }

  const hasFeeds = activeStocks.length > 0;
  const hasDestination = otherActiveLoads.length > 0;
  const canTransfer = hasFeeds && hasDestination;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-56 rounded-2xl shadow-xl border-border/50 p-2"
        >
          {canTransfer ? (
            <DropdownMenuItem
              onClick={() => setIsOpen(true)}
              className="font-bold text-xs cursor-pointer py-3 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Stock
            </DropdownMenuItem>
          ) : (
            <div className="p-3 bg-secondary/50 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                {!hasFeeds
                  ? "Cannot transfer. This building is out of feeds."
                  : "Cannot transfer. No other active buildings to transfer to."}
              </p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/50">
          <div className="bg-amber-600 p-6 text-white flex items-center gap-4">
            <div className="p-3 bg-amber-500/50 rounded-2xl shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">
                Transfer Stock
              </DialogTitle>
              <p className="text-amber-100 text-xs font-bold mt-0.5 tracking-wider uppercase">
                Moving from {sourceBuildingName}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card">
            {/* ---> THE FIX: Inject the Farm name into the Source Building Name for better logs <--- */}
            <input type="hidden" name="sourceFeedId" value={selectedFeedId} />
            <input type="hidden" name="targetLoadId" value={selectedDestId} />
            <input
              type="hidden"
              name="sourceBuildingName"
              value={`${farmName} * ${sourceBuildingName} * ${sourceBatchName || "Unnamed"}`}
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Feed to Move *
              </label>
              <Popover open={openFeed} onOpenChange={setOpenFeed}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFeed}
                    className={cn(
                      "w-full h-11 justify-between rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800",
                      !selectedFeedId && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">
                      {selectedFeedData
                        ? `${selectedFeedData.type} (${selectedFeedData.qty} sacks)`
                        : "-- Choose Feed --"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-border/50 z-200">
                  <Command>
                    <CommandInput
                      placeholder="Search feed type..."
                      className="h-10"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty>No feeds found.</CommandEmpty>
                      <CommandGroup>
                        {activeStocks.map((stock) => (
                          <CommandItem
                            key={stock.id}
                            value={`${stock.type} ${stock.id}`}
                            onSelect={() => {
                              setSelectedFeedId(String(stock.id));
                              setOpenFeed(false);
                            }}
                            className="font-bold text-xs uppercase py-2.5 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-amber-600",
                                selectedFeedId === String(stock.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {stock.type}{" "}
                            <span className="ml-1 text-muted-foreground">
                              ({stock.qty} sacks)
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedFeedId && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Quantity to Transfer (Sacks) *
                </label>
                <Input
                  type="number"
                  name="transferQty"
                  step="0.01"
                  min="0.01"
                  max={selectedFeedData?.qty || 0}
                  required
                  placeholder="0"
                  className="h-11 rounded-xl font-black bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
                />
                <p className="text-[10px] font-bold text-muted-foreground text-right mt-1">
                  Max Available: {selectedFeedData?.qty}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Destination *
              </label>
              <Popover open={openDest} onOpenChange={setOpenDest}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDest}
                    className={cn(
                      "w-full h-11 justify-between rounded-xl border-border bg-slate-50 dark:bg-slate-900 text-sm font-bold uppercase hover:bg-slate-100 dark:hover:bg-slate-800",
                      !selectedDestId && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">
                      {/* ---> THE FIX: Display Farm Name in Dropdown Preview <--- */}
                      {selectedDestData
                        ? `${selectedDestData.farm} - ${selectedDestData.building} (${selectedDestData.name})`
                        : "-- Select Destination --"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-border/50 z-200">
                  <Command>
                    <CommandInput
                      placeholder="Search building or batch..."
                      className="h-10"
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty>No active buildings found.</CommandEmpty>
                      <CommandGroup>
                        {otherActiveLoads.map((load) => (
                          <CommandItem
                            key={load.id}
                            value={`${load.farm} ${load.building} ${load.name}`}
                            onSelect={() => {
                              setSelectedDestId(String(load.id));
                              setOpenDest(false);
                            }}
                            className="font-bold text-xs uppercase py-2.5 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-amber-600",
                                selectedDestId === String(load.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {/* ---> THE FIX: Display Farm Name in Dropdown List <--- */}
                            {load.farm} - {load.building}{" "}
                            <span className="ml-1 text-muted-foreground">
                              ({load.name})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-11 rounded-xl font-bold px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="h-11 px-8 rounded-xl font-black bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}{" "}
                Confirm Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
