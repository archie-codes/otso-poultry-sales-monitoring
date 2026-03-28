"use client";

import { useState } from "react";
import { updateDailyRecord } from "./actions";
import {
  X,
  Loader2,
  Save,
  Pencil,
  ChevronDown,
  Package,
  Check,
  AlertCircle,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

export default function EditDailyRecordModal({ record }: { record: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // ---> LEGACY DATA FALLBACKS <---
  // If editing an old record that didn't have AM/PM splits, we put the total into AM.
  const initMortAm =
    record.mortalityAm !== null ? record.mortalityAm : record.mortality || 0;
  const initFeedsAm =
    record.feedsAm !== null
      ? record.feedsAm
      : record.feeds || record.feedsConsumed || 0;

  const getWhole = (val: any) => {
    const n = Math.floor(Number(val || 0));
    return n > 0 ? String(n) : "";
  };

  const getFrac = (val: any) => {
    return Number((Number(val || 0) % 1).toFixed(2));
  };

  // STATE INITIALIZATION
  const [mortalityAm, setMortalityAm] = useState<number | string>(
    initMortAm || "",
  );
  const [mortalityPm, setMortalityPm] = useState<number | string>(
    record.mortalityPm || "",
  );

  const [feedsAmWhole, setFeedsAmWhole] = useState<number | string>(
    getWhole(initFeedsAm),
  );
  const [feedsAmFrac, setFeedsAmFrac] = useState<number>(getFrac(initFeedsAm));

  const [feedsPmWhole, setFeedsPmWhole] = useState<number | string>(
    getWhole(record.feedsPm),
  );
  const [feedsPmFrac, setFeedsPmFrac] = useState<number>(
    getFrac(record.feedsPm),
  );

  const [feedType, setFeedType] = useState(record.feedType || "");
  const [openFeedType, setOpenFeedType] = useState(false);

  // COMPUTATIONS
  const computedAmFeeds = (Number(feedsAmWhole) || 0) + feedsAmFrac;
  const computedPmFeeds = (Number(feedsPmWhole) || 0) + feedsPmFrac;
  const totalFeeds = computedAmFeeds + computedPmFeeds;
  const totalMortality =
    (Number(mortalityAm) || 0) + (Number(mortalityPm) || 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (totalFeeds === 0 && totalMortality === 0) {
      return toast.error("Empty Submission", {
        description:
          "You must enter at least 1 dead bird or some feed consumption to save.",
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    }

    if (totalFeeds > 0 && !feedType) {
      return toast.error("Please select the Feed Type being consumed.");
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("feedType", feedType);
    formData.set("mortalityAm", String(Number(mortalityAm) || 0));
    formData.set("mortalityPm", String(Number(mortalityPm) || 0));
    formData.set("feedsConsumedAm", String(computedAmFeeds));
    formData.set("feedsConsumedPm", String(computedPmFeeds));

    const result = await updateDailyRecord(record.id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Record updated successfully");
      setIsOpen(false);

      const params = new URLSearchParams(searchParams.toString());
      params.set("newId", String(record.id));
      router.push(`?${params.toString()}`, { scroll: false });
    }
    setLoading(false);
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>

          <TooltipContent side="top">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Edit Record
            </p>
          </TooltipContent>

          {/* ---> THE UI FIX: Forced sm:max-w-4xl to stretch the modal <--- */}
          <DialogContent className="sm:max-w-4xl w-[95vw] rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl">
            {/* HEADER */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Pencil className="w-6 h-6" /> Edit Daily Log
                </DialogTitle>
                <p className="text-blue-100 font-medium text-xs mt-1 uppercase tracking-widest">
                  {record.buildingName} • {record.loadName || "Unnamed Batch"} •{" "}
                  {format(
                    new Date(record.recordDate || record.date),
                    "MMM d, yyyy",
                  )}
                </p>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[80vh]">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                id={`editForm-${record.id}`}
              >
                <div className="grid md:grid-cols-12 gap-6 items-start">
                  {/* MORTALITY (Col Span 4) */}
                  <div className="md:col-span-4 bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-[2rem] p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.2em] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Mortality
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          AM
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={mortalityAm}
                          onChange={(e) => setMortalityAm(e.target.value)}
                          placeholder="0"
                          className="h-11 font-black bg-white dark:bg-slate-950 border-red-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          PM
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={mortalityPm}
                          onChange={(e) => setMortalityPm(e.target.value)}
                          placeholder="0"
                          className="h-11 font-black bg-white dark:bg-slate-950 border-red-200"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200/50">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Total Dead
                      </span>
                      <span className="text-2xl font-black">
                        {totalMortality}
                      </span>
                    </div>
                  </div>

                  {/* FEEDS (Col Span 8) */}
                  <div className="md:col-span-8 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] p-6 space-y-5">
                    <div className="flex justify-between items-center pb-2 border-b border-amber-200/30">
                      <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] flex items-center gap-2">
                        <Warehouse className="w-3.5 h-3.5" /> Feeds Eaten
                      </h4>
                      <Popover
                        open={openFeedType}
                        onOpenChange={setOpenFeedType}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] uppercase font-bold tracking-widest px-3 bg-white dark:bg-slate-950 border-amber-200"
                          >
                            {feedType || "Select Type"}{" "}
                            <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 z-200 w-48" align="end">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                {feedTypes.map((type) => (
                                  <CommandItem
                                    key={type}
                                    onSelect={() => {
                                      setFeedType(type);
                                      setOpenFeedType(false);
                                    }}
                                    className="text-xs font-bold cursor-pointer uppercase flex justify-between py-2.5"
                                  >
                                    <span>{type}</span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        feedType === type
                                          ? "opacity-100 text-amber-600"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                      {/* AM FRACTION UI */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">
                          AM Usage
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={feedsAmWhole}
                          onChange={(e) => setFeedsAmWhole(e.target.value)}
                          placeholder="0"
                          className="h-11 font-black bg-white dark:bg-slate-950 border-amber-200 w-full"
                          disabled={!feedType}
                        />
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          <Button
                            type="button"
                            variant={feedsAmFrac === 0 ? "default" : "outline"}
                            onClick={() => setFeedsAmFrac(0)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsAmFrac === 0 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            .0
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsAmFrac === 0.25 ? "default" : "outline"
                            }
                            onClick={() => setFeedsAmFrac(0.25)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsAmFrac === 0.25 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ¼
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsAmFrac === 0.5 ? "default" : "outline"
                            }
                            onClick={() => setFeedsAmFrac(0.5)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsAmFrac === 0.5 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ½
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsAmFrac === 0.75 ? "default" : "outline"
                            }
                            onClick={() => setFeedsAmFrac(0.75)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsAmFrac === 0.75 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ¾
                          </Button>
                        </div>
                      </div>

                      {/* PM FRACTION UI */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">
                          PM Usage
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={feedsPmWhole}
                          onChange={(e) => setFeedsPmWhole(e.target.value)}
                          placeholder="0"
                          className="h-11 font-black bg-white dark:bg-slate-950 border-amber-200 w-full"
                          disabled={!feedType}
                        />
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          <Button
                            type="button"
                            variant={feedsPmFrac === 0 ? "default" : "outline"}
                            onClick={() => setFeedsPmFrac(0)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsPmFrac === 0 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            .0
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsPmFrac === 0.25 ? "default" : "outline"
                            }
                            onClick={() => setFeedsPmFrac(0.25)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsPmFrac === 0.25 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ¼
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsPmFrac === 0.5 ? "default" : "outline"
                            }
                            onClick={() => setFeedsPmFrac(0.5)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsPmFrac === 0.5 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ½
                          </Button>
                          <Button
                            type="button"
                            variant={
                              feedsPmFrac === 0.75 ? "default" : "outline"
                            }
                            onClick={() => setFeedsPmFrac(0.75)}
                            className={cn(
                              "h-9 text-xs font-black px-0",
                              feedsPmFrac === 0.75 &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            disabled={!feedType}
                          >
                            ¾
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* LIVE COST ESTIMATOR */}
                    <div className="flex justify-between items-center p-4 rounded-2xl transition-colors border bg-amber-100/50 dark:bg-amber-900/20 border-amber-200/50 text-amber-700 dark:text-amber-500">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Total Sacks Consumed
                        </span>
                      </div>
                      <span className="text-2xl font-black flex items-center gap-2">
                        {totalFeeds}
                      </span>
                    </div>
                  </div>
                </div>

                {/* REMARKS */}
                <div className="space-y-1.5 mt-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Remarks (Optional)
                  </label>
                  <Textarea
                    name="remarks"
                    defaultValue={record.remarks || ""}
                    placeholder="Update notes about this record..."
                    rows={2}
                    className="rounded-2xl resize-none bg-slate-50 dark:bg-slate-900 border-border/50"
                  />
                </div>
              </form>
            </div>

            {/* LOCKED FOOTER */}
            <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
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
                form={`editForm-${record.id}`}
                disabled={loading}
                className="h-11 px-8 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}{" "}
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Tooltip>
    </TooltipProvider>
  );
}
