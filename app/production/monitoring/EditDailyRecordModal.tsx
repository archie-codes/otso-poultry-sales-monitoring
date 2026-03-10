"use client";

import { useState } from "react";
import { updateDailyRecord } from "./actions";
import { X, Loader2, Save, Pencil, ChevronDown, Package } from "lucide-react";
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

const feedTypes = ["BOOSTER", "STARTER", "GROWER", "FINISHER"];

export default function EditDailyRecordModal({ record }: { record: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // NEW: State for Feed Type
  const [feedType, setFeedType] = useState(record.feedType || "");
  const [openFeedType, setOpenFeedType] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Ensure the selected feedType is included in the submission
    formData.set("feedType", feedType);

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

          <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl">
            <div className="bg-blue-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Pencil className="w-6 h-6" /> Edit Daily Log
                </DialogTitle>
                <p className="text-blue-100 font-medium text-sm mt-1 uppercase tracking-widest">
                  {record.buildingName} •{" "}
                  {format(
                    new Date(record.recordDate || record.date),
                    "MMM d, yyyy",
                  )}
                </p>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
              {/* PRIMARY INPUTS GRID */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Mortality (Head)
                  </label>
                  <Input
                    type="number"
                    name="mortality"
                    defaultValue={Number(record.mortality)}
                    min="0"
                    className="h-11 rounded-xl bg-background font-black text-lg border-red-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Sacks (Consumption)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    name="feedsConsumed"
                    defaultValue={Number(record.feeds || record.feedsConsumed)}
                    min="0"
                    className="h-11 rounded-xl bg-background font-black text-lg border-amber-100"
                  />
                </div>
              </div>

              {/* NEW: FEED TYPE DROPDOWN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Feed Type Used
                </label>
                <Popover open={openFeedType} onOpenChange={setOpenFeedType}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl justify-between bg-background border-input px-4 font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span>{feedType || "Select Type..."}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-200 shadow-xl">
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
                              className="py-3 font-bold"
                            >
                              {type}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Remarks / Notes
                </label>
                <Textarea
                  name="remarks"
                  defaultValue={record.remarks || ""}
                  placeholder="Update notes about today's activity..."
                  rows={3}
                  className="rounded-xl bg-background resize-none border-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-10 h-11 shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Tooltip>
    </TooltipProvider>
  );
}
