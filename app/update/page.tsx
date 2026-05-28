'use client'

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getAllProducts, updateQuantitePrice } from "../utlis/actions";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import {
  FiPlus,
  FiSearch,
  FiBox,
  FiDollarSign,
  FiArrowRight,
  FiSave,
  FiZap,
  FiBarChart2,
  FiInfo,
  FiFileText
} from "react-icons/fi";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";

type Product = {
  id: string;
  code: number;
  name: string;
  quantity: number;
  price_v: number;
  price_a: number;
  expirationDate: Date;
  codeBar: string | null;
};

type User = {
  id: string;
  nom: string;
  admin: boolean;
};

export default function UpdateProductPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [priceV, setPriceV] = useState<number | "">("");
  const [priceA, setPriceA] = useState<number | "">("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (!userData.admin) router.push("/");
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  useEffect(() => {
    if (search.trim() !== "") {
      const foundProduct = products.find(
        (p) => p.code.toString() === search || p.codeBar === search
      );

      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setQuantity(0);
        setPriceV(foundProduct.price_v);
        setPriceA(foundProduct.price_a);
      } else {
        setSelectedProduct(null);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [search, products]);

  const handleUpdate = async () => {
    if (!selectedProduct) return;

    if (Number(quantity) < 0) {
      Swal.fire({ icon: "error", title: t.common.error, text: t.update.negativeQuantityError, customClass: { popup: 'rounded-3xl' } });
      return;
    }

    if (Number(priceV) <= Number(priceA)) {
      Swal.fire({ icon: "error", title: t.common.error, text: t.update.priceError, customClass: { popup: 'rounded-3xl' } });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: t.update.confirmTitle,
      text: t.update.confirmText.replace('{quantity}', String(quantity)).replace('{name}', selectedProduct.name),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.update.confirmBtn,
      cancelButtonText: t.common.cancel,
      customClass: {
        confirmButton: 'bg-primary rounded-xl px-6 py-3',
        cancelButton: 'bg-secondary rounded-xl px-6 py-3 text-foreground',
        popup: 'rounded-[2rem]'
      }
    });

    if (isConfirmed) {
      Swal.fire({ title: t.common.updating, allowOutsideClick: false, didOpen: () => Swal.showLoading(), customClass: { popup: 'rounded-2xl' } });

      const newQuantity = selectedProduct.quantity + Number(quantity);
      const result = await updateQuantitePrice(
        selectedProduct.id,
        newQuantity,
        Number(priceV),
        Number(priceA),
        user?.id,
        Number(quantity)
      );

      Swal.close();

      if (result.success) {
        toastSuccess();
        fetchProducts();
        setSelectedProduct(null);
        setSearch("");
      } else {
        Swal.fire({ icon: "error", title: t.common.error, text: result.error || t.update.updateError, customClass: { popup: 'rounded-2xl' } });
      }
    }
  };

  const toastSuccess = () => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    Toast.fire({ icon: 'success', title: t.update.updateSuccess });
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#fafafa] dark:bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-16 px-4 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-1/3 h-1/3 bg-primary/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [-50, 50, -50] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto relative z-10"
      >
        <div className="bg-white/80 dark:bg-card/90 dark:border dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header Section */}
          <div className="p-10 text-center bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6"
            >
              <FiZap size={32} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.update.quickUpdate}
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">{t.update.subtitle}</p>
          </div>

          <div className="p-10 space-y-8">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 bg-emerald-500 text-white font-black py-4.5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all border-b-4 border-emerald-700 active:border-b-0"
                onClick={() => router.push("/products/add")}
              >
                <FiPlus size={22} strokeWidth={3} />
                <span>{t.update.newProduct}</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-3 bg-white dark:bg-secondary text-slate-900 dark:text-foreground font-black py-4.5 rounded-2xl shadow-lg shadow-slate-900/5 hover:bg-slate-50 dark:hover:bg-secondary/80 transition-all border-b-4 border-slate-200 dark:border-border active:border-b-0 border"
                onClick={() => router.push("/products/purchase")}
              >
                <FiFileText size={22} className="text-primary" />
                <span>{t.products.purchaseInvoice}</span>
              </motion.button>
            </div>

            <div className="relative group">
              <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">{t.update.quickSearch}</label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors text-xl" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4.5 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40 placeholder:font-medium"
                  placeholder={t.update.searchPlaceholder}
                  autoFocus
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedProduct ? (
                <motion.div
                  key="product-found"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-4"
                >
                  {/* Info Card */}
                  <div className="p-6 rounded-3xl bg-primary/[0.03] dark:bg-primary/5 border-2 border-primary/5 dark:border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <FiBox size={80} />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-card dark:border dark:border-border rounded-xl shadow-sm flex items-center justify-center text-primary">
                        <FiBox size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-foreground leading-tight">{selectedProduct.name}</h3>
                        <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground mt-1 flex items-center gap-2">
                          <FiBarChart2 />
                          {t.update.codeLabel}: {selectedProduct.code} &nbsp;•&nbsp;
                          <span className="text-primary">{t.update.currentLabel}: {selectedProduct.quantity}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.update.quantityToAdd}</label>
                      <div className="relative group">
                        <FiPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors text-xl" />
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-black text-slate-700 text-lg"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.update.purchasePrice}</label>
                        <div className="relative group">
                          <FiArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="number"
                            value={priceA}
                            onChange={(e) => setPriceA(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-indigo-500/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-10 pr-2 outline-none transition-all font-bold text-slate-700"
                            placeholder={t.update.buyPlaceholder}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.update.sellingPrice}</label>
                        <div className="relative group">
                          <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <input
                            type="number"
                            value={priceV}
                            onChange={(e) => setPriceV(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-10 pr-2 outline-none transition-all font-black text-primary"
                            placeholder={t.update.sellPlaceholder}
                          />
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdate}
                      className="w-full bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all mt-4"
                    >
                      <FiSave size={20} />
                      <span>{t.update.confirmUpdate}</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : search.trim() !== "" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 text-center text-slate-400 dark:text-muted-foreground font-bold bg-slate-50 dark:bg-secondary rounded-2xl border border-dashed border-slate-200 dark:border-border"
                >
                  <FiInfo className="mx-auto mb-2 text-2xl" />
                  <p>{t.update.noMatch}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Help Badge */}
        <div className="mt-8 flex justify-center">
          <div className="px-5 py-2.5 rounded-full bg-white/50 dark:bg-card/50 border border-white dark:border-white/5 backdrop-blur-md shadow-sm flex items-center gap-3 text-xs font-black text-slate-500 dark:text-muted-foreground uppercase tracking-tighter">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.update.scanActive}</span>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .py-4\.5 {
          padding-top: 1.125rem;
          padding-bottom: 1.125rem;
        }
      `}</style>
    </div>
  );
}
