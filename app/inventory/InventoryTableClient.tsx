"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Receipt,
  Coins,
  MoreVertical,
  Printer,
  ArrowRightLeft,
  Truck,
  Building2,
  ChevronsUpDown,
  Check,
  CalendarIcon,
  ChevronDown,
  Download,
  XCircle,
  ListFilter,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
  Wheat,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { deleteFeedDelivery, updateFeedDelivery } from "./actions";

const formatSacks = (val: number | string | null | undefined) => {
  const num = Number(val);
  if (!num || num === 0) return "0";
  const whole = Math.floor(num);
  const frac = num - whole;
  let fracSymbol = "";
  if (Math.abs(frac - 0.25) < 0.01) fracSymbol = "¼";
  else if (Math.abs(frac - 0.5) < 0.01) fracSymbol = "½";
  else if (Math.abs(frac - 0.75) < 0.01) fracSymbol = "¾";
  else if (frac > 0) fracSymbol = frac.toFixed(2).substring(1);
  if (whole > 0 && fracSymbol) return `${whole.toLocaleString()} ${fracSymbol}`;
  if (whole === 0 && fracSymbol) return fracSymbol;
  return whole.toLocaleString();
};

const formatMoney = (amount: number | string) =>
  `₱${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMoneyPDF = (amount: number | string) =>
  `PHP ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InventoryTableClient({
  deliveries = [],
  transfers = [],
}: {
  deliveries: any[];
  transfers: any[];
}) {
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState("deliveries");

  // ---> SPLIT DATA AUTOMATICALLY <---
  const warehouseTransfers = transfers.filter((t) => !t.isInternalTransfer);
  const internalTransfers = transfers.filter((t) => t.isInternalTransfer);

  // --- DELIVERY TAB STATE ---
  const [openSupplier, setOpenSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [openDeliveryDate, setOpenDeliveryDate] = useState(false);

  const [editingDelivery, setEditingDelivery] = useState<any | null>(null);
  const [deletingDelivery, setDeletingDelivery] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ---> NEW: State for Edit Popover Calendar <---
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [openEditDate, setOpenEditDate] = useState(false);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    deliveries.forEach((d) => suppliers.add(d.supplierName));
    return Array.from(suppliers);
  }, [deliveries]);

  const filteredDeliveries = deliveries.filter((record) => {
    const matchesSearch =
      record.feedType.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      record.supplierName.toLowerCase().includes(deliverySearch.toLowerCase());
    const matchesSupplier =
      selectedSupplier === "all" || record.supplierName === selectedSupplier;
    const matchesDate =
      !deliveryDate ||
      format(new Date(record.deliveryDate), "yyyy-MM-dd") ===
        format(deliveryDate, "yyyy-MM-dd");
    return matchesSearch && matchesSupplier && matchesDate;
  });

  const totalDeliveryPages = Math.ceil(
    filteredDeliveries.length / itemsPerPage,
  );
  const paginatedDeliveries = filteredDeliveries.slice(
    (deliveryPage - 1) * itemsPerPage,
    (deliveryPage - 1) * itemsPerPage + itemsPerPage,
  );

  // --- WAREHOUSE TRANSFER TAB STATE ---
  const [transferSearch, setTransferSearch] = useState("");
  const [transferPage, setTransferPage] = useState(1);
  const [transferDate, setTransferDate] = useState<Date | undefined>(undefined);
  const [openTransferDate, setOpenTransferDate] = useState(false);

  const filteredTransfers = warehouseTransfers.filter((record) => {
    const matchesSearch =
      record.feedType.toLowerCase().includes(transferSearch.toLowerCase()) ||
      record.buildingName
        .toLowerCase()
        .includes(transferSearch.toLowerCase()) ||
      record.farmName.toLowerCase().includes(transferSearch.toLowerCase());
    const matchesDate =
      !transferDate ||
      format(new Date(record.allocatedDate), "yyyy-MM-dd") ===
        format(transferDate, "yyyy-MM-dd");
    return matchesSearch && matchesDate;
  });

  const totalTransferPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const paginatedTransfers = filteredTransfers.slice(
    (transferPage - 1) * itemsPerPage,
    (transferPage - 1) * itemsPerPage + itemsPerPage,
  );

  // --- INTERNAL TRANSFER TAB STATE ---
  const [internalSearch, setInternalSearch] = useState("");
  const [internalPage, setInternalPage] = useState(1);
  const [internalDate, setInternalDate] = useState<Date | undefined>(undefined);
  const [openInternalDate, setOpenInternalDate] = useState(false);

  const filteredInternal = internalTransfers.filter((record) => {
    const matchesSearch =
      record.feedType.toLowerCase().includes(internalSearch.toLowerCase()) ||
      record.buildingName
        .toLowerCase()
        .includes(internalSearch.toLowerCase()) ||
      (record.sourceBuilding || "")
        .toLowerCase()
        .includes(internalSearch.toLowerCase());
    const matchesDate =
      !internalDate ||
      format(new Date(record.allocatedDate), "yyyy-MM-dd") ===
        format(internalDate, "yyyy-MM-dd");
    return matchesSearch && matchesDate;
  });

  const totalInternalPages = Math.ceil(filteredInternal.length / itemsPerPage);
  const paginatedInternal = filteredInternal.slice(
    (internalPage - 1) * itemsPerPage,
    (internalPage - 1) * itemsPerPage + itemsPerPage,
  );

  // --- MATH TOTALS ---
  const grandTotalQuantity = filteredDeliveries.reduce(
    (sum, r) => sum + Number(r.quantity),
    0,
  );
  const grandTotalRemaining = filteredDeliveries.reduce(
    (sum, r) => sum + Number(r.remainingQuantity),
    0,
  );
  const grandTotalCashBond = filteredDeliveries.reduce(
    (sum, r) => sum + Number(r.quantity) * Number(r.cashBond),
    0,
  );
  const grandTotalPayment = filteredDeliveries.reduce(
    (sum, r) => sum + Number(r.quantity) * Number(r.unitPrice),
    0,
  );
  const grandTotalReceipt = grandTotalCashBond + grandTotalPayment;
  const grandTotalTransferred = filteredTransfers.reduce(
    (sum, r) => sum + Number(r.allocatedQuantity),
    0,
  );
  const grandTotalInternal = filteredInternal.reduce(
    (sum, r) => sum + Number(r.allocatedQuantity),
    0,
  );

  const handleDeleteDelivery = async () => {
    if (!deletingDelivery) return;
    setIsProcessing(true);
    const res = await deleteFeedDelivery(deletingDelivery.id);
    if (res.error) toast.error(res.error);
    else toast.success("Delivery safely deleted!");
    setIsProcessing(false);
    setDeletingDelivery(null);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDelivery) return;
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const newDate = formData.get("deliveryDate") as string;
    if (!newDate)
      formData.set(
        "deliveryDate",
        format(new Date(editingDelivery.deliveryDate), "yyyy-MM-dd"),
      );

    const res = await updateFeedDelivery(editingDelivery.id, formData);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Delivery updated successfully!");
      setEditingDelivery(null);
    }
    setIsProcessing(false);
  };

  const downloadCSV = (type: "deliveries" | "transfers" | "internal") => {
    let csv = "";
    if (type === "deliveries") {
      csv =
        "Date,Supplier,Feed Type,Initial Qty,Remaining Qty,Unit Price,Cash Bond,Total Bond,Total Payment,Actual Receipt\n";
      filteredDeliveries.forEach((r) => {
        const qty = Number(r.quantity);
        const rem = Number(r.remainingQuantity);
        const bond = qty * Number(r.cashBond);
        const payment = qty * Number(r.unitPrice);
        const total = bond + payment;
        csv += `"${format(new Date(r.deliveryDate), "MM/dd/yyyy")}","${r.supplierName}","${r.feedType}",${qty},${rem},${r.unitPrice},${r.cashBond},${bond},${payment},${total}\n`;
      });
    } else if (type === "transfers") {
      csv =
        "Date Moved,Feed Type,Qty Dispatched (Sacks),Farm,Building,Handled By\n";
      filteredTransfers.forEach((t) => {
        csv += `"${format(new Date(t.allocatedDate), "MM/dd/yyyy")}","${t.feedType}",${Number(t.allocatedQuantity)},"${t.farmName}","${t.buildingName}","${t.staffName || "System Admin"}"\n`;
      });
    } else {
      csv =
        "Date Moved,Feed Type,Qty Moved (Sacks),Farm,From Building,To Building,Handled By\n";
      filteredInternal.forEach((t) => {
        csv += `"${format(new Date(t.allocatedDate), "MM/dd/yyyy")}","${t.feedType}",${Number(t.allocatedQuantity)},"${t.farmName}","${t.sourceBuilding || "Unknown"}","${t.buildingName}","${t.staffName || "System Admin"}"\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Otso_${type}_Report_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = (type: "deliveries" | "transfers" | "internal") => {
    const doc = new jsPDF(type === "deliveries" ? "landscape" : "portrait");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Otso Poultry Farm", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    let title = "Official Warehouse Feed Ledger";
    if (type === "transfers") title = "Official Dispatch Manifest";
    if (type === "internal") title = "Farm Internal Logs";

    doc.text(title, 14, 26);
    doc.text(`Print Date: ${format(new Date(), "MMMM d, yyyy")}`, 14, 32);

    if (type === "deliveries") {
      doc.text(
        `Supplier: ${selectedSupplier === "all" ? "Master Ledger (All Suppliers)" : selectedSupplier}`,
        14,
        38,
      );
      const tableColumn = [
        "Date",
        "Supplier",
        "Description",
        "Qty",
        "Rem",
        "Unit Px",
        "Cash Bond",
        "Total Bond",
        "Total Pay",
        "Receipt",
      ];
      const tableRows: any[] = [];
      filteredDeliveries.forEach((r) => {
        const qty = Number(r.quantity);
        const rem = Number(r.remainingQuantity);
        const bond = qty * Number(r.cashBond);
        const payment = qty * Number(r.unitPrice);
        const total = bond + payment;
        tableRows.push([
          format(new Date(r.deliveryDate), "MMM d, yyyy"),
          r.supplierName,
          r.feedType,
          formatSacks(qty),
          formatSacks(rem),
          formatMoneyPDF(r.unitPrice),
          formatMoneyPDF(r.cashBond),
          formatMoneyPDF(bond),
          formatMoneyPDF(payment),
          formatMoneyPDF(total),
        ]);
      });
      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        foot: [
          [
            "GRAND TOTALS",
            "",
            "",
            formatSacks(grandTotalQuantity),
            formatSacks(grandTotalRemaining),
            "",
            "",
            formatMoneyPDF(grandTotalCashBond),
            formatMoneyPDF(grandTotalPayment),
            formatMoneyPDF(grandTotalReceipt),
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
        },
        styles: { fontSize: 7 },
      });
    } else if (type === "transfers") {
      const tableColumn = [
        "Date Moved",
        "Feed Type",
        "Qty Dispatched",
        "Destination",
        "Handled By",
      ];
      const tableRows: any[] = [];
      filteredTransfers.forEach((t) => {
        tableRows.push([
          format(new Date(t.allocatedDate), "MMM d, yyyy"),
          t.feedType,
          formatSacks(t.allocatedQuantity),
          `${t.farmName} - ${t.buildingName}`,
          t.staffName || "System",
        ]);
      });
      autoTable(doc, {
        startY: 40,
        head: [tableColumn],
        body: tableRows,
        foot: [
          [
            "TOTAL SACKS DISPATCHED",
            "",
            formatSacks(grandTotalTransferred),
            "",
            "",
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
        },
        styles: { fontSize: 9 },
      });
    } else {
      const tableColumn = [
        "Date Moved",
        "Feed Type",
        "Qty Moved",
        "Farm",
        "From Building",
        "To Building",
        "Handled By",
      ];
      const tableRows: any[] = [];
      filteredInternal.forEach((t) => {
        tableRows.push([
          format(new Date(t.allocatedDate), "MMM d, yyyy"),
          t.feedType,
          formatSacks(t.allocatedQuantity),
          t.farmName,
          t.sourceBuilding || "Unknown",
          t.buildingName,
          t.staffName || "System",
        ]);
      });
      autoTable(doc, {
        startY: 40,
        head: [tableColumn],
        body: tableRows,
        foot: [
          [
            "TOTAL SACKS MOVED",
            "",
            formatSacks(grandTotalInternal),
            "",
            "",
            "",
            "",
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
        },
        styles: { fontSize: 8 },
      });
    }
    doc.save(`Otso_${type}_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="flex flex-col space-y-8 relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ---> UPDATED 3-TABS NAVIGATION <--- */}
        <div className="px-5 sm:px-6 overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg p-1 flex w-max min-w-full sm:min-w-[600px]">
            <TabsTrigger
              value="deliveries"
              className="flex-1 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4"
            >
              <Truck className="w-4 h-4 mr-2 opacity-70" /> Supplier Ledger
            </TabsTrigger>
            <TabsTrigger
              value="transfers"
              className="flex-1 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4"
            >
              <Building2 className="w-4 h-4 mr-2 opacity-70" /> Warehouse
              Dispatch
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="flex-1 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2 opacity-70" /> Farm
              Internal Logs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: SUPPLIER DELIVERIES (INBOUND)                      */}
        {/* ========================================================= */}
        <TabsContent
          value="deliveries"
          className="mt-4 px-5 sm:px-6 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-border/50 gap-4">
              <div className="flex items-start justify-between gap-4 w-full">
                <div className="flex flex-col min-w-0 pr-4">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground truncate max-w-[200px] sm:max-w-sm md:max-w-xl lg:max-w-2xl">
                    {selectedSupplier === "all"
                      ? "Master Inbound Ledger"
                      : selectedSupplier}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {filteredDeliveries.length} Deliveries Found
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
                  >
                    <DropdownMenuItem
                      onClick={() => generatePDF("deliveries")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadCSV("deliveries")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-600" /> Download
                      Excel (CSV)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="border-t border-border/50 w-full" />

              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="hidden md:flex items-center gap-1.5 text-muted-foreground mr-1 px-2">
                  <ListFilter className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Filters:
                  </span>
                </div>

                <Popover
                  open={openDeliveryDate}
                  onOpenChange={setOpenDeliveryDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 sm:flex-none sm:w-[160px] justify-between h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-border/50 shadow-sm text-xs",
                        !deliveryDate && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {deliveryDate
                          ? format(deliveryDate, "MMM d, yyyy")
                          : "Filter Date"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-3 rounded-xl border-border/50 shadow-xl"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      defaultMonth={deliveryDate || new Date()}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      onSelect={(d) => {
                        setDeliveryDate(d);
                        setDeliveryPage(1);
                        setOpenDeliveryDate(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                    />
                    {deliveryDate && (
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                        onClick={() => {
                          setDeliveryDate(undefined);
                          setDeliveryPage(1);
                          setOpenDeliveryDate(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Clear Date Filter
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>

                <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSupplier}
                      className="flex-1 sm:flex-none sm:w-[280px] justify-between h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-border/50 shadow-sm"
                    >
                      <span className="truncate uppercase text-xs tracking-wider">
                        {selectedSupplier === "all"
                          ? "All Suppliers"
                          : selectedSupplier}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] p-0 rounded-xl border-border/50 shadow-xl"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search supplier..."
                        className="h-10"
                      />
                      <CommandList>
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto custom-scrollbar">
                          <CommandItem
                            onSelect={() => {
                              setSelectedSupplier("all");
                              setDeliveryPage(1);
                              setOpenSupplier(false);
                            }}
                            className="font-bold cursor-pointer text-xs uppercase tracking-wider py-2.5"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-blue-600",
                                selectedSupplier === "all"
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />{" "}
                            ALL SUPPLIERS
                          </CommandItem>
                          {uniqueSuppliers.map((supplier) => (
                            <CommandItem
                              key={supplier}
                              value={supplier}
                              onSelect={() => {
                                setSelectedSupplier(supplier);
                                setDeliveryPage(1);
                                setOpenSupplier(false);
                              }}
                              className="font-bold cursor-pointer text-xs uppercase tracking-wider py-2.5"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-blue-600",
                                  selectedSupplier === supplier
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />{" "}
                              {supplier}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50/50 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 transition-all">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">
                    Total Cash Bond
                  </p>
                  <p className="text-lg font-black text-amber-700">
                    {formatMoney(grandTotalCashBond)}
                  </p>
                </div>
              </div>
              <div className="bg-emerald-50/50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-4 transition-all">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80 ">
                    Total Payment
                  </p>
                  <p className="text-lg font-black text-emerald-700">
                    {formatMoney(grandTotalPayment)}
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-950 border border-border/50 p-4 rounded-2xl flex items-center gap-4 shadow-sm transition-all">
                <div className="p-3 bg-white dark:bg-slate-500 border border-border/50 rounded-xl shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Actual Receipt
                  </p>
                  <p className="text-lg font-black text-foreground">
                    {formatMoney(grandTotalReceipt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by feed type..."
                value={deliverySearch}
                onChange={(e) => {
                  setDeliverySearch(e.target.value);
                  setDeliveryPage(1);
                }}
                className="pl-9 h-11 rounded-xl bg-secondary/50 border-border/50 text-sm font-bold"
              />
            </div>

            <div className="rounded-3xl border border-border/50 overflow-hidden bg-white dark:bg-slate-950 shadow-sm relative">
              <div className="overflow-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-slate-950 shadow-sm border-b">
                    <tr>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Date
                      </th>
                      {selectedSupplier === "all" && (
                        <th className="px-5 py-4 text-[10px] font-black uppercase text-muted-foreground">
                          Supplier
                        </th>
                      )}
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Description
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-blue-600 text-right">
                        Qty
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-emerald-600 text-right">
                        Remaining
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-muted-foreground text-right">
                        Unit Price
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-muted-foreground text-right">
                        Cash Bond
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-amber-600 text-right">
                        Total Bond
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-emerald-600 text-right">
                        Total Payment
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-foreground text-right">
                        Actual Receipt
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase text-foreground text-right bg-slate-50 dark:bg-slate-900/50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedDeliveries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-6 py-12 text-center text-muted-foreground font-black uppercase tracking-widest opacity-40"
                        >
                          No deliveries found.
                        </td>
                      </tr>
                    ) : (
                      paginatedDeliveries.map((r) => {
                        const rowTotalBond =
                          Number(r.quantity) * Number(r.cashBond);
                        const rowTotalPayment =
                          Number(r.quantity) * Number(r.unitPrice);
                        return (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group"
                          >
                            <td className="px-5 py-4 font-bold text-foreground">
                              {format(new Date(r.deliveryDate), "MMM d, yyyy")}
                            </td>
                            {selectedSupplier === "all" && (
                              <td className="px-5 py-4">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                                  {r.supplierName}
                                </span>
                              </td>
                            )}
                            <td className="px-5 py-4 uppercase font-black text-[11px] text-muted-foreground">
                              {r.feedType}
                            </td>
                            <td className="px-5 py-4 font-black text-blue-600 text-right">
                              {formatSacks(r.quantity)}
                            </td>
                            <td className="px-5 py-4 font-black text-emerald-600 text-right bg-emerald-50/30 dark:bg-emerald-900/10">
                              {formatSacks(r.remainingQuantity)}
                            </td>
                            <td className="px-5 py-4 font-bold text-muted-foreground text-right">
                              {formatMoney(r.unitPrice)}
                            </td>
                            <td className="px-5 py-4 font-bold text-muted-foreground text-right">
                              {formatMoney(r.cashBond)}
                            </td>
                            <td className="px-5 py-4 font-black text-amber-600 text-right">
                              {formatMoney(rowTotalBond)}
                            </td>
                            <td className="px-5 py-4 font-black text-emerald-600 text-right">
                              {formatMoney(rowTotalPayment)}
                            </td>
                            <td className="px-5 py-4 font-black text-foreground text-right">
                              {formatMoney(rowTotalBond + rowTotalPayment)}
                            </td>
                            <td className="px-5 py-4 text-right bg-slate-50/50 dark:bg-slate-900/20">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40 rounded-xl shadow-xl border-border/50"
                                >
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingDelivery(r);
                                      setEditDate(new Date(r.deliveryDate));
                                    }}
                                    className="font-bold text-xs cursor-pointer py-2"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-2 text-blue-600" />{" "}
                                    Edit Record
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingDelivery(r)}
                                    className="font-bold text-xs cursor-pointer py-2 text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />{" "}
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-900 shadow-[0_-1px_0_rgba(0,0,0,0.1)]">
                    <tr>
                      <td
                        colSpan={selectedSupplier === "all" ? 3 : 2}
                        className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground"
                      >
                        Grand Totals:
                      </td>
                      <td className="px-5 py-4 font-black text-blue-700 dark:text-blue-400 text-right bg-blue-100/50 dark:bg-blue-900/30">
                        {formatSacks(grandTotalQuantity)}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700 dark:text-emerald-500 text-right bg-emerald-100/50 dark:bg-emerald-900/30">
                        {formatSacks(grandTotalRemaining)}
                      </td>
                      <td />
                      <td />
                      <td className="px-5 py-4 font-black text-amber-700 dark:text-amber-500 text-right bg-amber-100/50 dark:bg-amber-900/30">
                        {formatMoney(grandTotalCashBond)}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700 dark:text-emerald-500 text-right bg-emerald-100/50 dark:bg-emerald-900/30">
                        {formatMoney(grandTotalPayment)}
                      </td>
                      <td className="px-5 py-4 font-black text-foreground text-right bg-slate-200 dark:bg-slate-800">
                        {formatMoney(grandTotalReceipt)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {totalDeliveryPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Page {deliveryPage} of {totalDeliveryPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeliveryPage((p) => Math.max(1, p - 1))}
                    disabled={deliveryPage === 1}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDeliveryPage((p) =>
                        Math.min(totalDeliveryPages, p + 1),
                      )
                    }
                    disabled={deliveryPage === totalDeliveryPages}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: WAREHOUSE DISPATCH LOGS                            */}
        {/* ========================================================= */}
        <TabsContent
          value="transfers"
          className="mt-4 px-5 sm:px-6 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50/30 dark:bg-slate-900/50 p-5 rounded-2xl border border-amber-200/50 dark:border-border/50 gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-amber-700 dark:text-amber-500 flex items-center gap-2">
                  <Building className="w-5 h-5" /> Warehouse Dispatch
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {filteredTransfers.length} Dispatch Records
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Popover
                  open={openTransferDate}
                  onOpenChange={setOpenTransferDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-between h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-border/50 shadow-sm text-xs",
                        !transferDate && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {transferDate
                          ? format(transferDate, "MMM d, yyyy")
                          : "Filter Date"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-3 rounded-xl border-border/50 shadow-xl"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={transferDate}
                      defaultMonth={transferDate || new Date()}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      onSelect={(d) => {
                        setTransferDate(d);
                        setTransferPage(1);
                        setOpenTransferDate(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                    />
                    {transferDate && (
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                        onClick={() => {
                          setTransferDate(undefined);
                          setTransferPage(1);
                          setOpenTransferDate(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Clear Date
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
                  >
                    <DropdownMenuItem
                      onClick={() => generatePDF("transfers")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadCSV("transfers")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-600" /> Download
                      Excel (CSV)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80 mb-1">
                    Total Sacks Dispatched
                  </p>
                  <h4 className="text-3xl font-black text-amber-700">
                    {formatSacks(grandTotalTransferred)}
                  </h4>
                </div>
                <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                  <Wheat className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by destination or feed..."
                value={transferSearch}
                onChange={(e) => {
                  setTransferSearch(e.target.value);
                  setTransferPage(1);
                }}
                className="pl-9 h-11 rounded-xl bg-secondary/50 border-border/50 text-sm font-bold"
              />
            </div>

            <div className="rounded-3xl border border-border/50 overflow-hidden bg-white dark:bg-slate-950 shadow-sm relative">
              <div className="overflow-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Date Moved
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Feed Type
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-600 text-center">
                        Qty Dispatched
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Destination
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Handled By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedTransfers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-muted-foreground font-black uppercase tracking-widest opacity-40"
                        >
                          No dispatch records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedTransfers.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                        >
                          <td className="px-6 py-4 font-bold">
                            {format(new Date(t.allocatedDate), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider bg-slate-100 text-slate-700">
                              {t.feedType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-amber-600 text-center text-lg bg-amber-50/30">
                            {formatSacks(t.allocatedQuantity)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-0.5 text-left">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                {t.farmName}
                              </span>
                              <span className="text-xs font-black uppercase text-foreground">
                                {t.buildingName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase">
                            {t.staffName || "System Admin"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalTransferPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Page {transferPage} of {totalTransferPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferPage((p) => Math.max(1, p - 1))}
                    disabled={transferPage === 1}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTransferPage((p) =>
                        Math.min(totalTransferPages, p + 1),
                      )
                    }
                    disabled={transferPage === totalTransferPages}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: INTERNAL FARM MOVEMENT                             */}
        {/* ========================================================= */}
        <TabsContent
          value="internal"
          className="mt-4 px-5 sm:px-6 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/30 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/50 gap-4">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" /> Farm Internal Logs
                </h3>
                <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest mt-1">
                  Building to Building Transfers ({filteredInternal.length}{" "}
                  Records)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Popover
                  open={openInternalDate}
                  onOpenChange={setOpenInternalDate}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-between h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-border/50 shadow-sm text-xs",
                        !internalDate && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {internalDate
                          ? format(internalDate, "MMM d, yyyy")
                          : "Filter Date"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-3 rounded-xl border-border/50 shadow-xl"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={internalDate}
                      defaultMonth={internalDate || new Date()}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      onSelect={(d) => {
                        setInternalDate(d);
                        setInternalPage(1);
                        setOpenInternalDate(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                    />
                    {internalDate && (
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                        onClick={() => {
                          setInternalDate(undefined);
                          setInternalPage(1);
                          setOpenInternalDate(false);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Clear Date
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors outline-none"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card"
                  >
                    <DropdownMenuItem
                      onClick={() => generatePDF("internal")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => downloadCSV("internal")}
                      className="flex items-center gap-3 p-3 font-bold text-sm cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-600" /> Download
                      Excel (CSV)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 border border-indigo-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/80 mb-1">
                    Total Sacks Moved Internally
                  </p>
                  <h4 className="text-3xl font-black text-indigo-700">
                    {formatSacks(grandTotalInternal)}
                  </h4>
                </div>
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search source or destination..."
                value={internalSearch}
                onChange={(e) => {
                  setInternalSearch(e.target.value);
                  setInternalPage(1);
                }}
                className="pl-9 h-11 rounded-xl bg-secondary/50 border-border/50 text-sm font-bold"
              />
            </div>

            <div className="rounded-3xl border border-border/50 overflow-hidden bg-white dark:bg-slate-950 shadow-sm relative">
              <div className="overflow-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Date Moved
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        Feed Type
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-indigo-600 text-center">
                        Qty Moved
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-rose-600">
                        From Building
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-emerald-600">
                        To Building
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground">
                        User
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedInternal.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-muted-foreground font-black uppercase tracking-widest opacity-40"
                        >
                          No internal transfers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedInternal.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                        >
                          <td className="px-6 py-4 font-bold">
                            {format(new Date(t.allocatedDate), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider bg-slate-100 text-slate-700">
                              {t.feedType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-indigo-600 text-center text-lg bg-indigo-50/30 dark:bg-indigo-900/10">
                            {formatSacks(t.allocatedQuantity)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded">
                              {t.sourceBuilding || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                              {t.buildingName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase">
                            {t.staffName || "System Admin"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalInternalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Page {internalPage} of {totalInternalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInternalPage((p) => Math.max(1, p - 1))}
                    disabled={internalPage === 1}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setInternalPage((p) =>
                        Math.min(totalInternalPages, p + 1),
                      )
                    }
                    disabled={internalPage === totalInternalPages}
                    className="h-8 rounded-lg px-3 font-bold"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODALS */}
      <Dialog
        open={!!deletingDelivery}
        onOpenChange={(open) => !open && setDeletingDelivery(null)}
      >
        <DialogContent className="max-w-md rounded-[2rem] p-6 border-red-100">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-black">
              Delete this Delivery?
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">
                {deletingDelivery?.quantity} sacks of{" "}
                {deletingDelivery?.feedType}
              </strong>{" "}
              from {deletingDelivery?.supplierName}?
            </p>
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-xs font-bold w-full text-left border border-amber-200">
              Note: You can only delete this if{" "}
              <span className="underline">zero sacks</span> have been
              transferred to buildings. If sacks were moved, you must delete the
              Transfer Logs first.
            </div>
            <DialogFooter className="w-full flex sm:justify-between gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 font-bold"
                onClick={() => setDeletingDelivery(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-11 font-black"
                onClick={handleDeleteDelivery}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}{" "}
                Delete Delivery
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingDelivery}
        onOpenChange={(open) => !open && setEditingDelivery(null)}
      >
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Edit className="w-6 h-6" /> Edit Delivery Record
            </DialogTitle>
            <p className="text-blue-100 text-sm font-medium mt-1">
              Fix typos or update incorrect amounts safely.
            </p>
          </div>
          <form onSubmit={handleEditSubmit} className="p-6 space-y-6 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Supplier Name *
                </label>
                <Input
                  name="supplierName"
                  required
                  disabled
                  defaultValue={editingDelivery?.supplierName}
                  className="h-11 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-border/50 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Date Delivered
                </label>
                <Popover open={openEditDate} onOpenChange={setOpenEditDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 rounded-xl justify-between border-input font-bold bg-slate-50 dark:bg-slate-900 uppercase text-muted-foreground",
                        !editDate && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {editDate
                          ? format(editDate, "MMM d, yyyy")
                          : "Pick Date"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-200" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      defaultMonth={editDate || new Date()}
                      // ---> SHADCN DROPDOWN UPGRADE <---
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                      onSelect={(d) => {
                        if (d) {
                          setEditDate(d);
                          setOpenEditDate(false);
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* Hidden input to pass the selected date to FormData */}
                <input
                  type="hidden"
                  name="deliveryDate"
                  value={editDate ? format(editDate, "yyyy-MM-dd") : ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Description *
                </label>
                <Input
                  name="feedType"
                  required
                  defaultValue={editingDelivery?.feedType}
                  className="h-11 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-border/50 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Total Sacks *
                </label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={editingDelivery?.quantity}
                  className="h-11 rounded-xl font-black bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Unit Price (₱) *
                </label>
                <Input
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={editingDelivery?.unitPrice}
                  className="h-11 rounded-xl font-black bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Cash Bond (₱)
                </label>
                <Input
                  name="cashBond"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingDelivery?.cashBond}
                  className="h-11 rounded-xl font-black bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingDelivery(null)}
                className="h-11 rounded-xl font-bold px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="h-11 px-8 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}{" "}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
