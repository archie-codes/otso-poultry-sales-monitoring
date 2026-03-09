"use client";

import { useState } from "react";
import { updateDailyRecord } from "./actions";
import { X, Loader2, Save, Pencil } from "lucide-react";
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
import { useRouter, useSearchParams } from "next/navigation";

export default function EditDailyRecordModal({ record }: { record: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
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

          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-black text-blue-600 flex items-center gap-2">
                Edit Daily Log
              </DialogTitle>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                {record.buildingName} •{" "}
                {format(new Date(record.date), "MMM d, yyyy")}
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* CHANGED TO grid-cols-2 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                    Mortality
                  </label>
                  <Input
                    type="number"
                    name="mortality"
                    defaultValue={Number(record.mortality)}
                    min="0"
                    className="h-10 rounded-xl bg-background font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Sacks
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    name="feedsConsumed"
                    defaultValue={Number(record.feeds)}
                    min="0"
                    className="h-10 rounded-xl bg-background font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Remarks
                </label>
                <Textarea
                  name="remarks"
                  defaultValue={record.remarks || ""}
                  placeholder="Update notes..."
                  rows={3}
                  className="rounded-xl bg-background resize-none"
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
                  className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Update
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
