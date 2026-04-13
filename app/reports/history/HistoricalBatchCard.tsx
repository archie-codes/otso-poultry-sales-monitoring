"use client";

import Image from "next/image";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  MoreVertical,
  Download,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import HistoryTimelineButton from "./HistoryTimelineButton";

const formatMoney = (amount: number) =>
  `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMoneyPDF = (amount: number) =>
  `PHP ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HistoricalBatchCard({ batch }: { batch: any }) {
  // =========================================================================
  // THE ENTERPRISE PDF GENERATOR (LANDSCAPE)
  // =========================================================================
  const generatePDF = () => {
    // 1. SWITCH TO LANDSCAPE
    const doc = new jsPDF("landscape");
    const pageHeight = doc.internal.pageSize.height;

    const checkPageBreak = (currentY: number, requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        return 20;
      }
      return currentY;
    };

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Otso Poultry Farm", 14, 20);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("End-of-Flock Summary Report", 14, 28);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Farm: ${batch.farmName}`, 14, 38);
    doc.text(`Building: ${batch.buildingName}`, 14, 44);
    doc.text(`Load/Batch ID: ${batch.name || `Load ${batch.id}`}`, 14, 50);

    // 2. PUSH HEADER TEXT TO THE RIGHT (From x=120 to x=220)
    doc.text(`Load Date: ${batch.loadDateStr}`, 220, 38);
    doc.text(`Harvest Date: ${batch.actualHarvestDate}`, 220, 44);
    doc.text(`Total Age: ${batch.ageInDays} Days`, 220, 50);

    // 1. EXECUTIVE SUMMARY TABLE
    autoTable(doc, {
      startY: 55,
      head: [["Performance Metric", "Value", "Financial Metric", "Amount"]],
      body: [
        [
          "Total Chicks",
          batch.quantity.toLocaleString(),
          "Total Gross Cost",
          formatMoneyPDF(batch.totalGrossCost),
        ],
        [
          "Actual Harvest",
          batch.actualHarvest.toLocaleString(),
          "Total RTL Amount",
          formatMoneyPDF(batch.totalRtlAmount),
        ],
        [
          "Total Mortality",
          batch.farmMortality.toLocaleString(),
          "Avg Selling Price",
          formatMoneyPDF(batch.avgSellingPrice),
        ],
        [
          "Harvest Percentage",
          `${batch.percentHarvest.toFixed(1)}%`,
          "Actual Cost/Chick",
          formatMoneyPDF(batch.actualCostPerChick),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
      styles: { fontSize: 9 },
    });

    // NET SALES HIGHLIGHT
    let currentY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      batch.totalNetSales >= 0 ? 16 : 220,
      batch.totalNetSales >= 0 ? 185 : 38,
      batch.totalNetSales >= 0 ? 129 : 38,
    ); // Emerald or Red
    doc.text(
      `FINAL NET SALES: ${formatMoneyPDF(batch.totalNetSales)}`,
      14,
      currentY + 10,
    );
    doc.setTextColor(0, 0, 0); // Reset

    // 2. FEED EXPENSES TABLE
    currentY = checkPageBreak(currentY, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Feed Consumption Log", 14, currentY + 25);

    const feedRows = batch.pdfPayload.feeds.map((f: any) => [
      format(new Date(f.date), "MMM d, yyyy"),
      f.type,
      `${f.qty} Sacks`,
      formatMoneyPDF(f.cost),
    ]);

    autoTable(doc, {
      startY: currentY + 30,
      head: [["Date", "Feed Type", "Qty", "Calculated Cost"]],
      body:
        feedRows.length > 0 ? feedRows : [["No feeds logged", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] }, // Amber
      styles: { fontSize: 8, cellPadding: 2 },
      // 3. EXPANDED WIDTHS FOR LANDSCAPE (~265mm total usable width)
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 160 }, // Massive space for long feed names/remarks
        2: { cellWidth: 35 },
        3: { cellWidth: 40, halign: "right" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY;

    // 3. OTHER EXPENSES TABLE
    currentY = checkPageBreak(currentY, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Direct & Shared Expenses", 14, currentY + 15);

    // ---> NEW: Clean up the remarks for the PDF <---
    const expRows = batch.pdfPayload.expenses.map((e: any) => {
      let cleanRemarks = e.remarks ? e.remarks.replace(/[₱±]/g, "PHP ") : "-";
      cleanRemarks = cleanRemarks.replace(
        /\.\s*(Total (Loaded|Added):)/gi,
        ".\n$1",
      );

      return [
        format(new Date(e.date), "MMM d, yyyy"),
        e.type,
        cleanRemarks,
        formatMoneyPDF(e.amount),
      ];
    });

    autoTable(doc, {
      startY: currentY + 20,
      head: [["Date", "Expense Type", "Remarks", "Amount"]],
      body:
        expRows.length > 0 ? expRows : [["No expenses logged", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] }, // Blue
      styles: { fontSize: 8, cellPadding: 2 },
      // 3. EXPANDED WIDTHS FOR LANDSCAPE
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 155 }, // The Remarks column gets 155mm to stretch out!
        3: { cellWidth: 40, halign: "right" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY;

    // 4. MORTALITY LOG TABLE WITH AM & PM
    currentY = checkPageBreak(currentY, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Mortality Breakdown", 14, currentY + 15);

    const mortalityRows = (batch.pdfPayload.mortalityLog || []).map(
      (m: any) => [
        m.date ? format(new Date(m.date), "MMM d, yyyy") : "Unknown Date",
        m.am.toString(),
        m.pm.toString(),
        `${m.total} Heads`,
        m.remarks,
      ],
    );

    autoTable(doc, {
      startY: currentY + 20,
      head: [["Date", "AM", "PM", "Total", "Remarks"]],
      body:
        mortalityRows.length > 0
          ? mortalityRows
          : [["No mortality logged", "0", "0", "0 Heads", "-"]],
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] }, // Red
      styles: { fontSize: 8, halign: "center", cellPadding: 2 },
      columnStyles: {
        0: { halign: "left", cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { halign: "left", cellWidth: 145 }, // Remarks gets leftover space
      },
    });

    doc.save(`End_of_Flock_Report_${batch.farmName}_${batch.buildingName}.pdf`);
  };

  return (
    <div className="bg-card border border-border/60 rounded-[2rem] overflow-visible shadow-sm flex flex-col transition-all hover:shadow-md grayscale-15 group">
      {/* CARD HEADER */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40 flex items-start justify-between gap-4">
        {/* Left Side: Tags */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] sm:text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              Harvested
            </span>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
              {batch.ageInDays} Days Total
            </span>
            <span className="bg-white border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
              {batch.name || "Unnamed Batch"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Loaded:{" "}
              {batch.loadDateStr}
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Harvested:{" "}
              {batch.actualHarvestDate}
            </div>
          </div>
        </div>

        {/* Right Side: The 3-Dot Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
            >
              <MoreVertical className="h-5 w-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
          >
            <DropdownMenuItem
              onClick={generatePDF}
              className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-emerald-600"
            >
              <FileText className="w-4 h-4" /> Download PDF Report
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <HistoryTimelineButton load={batch} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CARD BODY: 10 METRICS GRID */}
      <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Target Harvest
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {batch.harvestDate
              ? new Date(batch.harvestDate).toLocaleDateString()
              : "TBD"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Customer Name
          </p>
          <p
            className="text-xs sm:text-sm font-bold text-foreground truncate"
            title={batch.displayCustomer}
          >
            {batch.displayCustomer}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Percent Harvest
          </p>
          <p className="text-xs sm:text-sm font-bold text-primary">
            {batch.percentHarvest.toFixed(1)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Actual Qty Load
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {batch.quantity.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
            Mortality
          </p>
          <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
            {batch.farmMortality.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            Actual Harvest
          </p>
          <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
            {batch.actualHarvest.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Cost Per Chick
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {formatMoney(batch.actualCostPerChick)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Avg Selling Price
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {formatMoney(batch.avgSellingPrice)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
            Gross Expenses
          </p>
          <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500">
            {formatMoney(batch.totalGrossCost)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Total RTL Amount
          </p>
          <p className="text-xs sm:text-sm font-black text-foreground">
            {formatMoney(batch.totalRtlAmount)}
          </p>
        </div>
      </div>

      {/* CARD FOOTER: CAPITAL & NET SALES */}
      <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-100 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 rounded-b-[2rem]">
        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Initial Capital
              </p>
              <p className="text-lg sm:text-xl font-black text-foreground">
                {formatMoney(Number(batch.initialCapital))}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between p-3 sm:p-4 rounded-2xl shadow-sm border",
            batch.totalNetSales >= 0
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
              : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 sm:p-2.5 rounded-xl",
                batch.totalNetSales >= 0
                  ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                  : "bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-400",
              )}
            >
              {batch.totalNetSales >= 0 ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                  batch.totalNetSales >= 0
                    ? "text-emerald-700 dark:text-emerald-500"
                    : "text-red-700 dark:text-red-500",
                )}
              >
                Total Net Sales
              </p>
              <p
                className={cn(
                  "text-lg sm:text-xl md:text-2xl font-black",
                  batch.totalNetSales >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400",
                )}
              >
                {formatMoney(batch.totalNetSales)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
