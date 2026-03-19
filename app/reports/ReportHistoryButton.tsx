"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FileText } from "lucide-react";
// We reuse the exact same modal from the production folder!
import ViewHistoryModal from "../production/loading/ViewHistoryModal";

export default function ReportHistoryButton({ load }: { load: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none">
            <MoreVertical className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl p-1.5 border-border/50 shadow-xl"
        >
          <DropdownMenuItem
            onClick={() => setIsOpen(true)}
            className="font-bold cursor-pointer rounded-lg py-2.5"
          >
            <FileText className="w-4 h-4 mr-2 text-blue-600" /> View History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewHistoryModal
        load={load}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
