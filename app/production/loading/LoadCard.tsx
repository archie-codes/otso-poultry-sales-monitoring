"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Timer,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import Image from "next/image";
import henIcon from "@/public/hen.png";
import { cn } from "@/lib/utils";
import EditLoadModal from "./EditLoadModal";

const HenIcon = ({ className }: { className?: string }) => (
  <span className={`relative block shrink-0 ${className ?? ""}`}>
    <Image
      src={henIcon}
      alt="Hen"
      fill
      sizes="64px"
      className="object-contain"
    />
  </span>
);

export default function LoadCard({ load }: { load: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State to trigger the glowing effect
  const [justEdited, setJustEdited] = useState(false);

  // --- IMPROVED: RESET GLOW WHEN URL CHANGES OR TIMEOUT HITS ---
  useEffect(() => {
    const newId = searchParams.get("newId");

    if (newId && Number(newId) === load.id) {
      setJustEdited(true);

      const timer = setTimeout(() => {
        setJustEdited(false);
        // We use window.history.replaceState for a "silent" URL cleanup
        // that doesn't fight with the Next.js router state
        const url = new URL(window.location.href);
        url.searchParams.delete("newId");
        window.history.replaceState({}, "", url.toString());
      }, 3000); // Reduced to 3s for a snappier feel

      return () => {
        clearTimeout(timer);
        setJustEdited(false); // Force reset if component unmounts
      };
    } else {
      // If the ID is no longer in the URL, ensure the glow is OFF
      setJustEdited(false);
    }
  }, [searchParams, load.id]);

  const loadDateObj = new Date(load.loadDate);
  const harvestDateObj = load.harvestDate ? new Date(load.harvestDate) : null;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - loadDateObj.getTime());
  const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const hasCapital = Number(load.initialCapital) > 0;

  return (
    <div
      className={cn(
        "bg-card border rounded-3xl p-1 transition-all duration-500 group flex flex-col relative",
        // THE GLOWING EFFECT TRIGGER
        justEdited
          ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20 scale-[1.02] z-10"
          : "border-border/50 hover:shadow-lg shadow-sm",
      )}
    >
      {/* TOP SECTION: Timeline */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 relative">
        <div className="absolute -top-3 right-4 sm:-right-2 bg-blue-600 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-md flex items-center gap-1.5 group-hover:scale-105 group-hover:-translate-y-1 transition-all">
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 shrink-0" />
          <span className="font-black text-xs sm:text-sm tracking-tight whitespace-nowrap">
            DAY {ageInDays}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-0.5 sm:mb-1">
              Loaded
            </p>
            <p className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              <span className="truncate">
                {loadDateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })}
              </span>
            </p>
          </div>
          <div className="text-slate-300 dark:text-slate-600 flex justify-center shrink-0 px-1 sm:px-2">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0 text-right sm:text-left">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-0.5 sm:mb-1 text-right sm:text-left">
              Harvest
            </p>
            <p className="text-xs sm:text-sm font-black flex items-center justify-end sm:justify-start gap-1.5 text-slate-900 dark:text-white">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span className="truncate">
                {harvestDateObj
                  ? harvestDateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })
                  : "TBD"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Details */}
      <div className="p-4 sm:p-5 grow flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
            <HenIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="overflow-hidden text-left">
            <h3 className="font-bold text-base sm:text-lg leading-tight truncate text-foreground">
              {load.quantity.toLocaleString()} Chicks
            </h3>
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate uppercase tracking-tight mt-0.5">
              {load.farmName} - {load.buildingName}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Capital per Load
            </span>
            {hasCapital ? (
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₱
                {Number(load.initialCapital).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            ) : (
              <span className="w-fit text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                Pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 sm:flex">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                Active
              </span>
            </div>

            <div className="pl-3 border-l border-border/50">
              <EditLoadModal
                load={load}
                onSuccess={() => {
                  setJustEdited(true);
                  setTimeout(() => setJustEdited(false), 3000);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
