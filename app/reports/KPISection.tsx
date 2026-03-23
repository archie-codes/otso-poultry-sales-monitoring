"use client";

import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  Warehouse,
  PhilippinePeso,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function KPISection({
  globalTotals,
  reports,
}: {
  globalTotals: any;
  reports: any[];
}) {
  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. GLOBAL NET SALES */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:scale-105 active:scale-95 hover:shadow-emerald-500/40 transition-all duration-300 bg-emerald-600 dark:bg-emerald-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-emerald-500/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <TrendingUp className="w-4 h-4" />
              <p className="text-[9px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-widest">
                Global Net Sales
              </p>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate">
              {formatMoney(globalTotals.totalNetSales)}
            </h3>
          </div>
        </DialogTrigger>
        <DialogContent className="rounded-[2rem] max-w-lg border-border/50">
          <DialogHeader className="bg-emerald-50 dark:bg-emerald-950/30 -mx-6 -mt-6 p-6 border-b border-emerald-100 dark:border-emerald-900/50 rounded-t-[2rem]">
            <DialogTitle className="text-xl font-black text-emerald-700 dark:text-emerald-500 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Net Sales Breakdown
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 py-4 px-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl"
              >
                <div>
                  <p className="font-bold text-sm uppercase text-foreground">
                    {r.buildingName}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {r.farmName}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-black text-base",
                    r.totalNetSales >= 0 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {formatMoney(r.totalNetSales)}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. GLOBAL CAPITAL */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:scale-105 active:scale-95 hover:shadow-blue-500/40 transition-all duration-300 bg-blue-600 dark:bg-blue-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-blue-500/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <PhilippinePeso className="w-4 h-4" />
              <p className="text-[9px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-widest">
                Global Capital
              </p>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate">
              {formatMoney(globalTotals.totalCapital)}
            </h3>
          </div>
        </DialogTrigger>
        <DialogContent className="rounded-[2rem] max-w-lg border-border/50">
          <DialogHeader className="bg-blue-50 dark:bg-blue-950/30 -mx-6 -mt-6 p-6 border-b border-blue-100 dark:border-blue-900/50 rounded-t-[2rem]">
            <DialogTitle className="text-xl font-black text-blue-700 dark:text-blue-500 flex items-center gap-2">
              <PhilippinePeso className="w-6 h-6" /> Deployed Capital
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 py-4 px-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl"
              >
                <div>
                  <p className="font-bold text-sm uppercase text-foreground">
                    {r.buildingName}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {r.farmName}
                  </p>
                </div>
                <p className="font-black text-base text-blue-600 dark:text-blue-400">
                  {formatMoney(Number(r.initialCapital))}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. LIVE BIRDS */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:scale-105 active:scale-95 hover:shadow-slate-500/40 transition-all duration-300 bg-slate-800 dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-slate-900/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <Activity className="w-4 h-4" />
              <p className="text-[9px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-widest">
                Live Birds
              </p>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate">
              {globalTotals.activeBirds.toLocaleString()}
            </h3>
          </div>
        </DialogTrigger>
        <DialogContent className="rounded-[2rem] max-w-lg border-border/50">
          <DialogHeader className="bg-slate-100 dark:bg-slate-900 -mx-6 -mt-6 p-6 border-b border-border/50 rounded-t-[2rem]">
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Warehouse className="w-6 h-6" /> Live Bird Locations
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 py-4 px-2">
            {reports
              .filter((r) => r.isActive)
              .map((r) => {
                const liveCount =
                  r.quantity - r.farmMortality - r.actualHarvest;
                return (
                  <div
                    key={r.id}
                    className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl border border-border/50"
                  >
                    <div>
                      <p className="font-bold text-sm uppercase text-foreground">
                        {r.buildingName}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Started w/ {r.quantity.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-foreground">
                        {Math.max(0, liveCount).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest">
                        Alive
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. TOTAL MORTALITY */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer hover:scale-105 active:scale-95 hover:shadow-red-500/40 transition-all duration-300 bg-red-600 dark:bg-red-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg shadow-red-500/20 text-white flex flex-col justify-between">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-[9px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-widest">
                Total Mortality
              </p>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate">
              {globalTotals.totalMortality.toLocaleString()}
            </h3>
          </div>
        </DialogTrigger>
        <DialogContent className="rounded-[2rem] max-w-lg border-border/50">
          <DialogHeader className="bg-red-50 dark:bg-red-950/30 -mx-6 -mt-6 p-6 border-b border-red-100 dark:border-red-900/50 rounded-t-[2rem]">
            <DialogTitle className="text-xl font-black text-red-700 dark:text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> Mortality Report
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3 py-4 px-2">
            {reports
              .filter((r) => r.farmMortality > 0)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl"
                >
                  <div>
                    <p className="font-bold text-sm uppercase text-foreground">
                      {r.buildingName}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {r.farmName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-base text-red-600 dark:text-red-400">
                      {r.farmMortality.toLocaleString()} Dead
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      {((r.farmMortality / r.quantity) * 100).toFixed(1)}% of
                      flock
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
