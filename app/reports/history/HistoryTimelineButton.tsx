"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import ViewHistoryModal from "../../production/loading/ViewHistoryModal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function HistoryTimelineButton({ load }: { load: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault(); // <--- This keeps the menu alive so the modal can open!
          setIsOpen(true);
        }}
        className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-600 w-full"
      >
        <Clock className="w-4 h-4" />
        View Timeline
      </DropdownMenuItem>

      <ViewHistoryModal
        load={load}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
