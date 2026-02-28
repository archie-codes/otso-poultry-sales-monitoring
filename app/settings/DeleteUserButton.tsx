"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { deleteUser } from "./actions";
import { toast } from "sonner";

export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDelete() {
    setIsDeleting(true);

    const result = await deleteUser(userId);

    if (result.error) {
      toast.error("Action Failed", {
        description: result.error,
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          borderColor: "#dc2626",
        },
      });
      setIsDeleting(false);
      setIsOpen(false);
    } else {
      toast.success("User Deleted", {
        description: `${userName} has been removed from the system.`,
        style: {
          backgroundColor: "#3b82f6",
          color: "white",
          borderColor: "#dc2626",
        },
      });
      // The component will unmount, no need to reset state
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title={`Delete ${userName}`}
        // CHANGED: text-red-500 for light mode, text-red-400 for dark mode by default
        className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200 cursor-pointer shrink-0"
      >
        <Trash2 className="w-[18px] h-[18px]" />
      </button>

      {/* Professional Modal Overlay - Teleported to the document body */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            {/* Modal Content Box */}
            <div className="fixed z-101 grid w-full max-w-md gap-4 border border-border/50 bg-background/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-2xl animate-in zoom-in-95 duration-200">
              {/* Header Area */}
              <div className="flex flex-col space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Delete Account
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Are you absolutely sure you want to delete{" "}
                  <strong>{userName}</strong>? This action cannot be undone and
                  will permanently remove their access to the system.
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-4">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsOpen(false)}
                  className="mt-2 sm:mt-0 h-10 px-5 py-2 inline-flex items-center justify-center rounded-xl text-sm font-semibold border border-input bg-secondary/50 hover:bg-secondary text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="h-10 px-5 py-2 inline-flex items-center justify-center rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm hover:shadow-[0_4px_14px_rgba(220,38,38,0.39)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-sm cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete User"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
