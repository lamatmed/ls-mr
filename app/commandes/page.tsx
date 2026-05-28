/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";
import {
  FiFileText,
  FiSearch,
  FiPrinter,
  FiCalendar,
  FiShoppingBag,
  FiActivity,
  FiTrash2,
  FiAlertTriangle
} from "react-icons/fi";
import { getInvoiceHistory, getCompany, deleteInvoice } from "../utlis/actions";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ArabicFont } from "../utlis/fonts";
import { getCircularLogo } from "../utlis/pdfLogo";

export default function InvoicesPage() {
  const { t, lang, currency } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          if (!userData.admin) router.push('/');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    fetchUser();
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [history, company] = await Promise.all([
        getInvoiceHistory(),
        getCompany()
      ]);
      setInvoices(history);
      setCompanyInfo(company);
    } catch {
      toast.error(t.commandes.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(id);
      if (result.success) {
        toast.success(t.commandes.cancelSuccess);
        setDeleteConfirm(null);
        fetchData();
      } else {
        toast.error(result.message || t.commandes.cancelError);
      }
    } catch {
      toast.error(t.commandes.serverError);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = async (invoice: any) => {
    try {
      const isArabic = lang === 'ar';
      const fontName = isArabic ? 'Amiri' : 'helvetica';
      const halign = isArabic ? 'right' : 'left';
      const p = t.commandes.pdf;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 150],
      });

      doc.addFileToVFS("Amiri.ttf", ArabicFont);
      doc.addFont("Amiri.ttf", "Amiri", "normal", "Identity-H");
      doc.addFont("Amiri.ttf", "Amiri", "bold", "Identity-H");
      doc.setFont("Amiri", "normal");

      const formattedDate = new Date(invoice.createdAt).toLocaleDateString("fr-FR");
      const formattedTime = new Date(invoice.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
      const currency = companyInfo?.currency || "MRU";
      const textX = isArabic ? 75 : 5;

      // ── Company header (always Amiri to support Arabic names) ──
      const logoData = await getCircularLogo(companyInfo?.logo);
      let y = 8;
      if (logoData) {
        try { doc.addImage(logoData, 'PNG', 32, 2, 16, 16); y = 24; } catch { /* invalid */ }
      }
      doc.setFont("Amiri", "bold");
      doc.setFontSize(18);
      doc.text(companyInfo?.name || "", 40, y, { align: "center" });
      y += 7;
      doc.setFont("Amiri", "normal");
      doc.setFontSize(11);
      if (companyInfo?.address) { doc.text(companyInfo.address, 40, y, { align: "center" }); y += 6; }
      if (companyInfo?.contact) { doc.text(companyInfo.contact, 40, y, { align: "center" }); y += 6; }
      if (companyInfo?.nif) { doc.text(`NIF: ${companyInfo.nif}`, 40, y, { align: "center" }); y += 6; }
      doc.setLineWidth(0.3);
      doc.line(5, y, 75, y);
      y += 4;
      // ───────────────────────────────────────────────────────────

      doc.setFont(fontName, "normal");
      doc.setFontSize(11);
      doc.text(p.ticketNum.replace('{id}', invoice.id.slice(-6).toUpperCase()), textX, y + 4, { align: halign });
      doc.text(p.date.replace('{date}', formattedDate).replace('{time}', formattedTime), textX, y + 10, { align: halign });

      autoTable(doc, {
        startY: y + 18,
        margin: { left: 2, right: 2 },
        head: [[p.colProducts, p.colQty, p.colUnit, p.colTotal]],
        body: invoice.sales.map((sale: any) => [
          sale.productName.substring(0, 18),
          sale.quantity,
          (sale.totalPrice / sale.quantity).toFixed(0),
          sale.totalPrice.toFixed(0)
        ]),
        styles: { fontSize: 10, cellPadding: 2, halign, font: fontName, fontStyle: 'normal' },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], font: fontName, fontStyle: 'normal', halign },
        bodyStyles: { font: fontName, fontStyle: 'normal' },
        columnStyles: { 0: { cellWidth: 35, halign }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        didParseCell: function(data) {
          data.cell.styles.font = fontName;
          data.cell.styles.fontStyle = 'normal';
          if (data.section === 'head') {
            data.cell.styles.fillColor = [0, 0, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFont(fontName, "normal");
      doc.setFontSize(13);
      doc.text(
        p.grandTotal.replace('{amount}', invoice.totalAmount.toFixed(0)).replace('{currency}', currency),
        40, finalY + 5, { align: "center" }
      );

      doc.setFontSize(10);
      doc.text(p.contact.replace('{contact}', companyInfo?.contact || ""), 40, finalY + 12, { align: "center" });
      doc.text(p.thankYou, 40, finalY + 18, { align: "center" });

      doc.save(`Invoice_${invoice.id.slice(-6)}.pdf`);
      toast.success(t.commandes.downloadStarted);
    } catch {
      toast.error(t.commandes.generateError);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.sales.some((s: any) => s.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading && invoices.length === 0) return <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background"><Loader /></div>;

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden font-black">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/2 h-1/2 bg-violet-500/5 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -left-[10%] w-1/2 h-1/2 bg-fuchsia-500/5 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                <FiActivity size={24} />
              </div>
              <span className="text-xs font-black text-violet-500 uppercase tracking-[0.2em]">{t.commandes.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.commandes.titlePrefix} <span className="text-violet-500 italic">{t.commandes.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.commandes.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white/80 dark:bg-card dark:border dark:border-white/5 backdrop-blur-xl border border-white rounded-[2rem] p-2 pl-6 shadow-sm shadow-slate-900/5"
          >
            <FiSearch className="text-slate-400 dark:text-muted-foreground" />
            <input
              type="text"
              placeholder={t.commandes.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-foreground outline-none text-sm font-bold focus:ring-0 py-3 pr-6 w-64"
            />
          </motion.div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice, idx) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/80 dark:bg-card/90 dark:border dark:border-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all duration-500 relative overflow-hidden"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:rotate-6 transition-transform">
                      <FiFileText size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-foreground tracking-tight flex items-center gap-2">
                        {t.commandes.invoiceNum.replace('{id}', invoice.id.slice(-6).toUpperCase())}
                        <span className="px-3 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-500 rounded-full text-[9px] font-black uppercase tracking-widest">{t.commandes.confirmed}</span>
                      </h3>
                      <div className="flex items-center gap-4 text-slate-400 dark:text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <FiCalendar size={14} className="text-violet-500" />
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-border"></div>
                        <div className="text-xs font-bold uppercase tracking-widest">
                          {t.commandes.itemsCount.replace('{count}', String(invoice.sales.length))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{t.commandes.totalLabel}</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-foreground italic tracking-tighter">
                        {invoice.totalAmount.toFixed(0)} <span className="text-xs opacity-30 tracking-normal">{currency}</span>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground hover:bg-violet-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                        title={t.commandes.reprint}
                      >
                        <FiPrinter size={20} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(invoice.id)}
                        className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                        title={t.commandes.cancelInvoice}
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-12 right-12 h-1 bg-gradient-to-r from-transparent via-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white/50 dark:bg-card/20 backdrop-blur-3xl rounded-[3rem] border border-dashed border-slate-200 dark:border-border">
                <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-200 dark:text-muted-foreground/20 border border-slate-100 dark:border-border mb-6">
                  <FiShoppingBag size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight italic">{t.commandes.noResults}</h3>
                <p className="text-slate-400 dark:text-muted-foreground text-xs font-semibold mt-1">{t.commandes.noResultsDesc}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={() => !isDeleting && setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-card rounded-[2.5rem] p-10 shadow-2xl max-w-md w-full border border-slate-100 dark:border-border"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                  <FiAlertTriangle size={28} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight">{t.commandes.cancelConfirmTitle}</h3>
                <p className="text-slate-500 dark:text-muted-foreground font-medium text-sm leading-relaxed">
                  {t.commandes.cancelQuestion}<br />
                  <span className="text-rose-600 font-bold">{t.commandes.cancelNote}</span>
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-[1.5rem] border-2 border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-secondary transition-all disabled:opacity-50"
                >
                  {t.commandes.goBack}
                </button>
                <button
                  onClick={() => handleDeleteInvoice(deleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-[1.5rem] bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiTrash2 size={15} /> {t.commandes.confirmCancel}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
