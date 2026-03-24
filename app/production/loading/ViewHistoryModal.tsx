"use client";

import { useEffect, useState } from "react";
import { getLoadTimeline } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  FileText,
  Truck,
  Activity,
  PlusCircle,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ViewHistoryModal({
  load,
  isOpen,
  onClose,
}: {
  load: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getLoadTimeline(load.id).then((data) => {
        setTimeline(data);
        setLoading(false);
      });
    }
  }, [isOpen, load.id]);

  // ---> EXPORT TO EXCEL (CSV) LOGIC <---
  const handleExport = () => {
    let csvContent = "Date,Type,Title,Details\n";

    timeline.forEach((item) => {
      // Escape commas in descriptions so it doesn't break the Excel columns
      const safeDescription = `"${item.description.replace(/"/g, '""')}"`;
      csvContent += `${item.date},${item.type},${item.title},${safeDescription}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${load.name}_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (type: string) => {
    if (type === "INITIAL_LOAD")
      return <Package className="w-4 h-4 text-purple-600" />;
    if (type === "HARVEST")
      return <Truck className="w-4 h-4 text-emerald-600" />;
    if (type === "TOP_UP")
      return <PlusCircle className="w-4 h-4 text-blue-600" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
        {/* HEADER */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-border/50 p-6 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Batch History
            </DialogTitle>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {load.buildingName} • {load.name}
            </p>
          </div>
          {/* <Button
            onClick={handleExport}
            disabled={loading || timeline.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button> */}
        </div>

        {/* TIMELINE BODY - FIXED HEIGHT FOR 3 ITEMS */}
        {/* max-h-[380px] perfectly fits ~3 items. Any more will trigger the scrollbar! */}
        <div className="p-6 md:p-8 max-h-[380px] overflow-y-auto overflow-x-hidden bg-card scroll-smooth pr-4 md:pr-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-widest">
                Fetching records...
              </p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold uppercase tracking-widest opacity-50">
              No history recorded yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-8 pb-4">
              {timeline.map((item) => (
                <div key={item.id} className="relative pl-8 md:pl-10 group">
                  {/* The Timeline Dot */}
                  <div className="absolute -left-[21px] top-2 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 shadow-sm z-10 transition-transform group-hover:scale-110 duration-300">
                    {getIcon(item.type)}
                  </div>

                  {/* The Card Content */}
                  <div className="bg-white dark:bg-slate-900 border border-border/50 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-black text-sm text-foreground">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
