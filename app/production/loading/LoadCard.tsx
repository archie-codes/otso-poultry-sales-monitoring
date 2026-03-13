"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  Timer,
  ArrowRight,
  CalendarCheck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import EditLoadModal from "./EditLoadModal";
import LogHarvestModal from "./LogHarvestModal";

export default function LoadCard({ load }: { load: any }) {
  const searchParams = useSearchParams();

  // State to trigger the glowing effect
  const [justEdited, setJustEdited] = useState(false);

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
  const diffTime = Math.abs(today.getTime() - loadDateObj.getTime());
  const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const hasCapital = Number(load.initialCapital) > 0;

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className={cn(
        "bg-card border rounded-[2rem] transition-all duration-500 group flex flex-col lg:flex-row overflow-hidden",
        justEdited
          ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20 scale-[1.02] z-10"
          : "border-border/60 hover:shadow-md shadow-sm",
      )}
    >
      {/* 1. LEFT SECTION: Info & Identity (Takes 1/3 width on large screens) */}
      <div className="p-5 lg:p-6 lg:w-1/3 bg-slate-50/50 dark:bg-slate-900/30 border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col justify-center gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
            {load.buildingName}
          </h3>
          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Active
          </span>
          <div className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <Timer className="w-3 h-3 opacity-80 shrink-0" />
            <span className="font-black text-[10px] tracking-widest whitespace-nowrap uppercase">
              Day {ageInDays}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Image
            src="/hen.svg"
            alt="Hen"
            width={16}
            height={16}
            className="object-contain dark:invert opacity-70"
          />
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
            {load.chickType || "Standard Breed"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {loadDateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
            })}
          </div>
          {harvestDateObj && (
            <>
              <ArrowRight className="w-3 h-3 opacity-50" />
              <div className="flex items-center gap-1.5 text-emerald-600/70 dark:text-emerald-500/70">
                <CalendarCheck className="w-3.5 h-3.5" />
                {harvestDateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Core Math Grid (Takes 1/3 width) */}
      <div className="p-5 lg:p-6 lg:w-1/3 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border/50">
          <div className="flex flex-col items-center justify-center px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Start Qty
            </span>
            <span className="text-lg sm:text-xl font-black text-foreground">
              {load.quantity.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
              Harvested
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-500">
              {load.harvested?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center px-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl py-2 border border-blue-100 dark:border-blue-900/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 mb-1">
              Remaining
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400 leading-none">
              {load.remaining?.toLocaleString() ||
                load.quantity.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT SECTION: Finance & Actions (Takes 1/3 width) */}
      <div className="p-5 lg:p-6 lg:w-1/3 bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col justify-center gap-4">
        {/* Capital & Edit Box Wrapper */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm relative">
          <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Initial Capital
            </p>
            {hasCapital ? (
              <p className="text-lg font-black text-foreground truncate">
                {formatMoney(Number(load.initialCapital))}
              </p>
            ) : (
              <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-widest">
                Pending Entry
              </span>
            )}
          </div>

          {/* Edit Modal Button */}
          <div className="shrink-0 absolute right-3 top-1/2 -translate-y-1/2">
            <EditLoadModal
              load={load}
              onSuccess={() => {
                setJustEdited(true);
                setTimeout(() => setJustEdited(false), 3000);
              }}
            />
          </div>
        </div>

        {/* Log Harvest Modal */}
        <LogHarvestModal load={load} />
      </div>
    </div>
  );
}
