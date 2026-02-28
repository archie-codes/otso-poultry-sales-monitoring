"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addLoad } from "./actions";
import { X, Loader2, Save, Egg } from "lucide-react";
import { toast } from "sonner";

export default function AddLoadModal({
  availableBuildings,
}: {
  availableBuildings: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [loadDate, setLoadDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [harvestDate, setHarvestDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => setMounted(true), []);

  function handleLoadDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDateStr = e.target.value;
    setLoadDate(newDateStr);

    if (newDateStr) {
      const newDate = new Date(newDateStr);
      newDate.setMonth(newDate.getMonth() + 4);
      setHarvestDate(newDate.toISOString().split("T")[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addLoad(formData);

    if (result.error) {
      // Custom Red Toast for Errors
      toast.error("Error Loading Chicks", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      // Custom Blue Toast for Success
      toast.success("Chicks Loaded!", {
        description:
          "The building is now active and ready for daily monitoring.",
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-300"
      >
        <Egg className="w-5 h-5 mr-2" /> Load New Chicks
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed z-101 w-full max-w-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 pb-4 z-10 border-b border-border/50">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Load Chicks into Building
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up the initial capital and batch details.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Select Building <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="buildingId"
                    required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Choose an empty building --</option>
                    {availableBuildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.farmName} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Load Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="loadDate"
                      required
                      value={loadDate}
                      onChange={handleLoadDateChange}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Est. Harvest Date
                    </label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Type of Chick
                    </label>
                    <input
                      type="text"
                      name="chickType"
                      placeholder="e.g., Cobb 500"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      placeholder="Optional"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Actual Quantity Load{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="actualQuantityLoad"
                      required
                      placeholder="e.g., 10000"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* REMOVED: actualCostPerChick input has been completely removed */}

                  <div className="space-y-2">
                    {/* MODIFIED: sellingPrice is now optional */}
                    <label className="text-sm font-semibold">
                      Expected Selling Price (₱) (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="sellingPrice"
                      placeholder="e.g., 210.00"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Initial Capital (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="initialCapital"
                      placeholder="e.g., 500000.00"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
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
                    className="h-11 px-8 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />{" "}
                        Loading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" /> Save & Activate
                        Building
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
