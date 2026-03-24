"use client";

import Image from "next/image";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  MoreVertical,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const formatMoney = (amount: number) =>
  `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMoneyPDF = (amount: number) =>
  `PHP ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ActiveBatchCard({ report }: { report: any }) {
  // =========================================================================
  // THE INTERIM PDF GENERATOR
  // =========================================================================
  const generatePDF = () => {
    const doc = new jsPDF("portrait");

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Otso Poultry Farm", 14, 20);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235); // Blue
    doc.text("Interim Flock Status Report", 14, 28);
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Farm: ${report.farmName}`, 14, 38);
    doc.text(`Building: ${report.buildingName}`, 14, 44);
    doc.text(`Load/Batch ID: ${report.name || `Load ${report.id}`}`, 14, 50);

    doc.text(`Load Date: ${report.loadDateStr}`, 120, 38);
    doc.text(`Current Status: Active`, 120, 44);
    doc.text(`Current Age: ${report.ageInDays} Days`, 120, 50);

    // EXECUTIVE SUMMARY
    autoTable(doc, {
      startY: 55,
      head: [
        [
          "Performance Metric",
          "Current Value",
          "Financial Metric",
          "Current Amount",
        ],
      ],
      body: [
        [
          "Total Initial Sacks",
          report.quantity.toLocaleString(),
          "Total Gross Cost",
          formatMoneyPDF(report.totalGrossCost),
        ],
        [
          "Harvested to Date",
          report.actualHarvest.toLocaleString(),
          "Total RTL Amount",
          formatMoneyPDF(report.totalRtlAmount),
        ],
        [
          "Total Mortality",
          report.farmMortality.toLocaleString(),
          "Avg Selling Price",
          formatMoneyPDF(report.avgSellingPrice),
        ],
        [
          "Harvest Percentage",
          `${report.percentHarvest.toFixed(1)}%`,
          "Current Cost/Chick",
          formatMoneyPDF(report.actualCostPerChick),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] }, // Blue
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 55;

    // FEED EXPENSES TABLE
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Feed Consumption Log (To Date)", 14, finalY + 15);

    const feedRows = report.pdfPayload.feeds.map((f: any) => [
      format(new Date(f.date), "MMM d, yyyy"),
      f.type,
      `${f.qty} Sacks`,
      formatMoneyPDF(f.cost),
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Date", "Feed Type", "Qty", "Calculated Cost"]],
      body:
        feedRows.length > 0
          ? feedRows
          : [["No feeds logged yet", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] }, // Amber
      styles: { fontSize: 8 },
    });

    // OTHER EXPENSES TABLE
    const expY = (doc as any).lastAutoTable.finalY || finalY + 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Direct & Shared Expenses (To Date)", 14, expY + 15);

    const expRows = report.pdfPayload.expenses.map((e: any) => [
      format(new Date(e.date), "MMM d, yyyy"),
      e.type,
      e.remarks || "-",
      formatMoneyPDF(e.amount),
    ]);

    // ---> Duplicate summary row completely removed from here! <---

    autoTable(doc, {
      startY: expY + 20,
      head: [["Date", "Expense Type", "Remarks", "Amount"]],
      body:
        expRows.length > 0
          ? expRows
          : [["No expenses logged yet", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] }, // Blue
      styles: { fontSize: 8 },
    });

    doc.save(`Interim_Report_${report.farmName}_${report.buildingName}.pdf`);
  };

  return (
    <div className="bg-card border border-border/60 rounded-[2.5rem] overflow-visible shadow-sm flex flex-col transition-all hover:shadow-md">
      {/* --- Card Header --- */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground flex items-center">
              {report.buildingName}
              <span className="text-muted-foreground font-bold text-sm ml-2.5 px-2.5 py-0.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-md">
                {report.name || "Unnamed"}
              </span>
            </h4>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active
            </span>
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
              Day {report.ageInDays}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <Image
                src="/hen.svg"
                alt="Hen"
                width={16}
                height={16}
                className="object-contain dark:invert opacity-80"
              />
              <p className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                {report.chickType || "Standard Breed"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              <CalendarDays className="w-3.5 h-3.5" /> Loaded:{" "}
              {report.loadDateStr}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-slate-200 bg-white shadow-sm border border-border/50 shrink-0 self-end md:self-auto"
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
              className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-600"
            >
              <FileText className="w-4 h-4" /> Download Interim PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Card Body: Metrics Grid --- */}
      <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Target Harvest
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {report.harvestDate
              ? new Date(report.harvestDate).toLocaleDateString()
              : "TBD"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Customer Name
          </p>
          <p
            className="text-xs sm:text-sm font-bold text-foreground truncate"
            title={report.displayCustomer}
          >
            {report.displayCustomer}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Percent Harvest
          </p>
          <p className="text-xs sm:text-sm font-bold text-primary">
            {report.percentHarvest.toFixed(1)}%
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Actual Qty Load
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {Number(report.quantity).toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500">
            Mortality
          </p>
          <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
            {report.farmMortality.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            Actual Harvest
          </p>
          <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
            {report.actualHarvest.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Actual Cost/Chick
          </p>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            {formatMoney(report.actualCostPerChick)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500">
            Selling Price
          </p>
          <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatMoney(Number(report.sellingPrice))}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">
            Total Gross (Expenses)
          </p>
          <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-500">
            {formatMoney(report.totalGrossCost)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Total RTL Amount
          </p>
          <p className="text-xs sm:text-sm font-black text-foreground">
            {formatMoney(report.totalRtlAmount)}
          </p>
        </div>
      </div>

      {/* --- Card Footer: Financials --- */}
      <div className="px-5 py-5 sm:px-6 sm:py-6 bg-slate-100 dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 rounded-b-[2.5rem]">
        <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-3 sm:p-4 rounded-[1.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Initial Capital
              </p>
              <p className="text-lg sm:text-xl font-black text-foreground">
                {formatMoney(Number(report.initialCapital))}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between p-3 sm:p-4 rounded-[1.5rem] shadow-sm border",
            report.actualHarvest === 0
              ? "bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800"
              : report.totalNetSales >= 0
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 sm:p-2.5 rounded-xl",
                report.actualHarvest === 0
                  ? "bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  : report.totalNetSales >= 0
                    ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    : "bg-red-200/50 text-red-700 dark:bg-red-900/50 dark:text-red-400",
              )}
            >
              {report.actualHarvest === 0 ? (
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : report.totalNetSales >= 0 ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                  report.actualHarvest === 0
                    ? "text-slate-500 dark:text-slate-400"
                    : report.totalNetSales >= 0
                      ? "text-emerald-700 dark:text-emerald-500"
                      : "text-red-700 dark:text-red-500",
                )}
              >
                Total Net Sales
              </p>
              <p
                className={cn(
                  "text-lg sm:text-xl md:text-2xl font-black",
                  report.actualHarvest === 0
                    ? "text-slate-600 dark:text-slate-300"
                    : report.totalNetSales >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400",
                )}
              >
                {report.actualHarvest === 0
                  ? "PENDING"
                  : formatMoney(report.totalNetSales)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
