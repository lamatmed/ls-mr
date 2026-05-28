'use client'

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { getProductById, updateProduct, getAllCategories, getAllFournisseurs } from "../utlis/actions";
import {
  FiEdit, FiSave, FiArrowLeft, FiPackage, FiDollarSign,
  FiShoppingCart, FiCalendar, FiBarChart2, FiEye,
  FiTrendingUp, FiBox, FiZap, FiList, FiTruck
} from "react-icons/fi";
import Loader from "./Loader";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function EditProduct({ id }: { id: string }) {
  const router = useRouter();
  const { t, currency } = useLanguage();

  const [code, setCode] = useState("0");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [price_v, setPriceV] = useState("0");
  const [price_a, setPriceA] = useState("0");
  const [expirationDate, setExpirationDate] = useState("");
  const [codeBar, setCodeBar] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [fournisseurId, setFournisseurId] = useState<string>("");
  const [fournisseurs, setFournisseurs] = useState<{ id: string; name: string }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cats, fourns] = await Promise.all([getAllCategories(), getAllFournisseurs()]);
      setCategories(cats);
      setFournisseurs(fourns);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const product = await getProductById(id);
      if (!product || "error" in product) {
        toast.error(t.edit.notFound);
        router.push("/products");
        return;
      }
      setCode(product.code?.toString() || "0");
      setName(product.name || "");
      setQuantity(product.quantity?.toString() || "0");
      setPriceV(product.price_v?.toString() || "0");
      setPriceA(product.price_a?.toString() || "0");
      setExpirationDate(
        product.expirationDate ? new Date(product.expirationDate).toISOString().split("T")[0] : ""
      );
      setCodeBar(product.codeBar || "");
      setCategoryId(product.categoryId || "");
      setFournisseurId(product.fournisseurId || "");
    } catch {
      toast.error(t.common.error);
      router.push("/products");
    }
  }, [id, router, t]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleUpdate = async () => {
    if (!code || !name || !quantity || !price_v || !price_a || !expirationDate) {
      Swal.fire({
        icon: "warning",
        title: t.edit.validation.incomplete,
        text: t.edit.validation.allFieldsRequired,
        customClass: { popup: 'rounded-3xl' }
      });
      return;
    }
    if (parseFloat(price_v) <= parseFloat(price_a)) {
      Swal.fire({
        icon: "error",
        title: t.edit.validation.priceError,
        text: t.edit.validation.priceMustBeHigher,
        customClass: { popup: 'rounded-3xl' }
      });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: t.edit.saveConfirm,
      text: t.edit.saveConfirmDesc,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.edit.yesSave,
      cancelButtonText: t.common.cancel,
      customClass: {
        confirmButton: 'bg-primary rounded-xl px-6 py-3',
        cancelButton: 'bg-secondary rounded-xl px-6 py-3 text-foreground',
        popup: 'rounded-[2rem]'
      }
    });
    if (!isConfirmed) return;

    Swal.fire({
      title: t.edit.updating,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'rounded-2xl' }
    });

    const response = await updateProduct(
      id,
      parseInt(code),
      name,
      parseInt(quantity),
      parseFloat(price_v),
      parseFloat(price_a),
      expirationDate,
      codeBar,
      categoryId === "" ? null : categoryId,
      fournisseurId === "" ? null : fournisseurId
    );

    Swal.close();

    if (response.error) {
      Swal.fire({ icon: "error", title: t.common.error, text: response.error });
    } else {
      toast.success(t.edit.updateSuccess);
      router.push("/products");
    }
  };

  if (pageLoading) return (
    <div className="flex items-center justify-center h-screen bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  const profit = parseFloat(price_v) - parseFloat(price_a);
  const marginPct = parseFloat(price_a) > 0
    ? ((profit / parseFloat(price_a)) * 100).toFixed(1)
    : "0";
  const inStock = parseInt(quantity) > 10;

  return (
    <div className="relative min-h-screen py-10 px-4 flex flex-col items-center bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [-20, 20, -20] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], y: [-30, 30, -30] }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-[0%] right-[0%] w-[45%] h-[45%] bg-indigo-500/5 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-400 dark:text-muted-foreground hover:text-primary font-bold transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-card border border-border/50 flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-sm">
            <FiArrowLeft size={16} />
          </div>
          <span className="text-sm">{t.edit.backToList}</span>
        </button>

        <div className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">

          {/* Header */}
          <div className="p-8 md:p-10 border-b border-slate-100 dark:border-border bg-slate-50/30 dark:bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <FiEdit size={26} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
                    {t.edit.title.split(t.edit.titleHighlight)[0]}
                    <span className="text-primary italic">{t.edit.titleHighlight}</span>
                  </h1>
                  <p className="text-slate-400 dark:text-muted-foreground font-medium text-sm mt-1">
                    {t.edit.id.replace('{id}', id.substring(0, 8))}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${inStock ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {inStock ? t.edit.available : t.edit.lowStock}
              </span>
            </div>

            {/* Insight Badges */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="p-4 rounded-2xl bg-white dark:bg-secondary border border-slate-100 dark:border-border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-2">{t.edit.totalProfit}</p>
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-500 flex-shrink-0" size={16} />
                  <p className="text-base font-black text-slate-700 dark:text-foreground">
                    {profit.toFixed(2)} <span className="text-[10px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-secondary border border-slate-100 dark:border-border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-2">{t.edit.profitMargin}</p>
                <div className="flex items-center gap-2">
                  <FiZap className="text-amber-500 flex-shrink-0" size={16} />
                  <p className="text-base font-black text-slate-700 dark:text-foreground">
                    {t.edit.profitMarginValue.replace('{percentage}', marginPct)}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-secondary border border-slate-100 dark:border-border shadow-sm">
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-2">{t.edit.stockVolume}</p>
                <div className="flex items-center gap-2">
                  <FiBox className="text-blue-500 flex-shrink-0" size={16} />
                  <p className="text-base font-black text-slate-700 dark:text-foreground">
                    {t.edit.stockVolumeValue.replace('{quantity}', quantity)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 md:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Left — Basic Details */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-r-4 border-primary pr-3">
                  {t.edit.basicDetails}
                </h3>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                    {t.edit.itemName}
                  </label>
                  <div className="relative group">
                    <FiPackage className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 text-right"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Barcode */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                    {t.edit.barcode}
                  </label>
                  <div className="relative group">
                    <FiBarChart2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 font-mono text-right"
                      value={codeBar}
                      onChange={e => setCodeBar(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category + Supplier */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                      {t.edit.category}
                    </label>
                    <div className="relative group">
                      <FiList className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={14} />
                      <select
                        className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 appearance-none text-right"
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                      >
                        <option value="">{t.edit.categoryPlaceholder}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                      {t.edit.supplier}
                    </label>
                    <div className="relative group">
                      <FiTruck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={14} />
                      <select
                        className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 appearance-none text-right"
                        value={fournisseurId}
                        onChange={e => setFournisseurId(e.target.value)}
                      >
                        <option value="">{t.edit.supplierPlaceholder}</option>
                        {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* System code (read-only) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                    {t.edit.systemCode}
                  </label>
                  <div className="relative">
                    <FiEye className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={16} />
                    <input
                      readOnly
                      className="w-full bg-slate-100 dark:bg-secondary/50 dark:text-muted-foreground border-2 border-transparent rounded-2xl py-4 pr-12 pl-4 outline-none font-bold text-slate-400 text-right"
                      value={code}
                    />
                  </div>
                </div>
              </div>

              {/* Right — Inventory & Pricing */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] border-r-4 border-amber-500 pr-3">
                  {t.edit.inventoryPrices}
                </h3>

                {/* Stock */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                    {t.edit.currentStock}
                  </label>
                  <div className="relative group">
                    <FiShoppingCart className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      type="number"
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 text-right"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                {/* Buy + Sell prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                      {t.edit.purchasePrice}
                    </label>
                    <div className="relative group">
                      <FiDollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" size={16} />
                      <input
                        type="number"
                        className="w-full bg-indigo-50/60 dark:bg-indigo-500/10 border-2 border-transparent focus:border-indigo-400/30 rounded-2xl py-4 pr-10 pl-2 outline-none transition-all font-black text-indigo-700 dark:text-indigo-300 text-right"
                        value={price_a}
                        onChange={e => setPriceA(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                      {t.edit.sellingPrice}
                    </label>
                    <div className="relative group">
                      <FiDollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-emerald-500 transition-colors" size={16} />
                      <input
                        type="number"
                        className="w-full bg-emerald-50/60 dark:bg-emerald-500/10 border-2 border-transparent focus:border-emerald-400/30 rounded-2xl py-4 pr-10 pl-2 outline-none transition-all font-black text-emerald-700 dark:text-emerald-300 text-right"
                        value={price_v}
                        onChange={e => setPriceV(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Expiry */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                    {t.edit.expirationDate}
                  </label>
                  <div className="relative group">
                    <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      type="date"
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pr-12 pl-4 outline-none transition-all font-bold text-slate-700 text-right"
                      value={expirationDate}
                      onChange={e => setExpirationDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 flex gap-4 border-t border-slate-100 dark:border-border">
              <button
                onClick={() => router.push("/products")}
                className="flex-1 py-[1.125rem] rounded-[1.25rem] bg-slate-100 dark:bg-secondary hover:bg-slate-200 dark:hover:bg-secondary/80 text-slate-600 dark:text-muted-foreground font-black transition-all"
              >
                {t.common.cancel}
              </button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdate}
                className="flex-[2] py-[1.125rem] bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all"
              >
                <FiSave size={20} />
                <span>{t.edit.saveChanges}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
