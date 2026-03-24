"use client";

import { useState } from "react";
import { addMoreChicksToLoad } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader2,
  PlusCircle,
  CalendarIcon,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { useRouter } from "next/navigation";

export default function AddMoreChicksModal({ load }: { load: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dateAdded, setDateAdded] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [quantityInput, setQuantityInput] = useState("");
  const [pricePerChickInput, setPricePerChickInput] = useState("");

  const cleanQuantity = Number(quantityInput.replace(/,/g, "")) || 0;
  const cleanPricePerChick = Number(pricePerChickInput.replace(/,/g, "")) || 0;
  const computedAddedCapital = cleanQuantity * cleanPricePerChick;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!dateAdded || cleanQuantity <= 0 || cleanPricePerChick <= 0) {
      toast.error("Please fill in valid numbers and a date.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("loadId", String(load.id));
    formData.set("addedQuantity", String(cleanQuantity));
    formData.set("newPricePerChick", String(cleanPricePerChick));
    formData.set("addedCapital", String(computedAddedCapital));
    formData.set("dateAdded", format(dateAdded, "yyyy-MM-dd"));

    const result = await addMoreChicksToLoad(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Chicks Added!", {
        description: "Inventory and Capital have been updated.",
      });
      setIsOpen(false);
      setQuantityInput("");
      setPricePerChickInput("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 font-bold tracking-widest uppercase text-xs rounded-xl shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Top-Up Chicks
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl">
        <div className="bg-blue-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <PlusCircle className="w-6 h-6" /> Add More Chicks
            </DialogTitle>
            <p className="text-blue-100 font-medium text-xs mt-1 uppercase tracking-widest">
              Adding to: {load.buildingName} • {load.name}
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-card">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Delivery Date *
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl justify-between border-input font-normal px-4"
                >
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {dateAdded ? format(dateAdded, "MMM d, yyyy") : "Pick date"}
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-200">
                <Calendar
                  mode="single"
                  selected={dateAdded}
                  onSelect={(date) => {
                    setDateAdded(date);
                    setIsCalendarOpen(false); // Auto close
                  }}
                  disabled={(date) => date > new Date()} // Block Future Dates!
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="space-y-1.5"
              onKeyUp={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.value !== undefined) setQuantityInput(target.value);
              }}
            >
              <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                Quantity Added *
              </label>
              <FormattedNumberInput
                name="displayQty"
                required
                placeholder="e.g. 5,000"
                className="h-11 rounded-xl bg-blue-50/50 border-blue-200 font-black text-lg"
              />
            </div>
            <div
              className="space-y-1.5"
              onKeyUp={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.value !== undefined)
                  setPricePerChickInput(target.value);
              }}
            >
              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                New Price/Chick (₱) *
              </label>
              <FormattedNumberInput
                name="displayPrice"
                required
                allowDecimals
                placeholder="e.g. 70.00"
                className="h-11 rounded-xl bg-emerald-50/50 border-emerald-200 font-black text-lg"
              />
            </div>
          </div>

          {/* VISUAL TOTAL CAPITAL DISPLAY */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-border/50 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Additional Cost
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {cleanQuantity > 0 && cleanPricePerChick > 0
                    ? `${cleanQuantity.toLocaleString()} birds × ₱${cleanPricePerChick.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : "Enter details"}
                </p>
              </div>
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              ₱
              {computedAddedCapital.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl h-11 px-6 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || computedAddedCapital <= 0}
              className="rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              Save Top-Up
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
