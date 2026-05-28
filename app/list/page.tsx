'use client';

import { useState, useEffect } from "react";
import { getAllProducts, updateProduct, getCompany } from '../utlis/actions';
import Loader from "../components/Loader";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ArabicFont } from "../utlis/fonts";
import { getCircularLogo } from "../utlis/pdfLogo";
import { useLanguage } from "../context/LanguageContext";
import {
  FiSearch,
  FiEdit,
  FiSave,
  FiX,
  FiFileText,
  FiPackage,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiBox,
  FiZap
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type Product = {
  id: string;
  code: number;
  name: string;
  quantity: number;
  price_v: number;
  price_a: number;
  expirationDate: string;
  codeBar?: string | null;
  fournisseur?: { name: string } | null;
};

type CompanyInfo = { name: string; address: string; contact: string };

export default function ProductListPage() {
  const { t, lang, currency } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProducts();
    getCompany().then(setCompanyInfo).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      const formatted = data.map(p => ({
        ...p,
        expirationDate: new Date(p.expirationDate).toISOString().split("T")[0],
      }));
      setProducts(formatted);
      setFilteredProducts(formatted);
    } catch {
      toast.error(t.list.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    const lower = value.toLowerCase();
    setFilteredProducts(products.filter(p =>
      p.code.toString() === lower ||
      p.codeBar?.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower)
    ));
  };

  const handleEditExpiration = (product: Product) => {
    setEditingProduct(product);
    setNewExpirationDate(product.expirationDate);
  };

  const handleUpdateExpiration = async () => {
    if (!editingProduct || !newExpirationDate) {
      toast.warning(t.list.selectDate);
      return;
    }
    const result = await Swal.fire({
      title: t.list.confirmEdit,
      text: t.list.confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.list.confirmBtn,
      cancelButtonText: t.common.cancel,
      confirmButtonColor: "#3b82f6",
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await updateProduct(
        editingProduct.id, editingProduct.code, editingProduct.name,
        editingProduct.quantity, editingProduct.price_v, editingProduct.price_a,
        newExpirationDate, editingProduct.codeBar || ""
      );
      toast.success(t.list.updateSuccess);
      setEditingProduct(null);
      fetchProducts();
    } catch {
      toast.error(t.list.updateError);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const isArabic = lang === 'ar';
    const p = t.list.pdf;
    const currency = companyInfo?.currency || currency;

    const doc = new jsPDF();

    // Always register Amiri for company header (may contain Arabic text)
    doc.addFileToVFS("Amiri.ttf", ArabicFont);
    doc.addFont("Amiri.ttf", "Amiri", "normal", "Identity-H");
    doc.addFont("Amiri.ttf", "Amiri", "bold", "Identity-H");

    const fontName = isArabic ? 'Amiri' : 'helvetica';
    const halign = isArabic ? 'right' : 'left';
    const setF = (style: 'normal' | 'bold') => doc.setFont(fontName, style);

    // ── Company header (always Amiri) ────────────────────────────
    const logoData = await getCircularLogo(companyInfo?.logo);
    let headerY = 14;
    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 14, 8, 20, 20); headerY = 12; } catch { /* invalid */ }
    }

    doc.setFont('Amiri', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(companyInfo?.name || '', 105, headerY + 4, { align: 'center' });

    doc.setFont('Amiri', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    let infoY = headerY + 10;
    if (companyInfo?.address) { doc.text(companyInfo.address, 105, infoY, { align: 'center' }); infoY += 5; }
    if (companyInfo?.contact) { doc.text(companyInfo.contact, 105, infoY, { align: 'center' }); infoY += 5; }
    if (companyInfo?.nif) { doc.text(`NIF: ${companyInfo.nif}`, 105, infoY, { align: 'center' }); infoY += 5; }

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, infoY + 2, 196, infoY + 2);
    doc.setLineWidth(0.2);
    const afterHeader = infoY + 8;
    // ────────────────────────────────────────────────────────────

    setF('bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(p.title, 14, afterHeader);

    setF('normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${p.generatedOn} ${new Date().toLocaleDateString('fr-FR')}`, 14, afterHeader + 6);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, afterHeader + 10, 196, afterHeader + 10);

    const tableData = filteredProducts.map(prod => [
      prod.code.toString(),
      prod.name,
      prod.quantity.toString(),
      prod.fournisseur?.name || '---',
      `${prod.price_v.toFixed(0)} ${currency}`,
      prod.expirationDate
    ]);

    autoTable(doc, {
      startY: afterHeader + 14,
      head: [[p.colCode, p.colName, p.colQty, p.colSupplier, p.colPrice, p.colExpiry]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'normal', fontSize: 10, cellPadding: 4, halign, font: fontName },
      bodyStyles: { fontSize: 9, cellPadding: 3, halign, font: fontName, fontStyle: 'normal' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        data.cell.styles.font = fontName;
        data.cell.styles.fontStyle = 'normal';
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalQty = filteredProducts.reduce((acc, prod) => acc + prod.quantity, 0);
    const totalVal = filteredProducts.reduce((acc, prod) => acc + prod.price_a * prod.quantity, 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, 182, 28, 3, 3, "F");

    setF('bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(p.summaryTitle, 20, finalY + 9);

    setF('normal');
    doc.setFontSize(10);
    doc.text(`${p.totalUnits} ${totalQty}`, 20, finalY + 19);
    doc.text(`${p.stockValue} ${totalVal.toFixed(0)} ${currency}`, 110, finalY + 19);

    doc.save(`Inventaire_${new Date().getTime()}.pdf`);
    toast.success(t.list.pdf.successMsg);
  };

  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfLast - ITEMS_PER_PAGE, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const totalQty = filteredProducts.reduce((acc, p) => acc + p.quantity, 0);
  const totalVal = filteredProducts.reduce((acc, p) => acc + p.price_a * p.quantity, 0);

  if (loading && products.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/2 h-1/2 bg-primary/5 dark:bg-primary/3 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -left-[10%] w-1/2 h-1/2 bg-blue-500/5 dark:bg-blue-500/3 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiBox size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.list.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.list.titlePrefix} <span className="text-primary italic">{t.list.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.list.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4">
            <div className="relative group min-w-[300px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={t.list.searchPlaceholder}
                value={search}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-4 bg-white/80 dark:bg-secondary dark:text-foreground dark:placeholder:text-muted-foreground/40 backdrop-blur-xl border border-white dark:border-border rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700"
              />
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={generatePDF}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl shadow-slate-900/10 dark:shadow-slate-900/30 hover:bg-black dark:hover:bg-slate-600 transition-all"
            >
              <FiFileText size={18} /> {t.list.exportPDF}
            </motion.button>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-border">
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.colProduct}</th>
                  <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.colStock}</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.colSalePrice}</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.colExpiration}</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.colOptions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50 dark:divide-border/50">
                <AnimatePresence mode="wait">
                  {currentProducts.map(p => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/30 dark:hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-secondary border border-slate-100 dark:border-border flex items-center justify-center text-primary font-black text-xs shadow-sm group-hover:scale-110 transition-transform">
                            {p.code}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{p.name}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">
                              {p.codeBar || t.list.noBarcode}
                            </p>
                            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                              {t.list.supplier}: {p.fournisseur?.name || '---'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          p.quantity <= 5
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${p.quantity <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 dark:bg-emerald-400'}`} />
                          {p.quantity} {t.common.unit}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-lg font-black text-slate-900 dark:text-foreground italic tracking-tighter">
                          {p.price_v.toFixed(0)} <span className="text-[10px] opacity-30 italic">{currency}</span>
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        {editingProduct?.id === p.id ? (
                          <input
                            type="date"
                            value={newExpirationDate}
                            onChange={e => setNewExpirationDate(e.target.value)}
                            className="bg-white dark:bg-secondary dark:text-foreground border border-primary/20 dark:border-primary/30 rounded-xl px-3 py-2 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-foreground/80 font-bold text-sm bg-slate-100/50 dark:bg-secondary/60 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-border/50 w-fit">
                            <FiCalendar size={14} className="text-primary" />
                            {p.expirationDate}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-left">
                        <div className="flex justify-start gap-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                          {editingProduct?.id === p.id ? (
                            <>
                              <button
                                onClick={handleUpdateExpiration}
                                title={t.common.save}
                                className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                              >
                                <FiSave size={18} />
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                title={t.common.cancel}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground flex items-center justify-center hover:bg-slate-200 dark:hover:bg-secondary/80 transition-all"
                              >
                                <FiX size={18} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditExpiration(p)}
                              title={t.common.edit}
                              className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm"
                            >
                              <FiEdit size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-6 bg-slate-50/30 dark:bg-secondary/30 border-t border-slate-50 dark:border-border flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                {t.common.page} {currentPage} {t.common.of} {totalPages}
                <span className="mx-2 opacity-20">|</span>
                {t.list.products.replace('{count}', String(filteredProducts.length))}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground flex items-center justify-center disabled:opacity-30 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all shadow-sm"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground flex items-center justify-center disabled:opacity-30 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all shadow-sm"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stat cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-white dark:border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shadow-sm">
              <FiZap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.statTotalItems}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-foreground">{filteredProducts.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-white dark:border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <FiPackage size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.statTotalStock}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-foreground">{totalQty} {t.common.unit}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-white dark:border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <FiActivity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.list.statPurchaseValue}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tighter">
                {totalVal.toFixed(0)} <span className="text-sm opacity-40">{currency}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
