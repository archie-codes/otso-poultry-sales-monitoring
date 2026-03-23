"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SystemLogsClient({
  logs,
  totalPages,
  currentPage,
}: {
  logs: any[];
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
      {/* TABLE */}
      <div
        className={cn(
          "overflow-x-auto custom-scrollbar transition-opacity duration-300 min-h-[400px]",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Date & Time
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Event Type
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Activity Details
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-16 text-center text-muted-foreground font-semibold"
                >
                  No system logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                >
                  {/* DATE & TIME */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {format(new Date(log.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 ml-6">
                      {format(new Date(log.createdAt), "h:mm a")}
                    </div>
                  </td>

                  {/* EVENT TYPE */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" />
                      {log.type}
                    </span>
                  </td>

                  {/* DETAILS */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{log.title}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {log.message}
                    </p>
                  </td>

                  {/* READ / UNREAD STATUS */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {log.isRead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500">
                        <AlertCircle className="w-3.5 h-3.5" /> Unread
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="px-6 py-4 border-t border-border/50 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          Page {currentPage} / {totalPages || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="h-9 px-4 rounded-xl font-bold border-border hover:bg-slate-50 shadow-sm transition-all active:scale-95"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
