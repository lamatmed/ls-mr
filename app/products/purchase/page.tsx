'use client'

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  searchProducts,
  processPurchaseInvoice,
  getAllCategories,
  getAllFournisseurs,
  getAllProducts,
  getLastProductCode
} from "@/app/utlis/actions";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  FiPlus, FiTrash2, FiSave, FiSearch, FiTruck,
  FiDollarSign, FiCalendar, FiArrowLeft, FiFileText,
  FiX, FiBox
} from "react-icons/fi";
import Loader from "@/app/components/Loader";
import { motion, AnimatePresence } from "framer-motion";

interface ProductResult {
  id: string;
  code: number;
  name: string;
  codeBar: string;
  price_a: number;
  price_v: number;
  quantity: number;
  expirationDate: string | null;
  categoryId: string | null;
}

interface InvoiceItem {
  id?: string;
  tempId: string;
  code?: number;
  name: string;
  codeBar: string;
  quantity: number;
  currentStock?: number;
  price_a: number;
  price_v: number;
  expirationDate: string;
  categoryId?: string | null;
  searchCode: string;
  searchResults: ProductResult[];
  showResults: boolean;
  isNew: boolean;
}

const BARCODE_MAP: Record<string, string> = {
  '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
  '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
  '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '*': '8', ')': '0',
};

const fixBarcode = (str: string) =>
  str.split('').map(c => BARCODE_MAP[c] ?? c).join('');

const calcMargin = (pa: number, pv: number): number | null =>
  pa > 0 && pv > pa ? Math.round(((pv - pa) / pa) * 100) : null;

const isItemValid = (item: InvoiceItem) =>
  !!item.name && item.quantity > 0 && item.price_a > 0 && item.price_v > item.price_a;

/* ─────────────────────────────────────────────────────────────
   NumberInput — local raw-string state so the user can freely
   type "0.5", "1.", leading zeros, etc., without the value
   snapping while typing.
───────────────────────────────────────────────────────────── */
function NumberInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className: string;
  placeholder: string;
}) {
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));
  const lastExternal = useRef(value);

  // Sync from parent only when the parent's numeric value changed externally
  // (e.g. product selected). Don't clobber mid-typing states like "1.".
  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setRaw(value === 0 ? "" : String(value));
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v !== "" && !/^\d*\.?\d*$/.test(v)) return;
    setRaw(v);
    lastExternal.current = v === "" ? 0 : parseFloat(v) || 0;
    onChange(lastExternal.current);
  }, [onChange]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={raw}
      onChange={handleChange}
    />
  );
}

const makeItem = (today: string): InvoiceItem => ({
  tempId: Math.random().toString(36).slice(2, 11),
  name: "", codeBar: "", quantity: 1,
  price_a: 0, price_v: 0, expirationDate: today,
  searchCode: "", searchResults: [], showResults: false, isNew: false,
});

export default function PurchaseInvoice() {
  const { t, currency } = useLanguage();
  const router = useRouter();
  const today = useRef(new Date().toISOString().split('T')[0]).current;

  const [items, setItems] = useState<InvoiceItem[]>([makeItem(today)]);
  const [fournisseurId, setFournisseurId] = useState("");
  const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allProducts, setAllProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const searchTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (!res.ok) { router.push('/login'); return; }
        const u = await res.json();
        if (!u.admin) router.push('/');
      } catch { router.push('/login'); }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      const [cats, fourns, prods] = await Promise.all([
        getAllCategories(), getAllFournisseurs(), getAllProducts(),
      ]);
      setCategories(cats);
      setFournisseurs(fourns);
      setAllProducts(prods as ProductResult[]);
      setLoading(false);
    })();
  }, []);

  const addItem = () => setItems(prev => [...prev, makeItem(today)]);

  const removeItem = (tempId: string) =>
    setItems(prev => prev.length > 1 ? prev.filter(i => i.tempId !== tempId) : prev);

  const updateItem = (tempId: string, fields: Partial<InvoiceItem>) =>
    setItems(prev => prev.map(i => i.tempId === tempId ? { ...i, ...fields } : i));

  const selectProduct = (tempId: string, p: ProductResult) => {
    updateItem(tempId, {
      id: p.id, name: p.name, code: p.code, currentStock: p.quantity,
      codeBar: p.codeBar || "", price_a: p.price_a, price_v: p.price_v,
      expirationDate: p.expirationDate
        ? new Date(p.expirationDate).toISOString().split('T')[0]
        : today,
      categoryId: p.categoryId, showResults: false,
      searchCode: p.codeBar || p.code.toString(), isNew: false,
    });
  };

  const handleCodeSearch = (tempId: string, raw: string) => {
    const code = fixBarcode(raw);
    updateItem(tempId, { searchCode: code });
    clearTimeout(searchTimeoutRef.current[tempId]);
    if (code.length < 1) {
      updateItem(tempId, { searchResults: [], showResults: false });
      return;
    }
    searchTimeoutRef.current[tempId] = setTimeout(async () => {
      const exact = allProducts.find(
        p => p.code.toString() === code || p.codeBar === code
      );
      if (exact) { selectProduct(tempId, exact); return; }
      const results = await searchProducts(code) as ProductResult[];
      updateItem(tempId, { searchResults: results, showResults: results.length > 0 });
    }, 350);
  };

  const toggleNew = async (tempId: string) => {
    const item = items.find(i => i.tempId === tempId);
    if (!item) return;
    if (item.isNew) {
      updateItem(tempId, { isNew: false, id: undefined, name: "", code: undefined, searchCode: "" });
    } else {
      const lastCode = await getLastProductCode() as number | null;
      const dbMax = lastCode || 0;
      const itemMax = items.reduce((m, i) => Math.max(m, i.code ?? 0), 0);
      updateItem(tempId, {
        isNew: true, id: undefined, code: Math.max(dbMax, itemMax) + 1,
        name: "", searchCode: "",
      });
    }
  };

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (items.some(i => !isItemValid(i))) {
      toast.error(t.products.invoiceValidationError);
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: t.products.confirmInvoiceTitle,
      text: t.products.confirmInvoiceText.replace('{count}', String(items.length)),
      icon: "question", showCancelButton: true,
      confirmButtonText: t.update.confirmBtn,
      cancelButtonText: t.common.cancel,
      customClass: {
        confirmButton: 'bg-primary rounded-xl px-6 py-3',
        cancelButton: 'bg-secondary rounded-xl px-6 py-3',
        popup: 'rounded-[2rem]',
      },
    });
    if (!isConfirmed) return;
    setIsSubmitting(true);
    const result = await processPurchaseInvoice(
      fournisseurId || null,
      items.map(({ id, code, name, quantity, price_v, price_a, expirationDate, codeBar, categoryId }) => ({
        id, code, name,
        quantity: Number(quantity),
        price_v: Number(price_v),
        price_a: Number(price_a),
        expirationDate,
        codeBar: codeBar?.trim() || undefined,
        categoryId: categoryId?.trim() || undefined,
      }))
    );
    setIsSubmitting(false);
    if (result.success) {
      toast.success(t.products.invoiceSuccess);
      router.push("/products");
    } else {
      Swal.fire({ icon: "error", title: t.common.error, text: result.error });
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  const totalPurchase = items.reduce((acc, i) => acc + i.price_a * i.quantity, 0);
  const totalUnits = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  /* ─── shared input class builders ─── */
  const codeInputCls = (item: InvoiceItem) =>
    `w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 rounded-xl py-3 pl-9 pr-3 outline-none font-bold text-slate-800 text-sm transition-all
    ${hasTriedSubmit && !item.name && !item.isNew ? 'border-rose-300 dark:border-rose-500/40' : 'border-transparent focus:border-primary/30'}
    ${item.isNew ? 'opacity-40 pointer-events-none' : ''}`;

  const nameInputCls = (item: InvoiceItem) =>
    `flex-1 bg-slate-50 dark:bg-secondary dark:text-foreground border-2 rounded-xl py-3 px-4 outline-none font-bold text-slate-900 text-sm transition-all
    ${hasTriedSubmit && !item.name ? 'border-rose-300 dark:border-rose-500/40' : 'border-transparent focus:border-primary/30'}
    ${!item.isNew && item.id ? 'opacity-60 pointer-events-none' : ''}`;

  const qtyInputCls = (item: InvoiceItem) =>
    `w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 rounded-xl py-3 px-2 outline-none font-black text-slate-800 dark:text-foreground text-center text-sm transition-all
    ${hasTriedSubmit && item.quantity <= 0 ? 'border-rose-300 dark:border-rose-500/40' : 'border-transparent focus:border-primary/30'}`;

  const buyInputCls = (item: InvoiceItem) =>
    `w-full bg-indigo-50/70 dark:bg-indigo-500/10 border-2 rounded-xl py-3 px-2 outline-none font-black text-indigo-700 dark:text-indigo-300 text-center text-sm transition-all
    ${hasTriedSubmit && item.price_a <= 0 ? 'border-rose-300 dark:border-rose-500/40' : 'border-transparent focus:border-indigo-400/40'}`;

  const sellInputCls = (item: InvoiceItem) =>
    `w-full bg-emerald-50/70 dark:bg-emerald-500/10 border-2 rounded-xl py-3 px-2 outline-none font-black text-emerald-700 dark:text-emerald-300 text-center text-sm transition-all
    ${hasTriedSubmit && item.price_v <= item.price_a ? 'border-rose-300 dark:border-rose-500/40' : 'border-transparent focus:border-emerald-400/40'}`;

  /* ─── shared sub-components ─── */
  const SearchDropdown = ({ item }: { item: InvoiceItem }) => (
    <AnimatePresence>
      {item.showResults && item.searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-card rounded-2xl shadow-2xl border border-slate-100 dark:border-border overflow-hidden max-h-56 overflow-y-auto min-w-[260px]"
        >
          {item.searchResults.map(p => (
            <button
              key={p.id}
              onClick={() => selectProduct(item.tempId, p)}
              className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-secondary flex items-center justify-between border-b border-slate-50 dark:border-border last:border-0 transition-colors"
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground">#{p.code}</span>
                <span className="text-[11px] font-bold text-primary">{p.price_a} {currency}</span>
              </div>
              <span className="font-black text-slate-800 dark:text-foreground text-sm">{p.name}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const NewToggle = ({ item }: { item: InvoiceItem }) => (
    <button
      onClick={() => toggleNew(item.tempId)}
      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border
        ${item.isNew
          ? 'bg-emerald-500 text-white border-emerald-500'
          : 'bg-transparent text-slate-400 dark:text-muted-foreground border-slate-200 dark:border-border hover:border-emerald-400 hover:text-emerald-500'
        }`}
    >
      {item.isNew ? t.products.existingLabel : t.products.newLabel}
    </button>
  );

  const NewProductFields = ({ item }: { item: InvoiceItem }) => (
    <div className="flex gap-2 flex-wrap">
      <input
        readOnly
        className="w-20 bg-slate-100 dark:bg-secondary/60 border-none rounded-lg py-2 px-2 text-xs font-bold text-slate-500 dark:text-muted-foreground text-center"
        placeholder={t.products.codePlaceholder}
        value={item.code ?? ""}
      />
      <input
        className="flex-1 min-w-[80px] bg-slate-100 dark:bg-secondary/60 border-none rounded-lg py-2 px-2 text-xs font-bold text-slate-500 dark:text-muted-foreground"
        placeholder={t.products.barcodePlaceholder}
        value={item.codeBar}
        onChange={e => updateItem(item.tempId, { codeBar: fixBarcode(e.target.value) })}
      />
      <select
        className="bg-slate-100 dark:bg-secondary/60 dark:text-muted-foreground border-none rounded-lg py-2 px-2 text-xs font-bold text-slate-500"
        value={item.categoryId ?? ""}
        onChange={e => updateItem(item.tempId, { categoryId: e.target.value })}
      >
        <option value="">{t.edit.category}</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );

  const makeNumInput = (item: InvoiceItem, field: 'quantity' | 'price_a' | 'price_v', cls: string, placeholder: string) => (
    <NumberInput
      key={`${item.tempId}-${field}`}
      value={item[field] as number}
      className={cls}
      placeholder={placeholder}
      onChange={n => updateItem(item.tempId, { [field]: n })}
    />
  );

  return (
    <div className="relative min-h-screen py-8 px-4 md:px-8 lg:px-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-1/3 h-1/3 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-slate-400 dark:text-muted-foreground hover:text-primary transition-all"
            >
              <FiArrowLeft size={16} />
              <span className="text-sm font-bold">{t.common.back}</span>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FiFileText size={22} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.products.purchaseBadge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.products.purchaseTitlePrefix}{" "}
              <span className="text-primary italic">{t.products.purchaseInvoice}</span>
            </h1>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-4"
          >
            <div className="bg-white dark:bg-card px-6 py-4 rounded-2xl shadow-lg border border-white dark:border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground flex items-center justify-center">
                <FiBox size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">{t.common.quantity}</p>
                <p className="text-xl font-black text-slate-900 dark:text-foreground">
                  {totalUnits} <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground">{t.common.pieceShort}</span>
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-card px-6 py-4 rounded-2xl shadow-lg border border-white dark:border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <FiDollarSign size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">{t.products.totalPurchase}</p>
                <p className="text-xl font-black text-slate-900 dark:text-foreground">
                  {totalPurchase.toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground">{currency}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Main card ── */}
        <div className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-2xl overflow-hidden mb-6">

          {/* Toolbar */}
          <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px] space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                {t.edit.supplier}
              </label>
              <div className="relative">
                <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 z-10" size={15} />
                <select
                  className="w-full bg-white dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm"
                  value={fournisseurId}
                  onChange={e => setFournisseurId(e.target.value)}
                >
                  <option value="">{t.edit.supplierPlaceholder}</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={addItem}
              className="px-6 py-3.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2.5 font-black text-sm hover:scale-105 active:scale-95 transition-transform"
            >
              <FiPlus size={18} strokeWidth={3} />
              <span>{t.products.addLine}</span>
            </button>
          </div>

          {/* ── DESKTOP TABLE (lg+) ── */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-secondary/40 text-right">
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-10 text-center">#</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-40">{t.products.codeBarcodeLabel}</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.productNameHeader}</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-24 text-center">{t.common.quantity}</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-36 text-center">{t.edit.purchasePrice}</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-36 text-center">{t.edit.sellingPrice}</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest w-40">{t.edit.expirationDate}</th>
                  <th className="px-4 py-3.5 w-12" aria-label={t.common.actions} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border">
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const invalid = hasTriedSubmit && !isItemValid(item);
                    const mg = calcMargin(item.price_a, item.price_v);
                    return (
                      <motion.tr
                        key={item.tempId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`group transition-colors ${invalid ? 'bg-rose-50/60 dark:bg-rose-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-secondary/20'}`}
                      >
                        {/* # */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-black text-slate-300 dark:text-muted-foreground/30">{idx + 1}</span>
                        </td>

                        {/* Code / Barcode */}
                        <td className="px-4 py-4">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 z-10" size={13} />
                            <input
                              className={codeInputCls(item)}
                              placeholder={t.products.codePlaceholder}
                              value={item.searchCode}
                              onChange={e => handleCodeSearch(item.tempId, e.target.value)}
                              onBlur={() => setTimeout(() => updateItem(item.tempId, { showResults: false }), 200)}
                            />
                            {item.id && !item.isNew && (
                              <div className="absolute -right-1 -top-3.5 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1 z-20 whitespace-nowrap">
                                <FiBox size={9} />
                                <span>{t.products.currentStockBadge.replace('{stock}', String(item.currentStock ?? 0))}</span>
                              </div>
                            )}
                            <SearchDropdown item={item} />
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <NewToggle item={item} />
                              <input
                                className={nameInputCls(item)}
                                placeholder={t.products.productNameHeader}
                                value={item.name}
                                onChange={e => updateItem(item.tempId, { name: e.target.value })}
                              />
                            </div>
                            {item.isNew && <NewProductFields item={item} />}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-4">
                          {makeNumInput(item, "quantity", qtyInputCls(item), "0")}
                        </td>

                        {/* Buy price */}
                        <td className="px-4 py-4">
                          {makeNumInput(item, "price_a", buyInputCls(item), "0")}
                        </td>

                        {/* Sell price + margin badge */}
                        <td className="px-4 py-4">
                          <div className="relative">
                            {makeNumInput(item, "price_v", sellInputCls(item), "0")}
                            {mg !== null && (
                              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                                +{mg}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Expiry */}
                        <td className="px-4 py-4">
                          <div className="relative">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={12} />
                            <input
                              type="date"
                              className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 rounded-xl py-3 pl-8 pr-2 outline-none font-bold text-slate-600 dark:text-foreground text-sm transition-all"
                              value={item.expirationDate}
                              onChange={e => updateItem(item.tempId, { expirationDate: e.target.value })}
                            />
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => removeItem(item.tempId)}
                            disabled={items.length === 1}
                            className="w-9 h-9 mx-auto rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS (< lg) ── */}
          <div className="lg:hidden divide-y divide-slate-100 dark:divide-border">
            <AnimatePresence>
              {items.map((item, idx) => {
                const invalid = hasTriedSubmit && !isItemValid(item);
                const mg = calcMargin(item.price_a, item.price_v);
                return (
                  <motion.div
                    key={item.tempId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-5 space-y-3 transition-colors ${invalid ? 'bg-rose-50/60 dark:bg-rose-500/5' : ''}`}
                  >
                    {/* Row # + code search + delete */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-300 dark:text-muted-foreground/30 w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 z-10" size={13} />
                        <input
                          className={codeInputCls(item)}
                          placeholder={t.products.codeBarcodeLabel}
                          value={item.searchCode}
                          onChange={e => handleCodeSearch(item.tempId, e.target.value)}
                          onBlur={() => setTimeout(() => updateItem(item.tempId, { showResults: false }), 200)}
                        />
                        {item.id && !item.isNew && (
                          <div className="absolute -right-1 -top-3.5 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1 z-20 whitespace-nowrap">
                            <FiBox size={9} />
                            <span>{t.products.currentStockBadge.replace('{stock}', String(item.currentStock ?? 0))}</span>
                          </div>
                        )}
                        <SearchDropdown item={item} />
                      </div>
                      <button
                        onClick={() => removeItem(item.tempId)}
                        disabled={items.length === 1}
                        className="w-9 h-9 flex-shrink-0 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white disabled:opacity-20 transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    {/* Toggle + Name */}
                    <div className="flex items-center gap-2">
                      <NewToggle item={item} />
                      <input
                        className={nameInputCls(item)}
                        placeholder={t.products.productNameHeader}
                        value={item.name}
                        onChange={e => updateItem(item.tempId, { name: e.target.value })}
                      />
                    </div>

                    {/* New product fields */}
                    {item.isNew && <NewProductFields item={item} />}

                    {/* Qty + prices */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-wide block text-center">
                          {t.common.quantity}
                        </label>
                        {makeNumInput(item, "quantity", qtyInputCls(item), "0")}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-wide block text-center">
                          {t.edit.purchasePrice}
                        </label>
                        {makeNumInput(item, "price_a", buyInputCls(item), "0")}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-wide block text-center">
                          {t.edit.sellingPrice}
                        </label>
                        <div className="relative">
                          {makeNumInput(item, "price_v", sellInputCls(item), "0")}
                          {mg !== null && (
                            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                              +{mg}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expiry */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-wide">
                        {t.edit.expirationDate}
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={12} />
                        <input
                          type="date"
                          className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 rounded-xl py-3 pl-8 pr-3 outline-none font-bold text-slate-600 dark:text-foreground text-sm transition-all"
                          value={item.expirationDate}
                          onChange={e => updateItem(item.tempId, { expirationDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div className="p-6 lg:p-8 bg-slate-50/30 dark:bg-secondary/20 flex flex-wrap justify-between items-center gap-4 border-t border-slate-100 dark:border-border">
            <button
              onClick={() => { setItems([makeItem(today)]); setHasTriedSubmit(false); }}
              className="px-5 py-3 bg-white dark:bg-secondary text-slate-400 dark:text-muted-foreground rounded-xl border border-slate-200 dark:border-border hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all font-bold text-xs flex items-center gap-2"
            >
              <FiX size={14} />
              {t.products.clearItems}
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 lg:px-12 py-4 lg:py-5 bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-[1.5rem] font-black text-base lg:text-lg shadow-2xl shadow-slate-900/20 flex items-center gap-3 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave size={20} strokeWidth={3} />
                  <span>{t.products.submitInvoice}</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
