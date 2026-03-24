"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addBuilding } from "./actions";
import { X, Loader2, Save, Building2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AddBuildingModal({
  farmId,
  farmName,
}: {
  farmId: number;
  farmName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("farmId", String(farmId));

    const result = await addBuilding(formData);

    if (result.error) {
      toast.error("Failed to add building", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Building Added!", {
        description: `New building added to ${farmName}.`,
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
        className="text-sm font-semibold text-white hover:text-white flex items-center transition-colors px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-1" /> Add Building
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="fixed z-101 w-full max-w-md border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Building2 className="text-emerald-500 w-5 h-5" /> Add
                    Building
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a structure to {farmName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Building Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Building A"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary uppercase"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" /> Save Building
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
