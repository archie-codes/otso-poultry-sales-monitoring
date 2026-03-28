"use client";

import { useState } from "react";
import { updateExpense } from "./actions";
import {
  X,
  Loader2,
  Save,
  Pencil,
  ChevronDown,
  CalendarIcon,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

export default function EditExpenseModal({
  expense,
  loads = [],
}: {
  expense: any;
  loads?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(
    new Date(expense.date),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const router = useRouter();

  // Protect system-generated expenses
  const isSystemGenerated = expense.type === "chick_purchase";

  // ---> DATE BOUNDARY LOGIC <---
  const targetLoad = loads.find((l) => String(l.id) === String(expense.loadId));

  let minValidDate: Date | null = null;
  let maxValidDate: Date = new Date(); // Defaults to today
  maxValidDate.setHours(23, 59, 59, 999);

  if (targetLoad) {
    if (targetLoad.loadDate) {
      minValidDate = new Date(targetLoad.loadDate);
      minValidDate.setHours(0, 0, 0, 0);
    }
    // If the load is already closed/harvested, cap the max date to the harvest date
    if (targetLoad.harvestDate && targetLoad.isActive === false) {
      maxValidDate = new Date(targetLoad.harvestDate);
      maxValidDate.setHours(23, 59, 59, 999);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!expenseDate) {
      return toast.error("Expense Date is required.");
    }

    // Safety check on submit just in case
    const checkTime = expenseDate.getTime();
    if (minValidDate && checkTime < minValidDate.getTime()) {
      return toast.error(
        `Date cannot be before ${format(minValidDate, "MMM d, yyyy")}`,
      );
    }
    if (checkTime > maxValidDate.getTime()) {
      return toast.error(
        `Date cannot be after ${format(maxValidDate, "MMM d, yyyy")}`,
      );
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("expenseDate", format(expenseDate, "yyyy-MM-dd"));

    const rawAmount = formData.get("amount") as string;
    if (rawAmount) formData.set("amount", rawAmount.replace(/,/g, ""));

    const result = await updateExpense(expense.id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Expense updated successfully");
      setIsOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  // ---> LOCK THE EDIT BUTTON FOR SYSTEM GENERATED LOADS <---
  if (isSystemGenerated) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 text-slate-300 opacity-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Edit this batch in the Production Hub
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Edit Expense
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl [&>button.absolute]:hidden">
          <div className="bg-blue-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Pencil className="w-6 h-6" /> Edit Record
              </DialogTitle>
              <p className="text-blue-100 font-medium text-xs mt-1 uppercase tracking-widest">
                {expense.farmName} • {expense.type}
              </p>
            </DialogHeader>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 rounded-xl justify-between border-input font-bold px-3 shadow-sm",
                      !expenseDate && "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70 shrink-0" />
                      <span className="truncate">
                        {expenseDate
                          ? format(expenseDate, "MMM d, yyyy")
                          : "Pick date"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-200" align="start">
                  <Calendar
                    mode="single"
                    selected={expenseDate}
                    defaultMonth={expenseDate || new Date()}
                    captionLayout="dropdown"
                    fromYear={minValidDate ? minValidDate.getFullYear() : 2020}
                    toYear={new Date().getFullYear()}
                    onSelect={(date) => {
                      setExpenseDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => {
                      // ---> THE FIX: STRICT DATE BOUNDARIES <---
                      const d = date.getTime();
                      const today = new Date().setHours(23, 59, 59, 999);

                      if (d > today) return true; // Always block future
                      if (minValidDate && d < minValidDate.getTime())
                        return true; // Block before load date
                      if (maxValidDate && d > maxValidDate.getTime())
                        return true; // Block after harvest date

                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Show users what the valid range is */}
              {targetLoad && minValidDate && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                  Valid Range: {format(minValidDate, "MMM d, yy")} -{" "}
                  {format(maxValidDate, "MMM d, yy")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Amount (₱)
              </label>
              <FormattedNumberInput
                name="amount"
                required
                allowDecimals={true}
                defaultValue={expense.amount}
                className="h-12 rounded-xl bg-background font-black text-xl border-red-200 focus-visible:ring-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Details / Remarks
              </label>
              <Textarea
                name="remarks"
                defaultValue={expense.remarks || ""}
                rows={3}
                className="rounded-xl bg-secondary/30 resize-none border-border/50 text-xs font-bold uppercase"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="rounded-xl font-bold h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white px-8 h-11"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
