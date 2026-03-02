"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFarm, deleteBuilding } from "./actions";

// SHADCN UI
import { Button } from "@/components/ui/button";
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

interface DeleteProps {
  id: number;
  name: string;
  type: "farm" | "building";
}

export default function DeleteAlertButton({ id, name, type }: DeleteProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);

    // Call the correct action based on what we are deleting
    const result =
      type === "farm" ? await deleteFarm(id) : await deleteBuilding(id);

    if (result.error) {
      toast.error("Deletion Blocked", {
        description: result.error,
        style: { backgroundColor: "red", color: "white", border: "none" },
      });
    } else {
      toast.success("Successfully Deleted", {
        description: `The ${type} "${name}" has been removed.`,
        style: { backgroundColor: "blue", color: "white", border: "none" },
      });
      setIsOpen(false);
    }

    setLoading(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {/* Subtle trash icon that turns red on hover */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="z-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the {type} <strong>{name}</strong> from
            the database. You cannot undo this action.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
