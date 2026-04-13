"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  Timer,
  ArrowRight,
  CalendarCheck,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import EditLoadModal from "./EditLoadModal";
import LogHarvestModal from "./LogHarvestModal";
import AddMoreChicksModal from "./AddMoreChicksModal";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, FileText } from "lucide-react";
import ViewHistoryModal from "./ViewHistoryModal";

export default function LoadCard({ load }: { load: any }) {
  const searchParams = useSearchParams();
  const [justEdited, setJustEdited] = useState(false);

  // MODAL STATES
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const newId = searchParams.get("newId");
    if (newId && Number(newId) === load.id) {
      setJustEdited(true);
      const timer = setTimeout(() => {
        setJustEdited(false);
        const url = new URL(window.location.href);
        url.searchParams.delete("newId");
        window.history.replaceState({}, "", url.toString());
      }, 3000);
      return () => {
        clearTimeout(timer);
        setJustEdited(false);
      };
    } else {
      setJustEdited(false);
    }
  }, [searchParams, load.id]);

  const loadDateObj = new Date(load.loadDate);
  const harvestDateObj = load.harvestDate ? new Date(load.harvestDate) : null;
  const today = new Date();

  // ---> CALCULATE AGE <---
  const diffTime = today.getTime() - loadDateObj.getTime();
  const ageInDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // ---> SMART BADGE LOGIC (Assuming 120 Days / 4 Months cycle) <---
  const targetDays = 120;
  const isReadyForHarvest = ageInDays >= targetDays;
  const isApproachingHarvest = ageInDays >= targetDays - 14; // Approaching in 2 weeks

  const hasCapital = Number(load.initialCapital) > 0;

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className={cn(
        "bg-card border rounded-lg transition-all duration-500 group flex flex-col lg:flex-row overflow-hidden",
        justEdited
          ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20 scale-[1.02] z-10"
          : "border-border/60 hover:shadow-md shadow-sm",
      )}
    >
      {/* 1. LEFT SECTION */}
      <div className="p-5 lg:p-6 lg:w-[30%] bg-slate-50/50 dark:bg-slate-900/30 border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col justify-center gap-3.5">
        {/* ---> THE FIX: Added flex-wrap and items-start to handle long badge text gracefully <--- */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <h3 className="text-2xl sm:text-[18px] font-black uppercase tracking-tight text-foreground leading-none truncate">
            {load.buildingName}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Active
            </span>

            {/* ---> DYNAMIC AGE BADGE <--- */}
            <div
              className={cn(
                "px-3 py-1 rounded-md flex items-center gap-1 shadow-sm shrink-0 transition-colors",
                isReadyForHarvest
                  ? "bg-red-600 text-white animate-pulse" // Red if 120+ days
                  : isApproachingHarvest
                    ? "bg-amber-500 text-white" // Amber if close (106-119 days)
                    : "bg-blue-600 text-white", // Blue normally
              )}
            >
              {isReadyForHarvest ? (
                <AlertTriangle className="w-4 h-4 opacity-90 shrink-0" />
              ) : (
                <Timer className="w-4 h-4 opacity-90 shrink-0" />
              )}
              <span className="font-black text-xs sm:text-xs tracking-widest whitespace-nowrap uppercase">
                {isReadyForHarvest ? "READY TO HARVEST" : `Day ${ageInDays}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-border/50 px-3 py-1.5 rounded-lg w-fit shadow-sm mt-0.5 max-w-full overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
            Batch Name:
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
            {load.name || "UNNAMED BATCH"}
          </span>
        </div>

        <div className="flex flex-col gap-2.5 mt-1">
          <div className="flex items-center gap-1.5">
            <Image
              src="/hen.svg"
              alt="Hen"
              width={16}
              height={16}
              className="object-contain dark:invert opacity-70 shrink-0"
            />
            <p className="text-[11px] xl:text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest truncate">
              {load.chickType || "Standard Breed"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] xl:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {format(loadDateObj, "MMM d, yyyy")}
              </span>
            </div>
            {harvestDateObj && (
              <>
                <ArrowRight className="w-3 h-3 opacity-50 shrink-0 hidden sm:block" />
                <div
                  className={cn(
                    "flex items-center gap-1",
                    isReadyForHarvest
                      ? "text-red-600 dark:text-red-500 font-black" // Highlights harvest date if ready
                      : "text-emerald-600/70 dark:text-emerald-500/70",
                  )}
                >
                  <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {format(harvestDateObj, "MMM d, yyyy")}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION */}
      <div className="p-4 lg:p-6 lg:w-[40%] flex flex-col justify-center">
        <div className="flex flex-row justify-between divide-x divide-border/50">
          <div className="flex flex-col items-center justify-center flex-1 px-1 sm:px-2">
            <span className="text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 text-center">
              Start Qty
            </span>
            <span className="text-lg sm:text-xl font-black text-foreground whitespace-nowrap leading-none">
              {load.quantity?.toLocaleString() || 0}
            </span>
            {/* ---> NEW: Show Paid vs Free Breakdown <--- */}
            {Number(load.allowanceQuantity) > 0 && (
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider text-center">
                {load.paidQuantity?.toLocaleString()}{" "}
                <span className="text-blue-500">Paid</span>
                <br />
                {load.allowanceQuantity?.toLocaleString()}{" "}
                <span className="text-amber-500">Allowance</span>
              </span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-1 sm:px-2">
            <span className="text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1 text-center">
              Harvested
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-500 whitespace-nowrap">
              {load.harvested?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-1 sm:px-2">
            <span className="text-[9px] xl:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 text-center">
              Remaining
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {(load.remaining ?? load.quantity)?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT SECTION */}
      <div className="p-5 lg:p-6 lg:w-[30%] bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col justify-center gap-4">
        {/* CAPITAL & DROPDOWN WRAPPER */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm relative pr-10">
          <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Total Capital
            </p>
            {hasCapital ? (
              <p className="text-base sm:text-[15px] font-black text-foreground truncate">
                {formatMoney(Number(load.initialCapital))}
              </p>
            ) : (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                Pending Entry
              </span>
            )}
          </div>

          {/* ---> THE NEW THREE DOTS MENU <--- */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-slate-400 hover:text-slate-600  dark:hover:bg-slate-800 rounded-full transition-colors outline-none">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl p-1.5 border-border/50 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => setIsHistoryOpen(true)}
                  className="font-bold cursor-pointer rounded-lg py-2.5"
                >
                  <FileText className="w-4 h-4 mr-2 text-blue-600" /> View
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsEditOpen(true)}
                  className="font-bold cursor-pointer rounded-lg py-2.5"
                >
                  <Edit2 className="w-4 h-4 mr-2 text-slate-500" /> Edit Load
                  Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <AddMoreChicksModal load={load} />
          <LogHarvestModal load={load} />
        </div>

        {/* ---> MODALS RENDERED INVISIBLY HERE <--- */}
        <EditLoadModal
          load={load}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setJustEdited(true);
            setTimeout(() => setJustEdited(false), 3000);
          }}
        />

        <ViewHistoryModal
          load={load}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
      </div>
    </div>
  );
}
