"use client";

import { useState, useEffect } from "react";
import { logHarvest, getLiveBirdCount } from "./actions"; // Make sure path matches!
import { Loader2, Truck, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LogHarvestModal({ load }: { load: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New States for the UX upgrades
  const [availableBirds, setAvailableBirds] = useState<number | null>(null);
  const [fetchingCount, setFetchingCount] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Fetch exactly how many birds are alive when the modal opens
  useEffect(() => {
    if (isOpen) {
      setFetchingCount(true);
      getLiveBirdCount(load.id).then((count) => {
        setAvailableBirds(count);
        setFetchingCount(false);
      });
    } else {
      // Reset everything 300ms after closing so the exit animation stays smooth
      setTimeout(() => setSuccessData(null), 300);
    }
  }, [isOpen, load.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("loadId", String(load.id));

    const result = await logHarvest(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      // Show the success summary screen instead of closing!
      setSuccessData(result);
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300 font-bold tracking-widest uppercase text-xs rounded-xl shadow-sm transition-all"
        >
          <Truck className="w-4 h-4 mr-2" /> Log Harvest
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
        {/* ======================================= */}
        {/* VIEW 1: THE SUCCESS SUMMARY SCREEN      */}
        {/* ======================================= */}
        {successData ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>

            <DialogTitle className="text-2xl font-black text-foreground mb-2">
              Harvest Successful!
            </DialogTitle>

            <p className="text-muted-foreground font-medium mb-6">
              You just successfully harvested{" "}
              <span className="font-black text-foreground">
                {successData.harvested.toLocaleString()}
              </span>{" "}
              birds from {load.buildingName}.
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-5 space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  Previous Available
                </span>
                <span className="text-foreground">
                  {successData.previousAvailable.toLocaleString()} birds
                </span>
              </div>

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-red-500 uppercase tracking-widest text-[10px]">
                  Just Harvested
                </span>
                <span className="text-red-600 dark:text-red-400">
                  - {successData.harvested.toLocaleString()} birds
                </span>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-between items-center text-base font-black">
                <span className="text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-[10px]">
                  Remaining Now
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {successData.remainingNow.toLocaleString()} birds
                </span>
              </div>
            </div>

            {successData.isClosed && (
              <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400 p-4 rounded-xl text-xs font-bold uppercase tracking-widest mb-6">
                Building is now empty & available
              </div>
            )}

            <Button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            >
              Got it, Close
            </Button>
          </div>
        ) : (
          /* ======================================= */
          /* VIEW 2: THE HARVEST INPUT FORM          */
          /* ======================================= */
          <>
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Truck className="w-6 h-6" /> Log Harvest Batch
                </DialogTitle>
                <p className="text-emerald-100 font-medium text-sm mt-1 uppercase tracking-widest">
                  {load.buildingName} • {load.farmName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
              {/* THE SMART INVENTORY DISPLAY */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Current Available
                  </span>
                </div>
                <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                  {fetchingCount ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `${availableBirds?.toLocaleString()} Birds`
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Date of Harvest *
                  </label>
                  <Input
                    type="date"
                    name="harvestDate"
                    required
                    className="h-11 rounded-xl font-bold bg-secondary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    Quantity Harvested *
                  </label>
                  <Input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    max={availableBirds || undefined} // Prevents typing more than what's available
                    placeholder="e.g. 1000"
                    className="h-11 rounded-xl font-black text-lg bg-emerald-50/50 border-emerald-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    Selling Price (₱) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    required
                    min="0"
                    placeholder="e.g. 180.50"
                    className="h-11 rounded-xl font-black text-lg bg-blue-50/50 border-blue-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    name="customerName"
                    placeholder="e.g. Otso Poultry"
                    className="h-11 rounded-xl font-bold bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Remarks
                </label>
                <Textarea
                  name="remarks"
                  placeholder="Notes about this specific batch..."
                  rows={2}
                  className="rounded-xl resize-none bg-secondary/50"
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  name="isFinalHarvest"
                  id="isFinalHarvest"
                  className="mt-1 w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="isFinalHarvest" className="cursor-pointer">
                  <span className="block text-sm font-black text-red-700 uppercase tracking-tight">
                    Final Harvest (Close Building)
                  </span>
                  <span className="block text-xs font-medium text-red-600/80 mt-0.5">
                    Check this if the building is now completely empty.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  disabled={loading || fetchingCount}
                  className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Harvest"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
