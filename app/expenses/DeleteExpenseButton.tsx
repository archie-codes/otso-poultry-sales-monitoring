"use client";

import { useState } from "react";
import { deleteExpense } from "./actions";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

export default function DeleteExpenseButton({ expense }: { expense: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Protect system-generated initial capital
  const isSystemGenerated = expense.type === "chick_purchase";

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteExpense(expense.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Expense deleted successfully.");
      setIsOpen(false);
      router.refresh();
    }
    setIsDeleting(false);
  };

  if (isSystemGenerated) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 text-slate-300 opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
              Cannot delete system load record
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Delete Record
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-6 border-red-100 shadow-2xl [&>button.absolute]:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex flex-col items-center text-center space-y-4 mt-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-black">
              Delete Expense?
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this{" "}
              <strong className="text-foreground">{expense.type}</strong>{" "}
              expense of{" "}
              <strong className="text-red-600">
                ₱
                {Number(expense.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
              ? This action cannot be undone.
            </p>
            <DialogFooter className="w-full flex sm:justify-between gap-3 pt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 font-bold"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-11 font-black"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}{" "}
                Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
