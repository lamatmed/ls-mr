'use client';

import { useState } from "react";
import {
  FiCalendar,
  FiSearch,
  FiActivity,
  FiTrendingUp,
  FiInfo,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getInvoiceHistory, getCompany } from "../utlis/actions";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ArabicFont } from "../utlis/fonts";
import { getCircularLogo } from "../utlis/pdfLogo";
import { useLanguage } from "../context/LanguageContext";

type Sale = {
  productName: string;
  quantity: number;
  totalPrice: number;
};

type Invoice = {
  id: string;
  totalAmount: number;
  purchaseTotal: number;
  createdAt: string;
  sales: Sale[];
  client?: { nom: string; solde: number };
};

export default function SalesReportPage() {
  const { t, lang, currency: ctxCurrency } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.warning(t.periode.selectPeriod);
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error(t.periode.dateOrderError);
      return;
    }

    setIsLoading(true);
    try {
      const invoices = await getInvoiceHistory() as Invoice[];

      const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(new Date(invoice.createdAt).toISOString().split('T')[0]);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });

      if (filteredInvoices.length === 0) {
        Swal.fire({
          title: t.periode.noData,
          text: t.periode.noSales,
          icon: "info",
          customClass: { popup: 'rounded-[2rem]' }
        });
        return;
      }

      const isArabic = lang === 'ar';
      const company = await getCompany();
      const currency = company.currency || ctxCurrency;
      const p = t.periode.pdf;
      const halign = isArabic ? 'right' : 'left';

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Amiri always registered — company info may be in Arabic regardless of UI lang
      doc.addFileToVFS("Amiri.ttf", ArabicFont);
      doc.addFont("Amiri.ttf", "Amiri", "normal", "Identity-H");
      doc.addFont("Amiri.ttf", "Amiri", "bold", "Identity-H");

      const fontName = isArabic ? 'Amiri' : 'helvetica';
      const setF = (style: 'normal' | 'bold') => doc.setFont(fontName, style);

      // ── Company header (always Amiri to support Arabic names) ───
      const logoData = await getCircularLogo(company.logo);
      let headerY = 14;
      if (logoData) {
        try { doc.addImage(logoData, 'PNG', 14, 8, 20, 20); headerY = 12; } catch { /* invalid */ }
      }

      doc.setFont('Amiri', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(company.name, 105, headerY + 4, { align: 'center' });

      doc.setFont('Amiri', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      let infoY = headerY + 10;
      if (company.address) { doc.text(company.address, 105, infoY, { align: 'center' }); infoY += 5; }
      if (company.contact) { doc.text(company.contact, 105, infoY, { align: 'center' }); infoY += 5; }
      if (company.nif) { doc.text(`NIF: ${company.nif}`, 105, infoY, { align: 'center' }); infoY += 5; }

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, infoY + 2, 196, infoY + 2);
      doc.setLineWidth(0.2);
      const afterHeader = infoY + 8;
      // ────────────────────────────────────────────────────────────

      setF('normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`${p.generatedOn} ${new Date().toLocaleDateString("fr-FR")}`, 14, afterHeader);
      doc.text(
        p.period.replace('{start}', new Date(startDate).toLocaleDateString("fr-FR"))
                .replace('{end}', new Date(endDate).toLocaleDateString("fr-FR")),
        14, afterHeader + 6
      );

      doc.setDrawColor(226, 232, 240);
      doc.line(14, afterHeader + 11, 196, afterHeader + 11);

      const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalItems = filteredInvoices.reduce((sum, inv) => sum + inv.sales.reduce((s, sale) => s + sale.quantity, 0), 0);

      const boxY = afterHeader + 15;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, boxY, 182, 30, 3, 3, "F");

      setF('bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(p.summary, 20, boxY + 8);

      setF('normal');
      doc.setFontSize(10);
      doc.text(`${p.transactions}: ${filteredInvoices.length}`, 20, boxY + 16);
      doc.text(`${p.itemsSold}: ${totalItems}`, 20, boxY + 22);

      setF('bold');
      doc.setTextColor(59, 130, 246);
      doc.text(`${p.totalSales}: ${totalSales.toFixed(0)} ${currency}`, 190, boxY + 16, { align: 'right' });

      const productMap = new Map<string, { quantity: number; total: number }>();
      filteredInvoices.forEach(invoice => {
        invoice.sales.forEach(sale => {
          const name = sale.productName || p.unknownProduct;
          const stats = productMap.get(name) || { quantity: 0, total: 0 };
          stats.quantity += sale.quantity;
          stats.total += sale.totalPrice;
          productMap.set(name, stats);
        });
      });

      const productData = Array.from(productMap.entries()).map(([name, stats]) => [
        name, stats.quantity, `${stats.total.toFixed(0)} ${currency}`
      ]);

      setF('normal');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(p.byProduct, 14, boxY + 36);

      autoTable(doc, {
        startY: boxY + 41,
        head: [[p.colProduct, p.colQty, p.colTotal]],
        body: productData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'normal', halign, font: fontName },
        bodyStyles: { halign, font: fontName, fontStyle: 'normal' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          data.cell.styles.font = fontName;
          data.cell.styles.fontStyle = 'normal';
        }
      });

      const clientMap = new Map<string, { balance: number; totalSales: number }>();
      filteredInvoices.forEach(invoice => {
        if (invoice.client) {
          const stats = clientMap.get(invoice.client.nom) || { balance: invoice.client.solde, totalSales: 0 };
          stats.totalSales += invoice.totalAmount;
          clientMap.set(invoice.client.nom, stats);
        }
      });

      if (clientMap.size > 0) {
        doc.addPage();
        setF('normal');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(p.clientBalances, 14, 20);

        const clientData = Array.from(clientMap.entries()).map(([name, stats]) => [
          name, `${stats.totalSales.toFixed(0)} ${currency}`, `${stats.balance.toFixed(0)} ${currency}`
        ]);

        autoTable(doc, {
          startY: 25,
          head: [[p.colClient, p.colPeriodSales, p.colBalance]],
          body: clientData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, font: fontName, halign },
          bodyStyles: { font: fontName, halign },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });
      }

      doc.save(`Rapport_Periode_${startDate}_${endDate}.pdf`);
      toast.success(t.periode.successMsg);

    } catch {
      toast.error(t.periode.errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/2 h-1/2 bg-blue-500/5 dark:bg-blue-500/3 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -left-[10%] w-1/2 h-1/2 bg-primary/5 dark:bg-primary/3 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/10 flex items-center justify-center text-primary">
                <FiActivity size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                {t.periode.badge}
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.periode.titlePrefix} <span className="text-primary italic">{t.periode.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">
              {t.periode.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Date picker card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] mb-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <FiCalendar className="text-primary" /> {t.periode.startDate}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <FiCalendar className="text-primary" /> {t.periode.endDate}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl outline-none transition-all font-bold text-slate-700 shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={isLoading}
            className="w-full py-6 bg-slate-900 dark:bg-slate-700 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/40 hover:bg-black dark:hover:bg-slate-600 transition-all group disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiSearch className="group-hover:rotate-12 transition-transform" />
                {t.periode.generateBtn}
              </>
            )}
          </button>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-card p-8 rounded-[2rem] border border-slate-100 dark:border-border shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-6">
              <FiInfo size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-foreground uppercase tracking-widest mb-4">
              {t.periode.instructions}
            </h3>
            <ul className="space-y-3">
              {[t.periode.step1, t.periode.step2, t.periode.step3].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-500 dark:text-muted-foreground text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 dark:shadow-slate-900/40"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-primary flex items-center justify-center mb-6">
              <FiTrendingUp size={24} />
            </div>
            <h3 className="text-sm font-black text-white/60 uppercase tracking-widest mb-2">
              {t.periode.reportContent}
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-4">{t.periode.reportPro}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary border border-white/5">
                {t.periode.reportSummary}
              </span>
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary border border-white/5">
                {t.periode.reportProducts}
              </span>
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary border border-white/5">
                {t.periode.reportDetails}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
