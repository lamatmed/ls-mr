'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { addProduct, getLastProductCode, getAllCategories, getAllFournisseurs } from "@/app/utlis/actions";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  FiPlus,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiHash,
  FiArrowLeft,
  FiBox,
  FiList,
  FiTruck
} from "react-icons/fi";
import Loader from "@/app/components/Loader";
import { motion } from "framer-motion";

export default function AddProduct() {
  const { t } = useLanguage();
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price_v, setPriceV] = useState("");
  const [price_a, setPriceA] = useState("");
  const today = new Date().toISOString().split('T')[0];
  const [expirationDate, setExpirationDate] = useState(today);
  const [codeBar, setCodeBar] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [fournisseurId, setFournisseurId] = useState<string>("");
  const [fournisseurs, setFournisseurs] = useState<{id: string, name: string}[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchCatsAndFournisseurs = async () => {
      const dbCategories = await getAllCategories();
      setCategories(dbCategories);
      const dbFournisseurs = await getAllFournisseurs();
      setFournisseurs(dbFournisseurs);
    };
    fetchCatsAndFournisseurs();
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
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
    const fetchLastCode = async () => {
      try {
        const lastCode: number | null = await getLastProductCode();
        const newCode = lastCode !== null ? lastCode + 1 : 1;
        setCode(newCode.toString());
      } catch {
        // silent
      }
    };
    fetchLastCode();
  }, []);

  const generateUniqueBarcode = () => {
    return `BC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const fixBarcode = (str: string) => {
    const map: { [key: string]: string } = {
      '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
      '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '*': '8', ')': '0',
    };
    return str.split('').map(char => map[char] || char).join('');
  };

  const handleAddProduct = async () => {
    if (!code || !name || !quantity || !price_v || !price_a || !expirationDate) {
      Swal.fire({
        icon: "warning",
        title: t.edit.validation.incomplete,
        text: t.edit.validation.allFieldsRequired,
        customClass: { popup: 'rounded-3xl' }
      });
      return;
    }

    if (parseInt(quantity) < 0) {
      Swal.fire({
        icon: "error",
        title: t.common.error,
        text: t.update.negativeQuantityError,
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
      title: t.products.confirmAddTitle,
      text: t.products.confirmAddText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.products.confirmCreate,
      cancelButtonText: t.common.cancel,
      customClass: {
        confirmButton: 'bg-primary rounded-xl px-6 py-3',
        cancelButton: 'bg-secondary rounded-xl px-6 py-3 text-foreground',
        popup: 'rounded-[2rem]'
      }
    });

    if (isConfirmed) {
      Swal.fire({ title: t.categories.creating, allowOutsideClick: false, didOpen: () => Swal.showLoading(), customClass: { popup: 'rounded-2xl' } });

      const finalCodeBar = codeBar.trim() !== "" ? codeBar : generateUniqueBarcode();
      const response = await addProduct(
        parseInt(code),
        name,
        parseInt(quantity),
        parseFloat(price_v),
        parseFloat(price_a),
        expirationDate,
        finalCodeBar,
        categoryId === "" ? null : categoryId,
        fournisseurId === "" ? null : fournisseurId
      );

      Swal.close();

      if (response.error) {
        Swal.fire({ icon: "error", title: t.common.error, text: response.error });
      } else {
        toast.success(t.products.addSuccess);
        router.push("/products");
      }
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fafafa] dark:bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-16 px-4 flex flex-col items-center bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/3 h-1/3 bg-emerald-500/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] -left-[10%] w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-400 dark:text-muted-foreground hover:text-primary font-bold transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-card border border-border/50 dark:border-border flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <FiArrowLeft size={16} />
          </div>
          <span className="text-sm">{t.common.back}</span>
        </button>

        <div className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header Section */}
          <div className="p-10 text-center bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
            <motion.div
              initial={{ scale: 0.9, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6"
            >
              <FiBox size={32} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.products.addTitle}
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">{t.products.addSubtitle}</p>
          </div>

          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Info Group */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] border-r-4 border-primary pr-3">{t.products.identification}</h3>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mr-1">{t.edit.itemName}</label>
                  <div className="relative group">
                    <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40 text-right"
                      placeholder={t.edit.itemName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mr-1">{t.products.barcodeOptional}</label>
                  <div className="relative group">
                    <FiBarChart2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 font-mono placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40 text-right"
                      placeholder={t.products.scanCode}
                      value={codeBar}
                      onChange={(e) => setCodeBar(fixBarcode(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.category}</label>
                    <div className="relative group">
                      <FiList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                      <select
                        className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 appearance-none text-right"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">{t.edit.categoryPlaceholder}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.supplier}</label>
                    <div className="relative group">
                      <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                      <select
                        className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 appearance-none text-right"
                        value={fournisseurId}
                        onChange={(e) => setFournisseurId(e.target.value)}
                      >
                        <option value="">{t.edit.supplierPlaceholder}</option>
                        {fournisseurs.map((fournisseur) => (
                          <option key={fournisseur.id} value={fournisseur.id}>{fournisseur.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.systemCode}</label>
                  <div className="relative group">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" />
                    <input
                      className="w-full bg-slate-100 dark:bg-secondary dark:text-foreground border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 outline-none font-bold text-slate-900"
                      value={code}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Inventory & Pricing Group */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] border-r-4 border-amber-500 pr-3">{t.edit.inventoryPrices}</h3>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.products.initialQuantity}</label>
                  <div className="relative group">
                    <FiPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                      type="number"
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 text-lg text-right placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.purchasePrice}</label>
                    <div className="relative group">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="number"
                        className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-indigo-500/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-10 pr-2 outline-none transition-all font-black text-slate-700 text-right"
                        placeholder="0.00"
                        value={price_a}
                        onChange={(e) => setPriceA(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.sellingPrice}</label>
                    <div className="relative group">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                      <input
                        type="number"
                        className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-10 pr-2 outline-none transition-all font-black text-primary text-right"
                        placeholder="0.00"
                        value={price_v}
                        onChange={(e) => setPriceV(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.edit.expirationDate}</label>
                  <div className="relative group">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                      type="date"
                      className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/10 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-slate-700 text-right"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value || today)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddProduct}
              className="w-full py-5 bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all mt-4"
            >
              <FiPlus size={24} strokeWidth={3} />
              <span>{t.products.addToStock}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
