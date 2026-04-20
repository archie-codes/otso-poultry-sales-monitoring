"use client";

import { useState } from "react";
import { Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDailyRecord } from "./actions";
import { toast } from "sonner";
import EditDailyRecordModal from "./EditDailyRecordModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function RecordActions({
  record,
  userRole,
  activeLoads,
}: {
  record: any;
  userRole: string;
  activeLoads?: any[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = userRole === "owner";

  async function onDelete() {
    setIsDeleting(true);
    const result = await deleteDailyRecord(record.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Record deleted");
    }
    setIsDeleting(false);
  }

  if (!isOwner) {
    return (
      <div className="flex justify-end pr-2">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
          <Lock className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            Locked
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <EditDailyRecordModal record={record} activeLoads={activeLoads} />

      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <AlertDialog>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>

            <TooltipContent side="top">
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Delete Record
              </p>
            </TooltipContent>

            <AlertDialogContent className="rounded-3xl border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium">
                  This will permanently delete the daily log for{" "}
                  <span className="text-foreground font-bold block mt-2 mb-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/50 text-center">
                    {/* ---> THE FIX: Added Farm, Building, and Batch to the delete prompt! <--- */}
                    {record.farmName} • {record.buildingName} •{" "}
                    {record.loadName || `Load ${record.loadId}`}
                  </span>
                  This action cannot be undone and will automatically refund the
                  feeds and remove the expense.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl font-bold">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
                >
                  Delete Record
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
