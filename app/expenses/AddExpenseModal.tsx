"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addExpense } from "./actions";
import { X, Loader2, Save, TrendingDown, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// SHADCN UI
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput"; // <-- NEW IMPORT

export default function AddExpenseModal({
  farms = [],
  activeLoads = [], // <-- This guarantees it will NEVER be undefined
}: {
  farms: any[];
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // States
  const [farmId, setFarmId] = useState("");
  const [loadId, setLoadId] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

  useEffect(() => setMounted(true), []);

  const availableLoads = activeLoads.filter(
    (load) => load.farmId === Number(farmId),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!farmId) {
      toast.error("Missing Field", { description: "Please select a farm." });
      return;
    }
    if (!loadId) {
      toast.error("Missing Field", {
        description: "Please select a target building or Shared.",
      });
      return;
    }
    if (!expenseType) {
      toast.error("Missing Field", {
        description: "Please select an expense category.",
      });
      return;
    }
    if (!expenseDate) {
      toast.error("Missing Field", { description: "Please select a date." });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("farmId", farmId);
    formData.set("loadId", loadId);
    formData.set("expenseType", expenseType);
    formData.set("expenseDate", format(expenseDate, "yyyy-MM-dd"));

    const result = await addExpense(formData);

    if (result.error) {
      toast.error("Error Saving Expense", { description: result.error });
    } else {
      toast.success("Expense Recorded!", {
        description: "The financial record has been saved.",
      });
      setIsOpen(false);
      setFarmId("");
      setLoadId("");
      setExpenseType("");
      setExpenseDate(new Date());
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm hover:-translate-y-0.5 transition-all duration-300"
      >
        <TrendingDown className="w-5 h-5 mr-2" /> Record Expense
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500 w-5 h-5" /> Log
                    Expense
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Record costs and distribute salary.
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Select Farm <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={farmId}
                      onValueChange={(val) => {
                        setFarmId(val);
                        setLoadId("");
                      }}
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                        <SelectValue placeholder="-- Farm --" />
                      </SelectTrigger>
                      <SelectContent className="z-200">
                        {farms.map((farm, index) => (
                          <SelectItem
                            key={`farm-${farm.id || index}`}
                            value={String(farm.id)}
                          >
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Date <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-11 rounded-xl justify-start text-left font-normal bg-background border-input focus:ring-red-500",
                            !expenseDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expenseDate ? (
                            format(expenseDate, "MMM d, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-200">
                        <Calendar
                          mode="single"
                          selected={expenseDate}
                          onSelect={setExpenseDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <label className="text-sm font-semibold">
                    Which building is this for?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={loadId}
                    onValueChange={setLoadId}
                    disabled={!farmId}
                  >
                    <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                      <SelectValue placeholder="-- Select Target --" />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      <SelectItem
                        value="shared"
                        className="font-bold text-primary focus:text-primary"
                      >
                        🏢 SHARED ACROSS ENTIRE FARM
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel>Direct to Specific Building:</SelectLabel>
                        {availableLoads.map((load, index) => (
                          <SelectItem
                            key={`load-${load.id || index}`}
                            value={String(load.id)}
                          >
                            {load.buildingName} (Active Flock)
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecting "Shared" will automatically divide the cost among
                    all active loads.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Type <span className="text-red-500">*</span>
                    </label>
                    <Select value={expenseType} onValueChange={setExpenseType}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input focus:ring-red-500">
                        <SelectValue placeholder="-- Category --" />
                      </SelectTrigger>
                      <SelectContent className="z-200">
                        <SelectItem value="labor">Labor / Salary</SelectItem>
                        <SelectItem value="feeds">Feeds</SelectItem>
                        <SelectItem value="medicine">
                          Medicine / Vaccines
                        </SelectItem>
                        <SelectItem value="electricity">Electricity</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="miscellaneous">
                          Miscellaneous
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Total Amount (₱) <span className="text-red-500">*</span>
                    </label>
                    {/* CHANGED TO FORMATTED NUMBER INPUT */}
                    <FormattedNumberInput
                      name="amount"
                      required
                      allowDecimals={true}
                      placeholder="10,000.00"
                      className="h-11 rounded-xl bg-background font-bold text-lg focus-visible:ring-red-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-border/50 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save Expense
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
