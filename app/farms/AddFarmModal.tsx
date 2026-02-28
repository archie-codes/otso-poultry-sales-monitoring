"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addFarm } from "./actions";
import { X, Loader2, Save, Tractor, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function AddFarmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addFarm(formData);

    if (result.error) {
      toast.error("Failed to add farm", { description: result.error });
    } else {
      toast.success("Farm Added!", {
        description: "The new farm location has been saved.",
      });
      setIsOpen(false);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-11 px-6 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground transition-all duration-300 shadow-sm hover:bg-primary/90 hover:-translate-y-0.5"
      >
        <Tractor className="w-5 h-5 mr-2" /> Add New Farm
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="fixed z-101 w-full max-w-lg border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <MapPin className="text-primary w-6 h-6" /> Add Farm
                    Location
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register a new physical farm area.
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
                  <label className="text-sm font-semibold">Farm Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Farm 1"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Province</label>
                    <input
                      type="text"
                      name="province"
                      required
                      placeholder="e.g., Pampanga"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      City / Municipality
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="e.g., San Fernando"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Barangay</label>
                  <input
                    type="text"
                    name="barangay"
                    required
                    placeholder="e.g., San Agustin"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
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
                        <Save className="w-4 h-4 mr-2 inline" /> Save Farm
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
