"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addExpense } from "./actions";
import { X, Loader2, Save, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function AddExpenseModal({
  farms,
  activeLoads,
}: {
  farms: any[];
  activeLoads: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedFarmId, setSelectedFarmId] = useState("");

  useEffect(() => setMounted(true), []);

  // Filter the loads so it only shows buildings for the specifically selected farm
  const availableLoads = activeLoads.filter(
    (load) => load.farmId === Number(selectedFarmId),
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addExpense(formData);

    if (result.error) {
      toast.error("Error Saving Expense", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Expense Recorded!", {
        description: "The financial record has been saved.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
      setSelectedFarmId(""); // Reset the dropdown
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-red-600 text-white shadow-sm hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-300"
      >
        <TrendingDown className="w-5 h-5 mr-2" /> Record Expense
      </button>

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
                    <select
                      name="farmId"
                      required
                      value={selectedFarmId}
                      onChange={(e) => setSelectedFarmId(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">-- Choose Farm --</option>
                      {farms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expenseDate"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* THE SALARY SPLITTER LOGIC */}
                <div className="space-y-2 p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <label className="text-sm font-semibold">
                    Which building is this for?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="loadId"
                    required
                    disabled={!selectedFarmId}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <option value="">-- Select Target --</option>

                    {/* Option 1: Shared Cost */}
                    <option
                      value="shared"
                      className="font-bold text-primary bg-primary/10"
                    >
                      🏢 SHARED ACROSS ENTIRE FARM (E.g., Salary)
                    </option>

                    {/* Option 2: Direct Cost */}
                    <optgroup label="Direct to Specific Building:">
                      {availableLoads.map((load) => (
                        <option key={load.id} value={load.id}>
                          {load.buildingName} (Active Flock)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecting "Shared" will automatically divide the cost among
                    all active loads during reporting.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Expense Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="expenseType"
                      required
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">-- Category --</option>
                      <option value="labor">Labor / Salary</option>
                      <option value="feeds">Feeds</option>
                      <option value="medicine">Medicine / Vaccines</option>
                      <option value="electricity">Electricity</option>
                      <option value="water">Water</option>
                      <option value="fuel">Fuel</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Total Amount (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="0.00"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-11 px-6 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-8 rounded-xl text-sm font-bold bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" /> Save Expense
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
