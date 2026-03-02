// "use client";

// import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
// import { addDailyRecord } from "./actions";
// import { X, Loader2, Save, Activity } from "lucide-react";
// import { toast } from "sonner";

// export default function AddDailyRecordModal({
//   activeLoads,
// }: {
//   activeLoads: any[];
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => setMounted(true), []);

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setLoading(true);

//     const formData = new FormData(e.currentTarget);
//     const result = await addDailyRecord(formData);

//     if (result.error) {
//       toast.error("Error Saving Data", {
//         description: result.error,
//         style: { backgroundColor: "red", color: "white", border: "none" },
//       });
//     } else {
//       toast.success("Record Saved!", {
//         description: "The daily monitoring data has been logged.",
//         style: { backgroundColor: "blue", color: "white", border: "none" },
//       });
//       setIsOpen(false);
//     }
//     setLoading(false);
//   }

//   return (
//     <>
//       <button
//         onClick={() => setIsOpen(true)}
//         className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300"
//       >
//         <Activity className="w-5 h-5 mr-2" /> Log Daily Data
//       </button>

//       {isOpen &&
//         mounted &&
//         createPortal(
//           <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//             <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
//               <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
//                 <div>
//                   <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
//                     <Activity className="text-primary w-5 h-5" /> Daily Input
//                   </h2>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Log mortality and feeds for today.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="p-2 rounded-full hover:bg-secondary transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-5">
//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold">
//                     Select Active Building{" "}
//                     <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     name="loadId"
//                     required
//                     className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
//                   >
//                     <option value="">
//                       -- Select where you are reporting --
//                     </option>
//                     {activeLoads.map((load) => (
//                       <option key={load.id} value={load.id}>
//                         {load.farmName} - {load.buildingName} (Start Qty:{" "}
//                         {load.quantity})
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold">
//                     Date of Record <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="date"
//                     name="recordDate"
//                     required
//                     defaultValue={new Date().toISOString().split("T")[0]}
//                     className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold text-red-600 dark:text-red-400">
//                       Mortality (Dead)
//                     </label>
//                     <input
//                       type="number"
//                       name="mortality"
//                       defaultValue={0}
//                       min="0"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-semibold text-amber-600 dark:text-amber-500">
//                       Feeds (kg/bags)
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       name="feedsConsumed"
//                       defaultValue={0}
//                       min="0"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
//                     />
//                   </div>
//                   <div className="space-y-2 col-span-2">
//                     <label className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
//                       Eggs Harvested (Layers Only)
//                     </label>
//                     <input
//                       type="number"
//                       name="eggCount"
//                       defaultValue={0}
//                       min="0"
//                       className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-semibold">
//                     Remarks / Notes
//                   </label>
//                   <textarea
//                     name="remarks"
//                     placeholder="e.g., Too hot today, birds drinking more water."
//                     rows={2}
//                     className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary resize-none"
//                   ></textarea>
//                 </div>

//                 <div className="pt-2 flex justify-end gap-3">
//                   <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="h-11 px-6 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="h-11 px-8 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
//                   >
//                     {loading ? (
//                       <>
//                         <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="w-4 h-4 mr-2 inline" /> Submit Record
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>,
//           document.body,
//         )}
//     </>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDailyRecord } from "./actions";
import { X, Loader2, Save, Activity, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// SHADCN UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddDailyRecordModal({
  activeLoads,
}: {
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form States
  const [loadId, setLoadId] = useState("");
  const [recordDate, setRecordDate] = useState<Date | undefined>(new Date());

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!loadId) {
      toast.error("Missing Field", {
        description: "Please select an active building.",
      });
      return;
    }
    if (!recordDate) {
      toast.error("Missing Field", { description: "Please select a date." });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("loadId", loadId);
    formData.set("recordDate", format(recordDate, "yyyy-MM-dd"));

    const result = await addDailyRecord(formData);

    if (result.error) {
      toast.error("Error Saving Data", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Record Saved!", {
        description: "The daily monitoring data has been logged.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
      setLoadId("");
      setRecordDate(new Date());
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl text-sm font-bold shadow-sm hover:-translate-y-0.5 transition-all duration-300"
      >
        <Activity className="w-5 h-5 mr-2" /> Log Daily Data
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Activity className="text-primary w-5 h-5" /> Daily Input
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log mortality and feeds for today.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Select Active Building{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select value={loadId} onValueChange={setLoadId}>
                    <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input">
                      <SelectValue placeholder="-- Select where you are reporting --" />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      {activeLoads.map((load) => (
                        <SelectItem key={load.id} value={String(load.id)}>
                          {load.farmName} - {load.buildingName} (Qty:{" "}
                          {load.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Date of Record <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 rounded-xl justify-start text-left font-normal bg-background border-input",
                          !recordDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recordDate ? (
                          format(recordDate, "MMM d, yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-200">
                      <Calendar
                        mode="single"
                        selected={recordDate}
                        onSelect={setRecordDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Mortality (Dead)
                    </label>
                    <Input
                      type="number"
                      name="mortality"
                      defaultValue={0}
                      min="0"
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                      Feeds (kg/bags)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      name="feedsConsumed"
                      defaultValue={0}
                      min="0"
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                      Eggs Harvested (Layers)
                    </label>
                    <Input
                      type="number"
                      name="eggCount"
                      defaultValue={0}
                      min="0"
                      className="h-11 rounded-xl bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Remarks / Notes
                  </label>
                  <Textarea
                    name="remarks"
                    placeholder="e.g., Too hot today, birds drinking more water."
                    rows={2}
                    className="rounded-xl bg-background resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
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
                    className="h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Submit Record
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
