'use client'

import { useState, useEffect } from "react";
import { getAllProducts, deleteProduct, deleteAllProducts, getAllCategories } from '../utlis/actions';
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiAlertTriangle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiBox,
  FiBarChart2,
  FiDollarSign,
  FiCalendar,
  FiZap,
  FiList,
  FiFileText
} from "react-icons/fi";
import Swal from "sweetalert2"
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

type Product = {
  id: string;
  code: number;
  name: string;
  quantity: number;
  price_v: number;
  price_a: number;
  expirationDate: string;
  codeBar?: string | null;
  category?: { name: string } | null;
  categoryId?: string | null;
  fournisseur?: { name: string } | null;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { t, currency } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (!userData.admin) router.push('/');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const data = await getAllProducts();
    const formattedData = data.map((product) => ({
      ...product,
      expirationDate: new Date(product.expirationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    }));
    setProducts(formattedData);
    setFilteredProducts(formattedData);
    const catsData = await getAllCategories();
    setCategories(catsData);
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const result = await Swal.fire({
      title: t.products.deleteConfirm,
      text: t.products.deleteWarning,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.products.confirmDelete,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const response = await deleteProduct(id);
      if (response.success) {
        fetchProducts();
        toast.success(t.products.deleteSuccess);
      } else {
        toast.error(response.error || t.products.deleteError);
      }
    }
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: t.products.deleteAllConfirm,
      text: t.products.deleteAllWarning,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.products.confirmDeleteAll,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteAllProducts();
        if (response.success) {
          toast.success(t.products.resetSuccess);
          fetchProducts();
        } else {
          toast.error(response.error || t.products.generalError);
        }
      } catch {
        toast.error(t.products.generalError);
      }
    }
  };

  const applyFilters = (searchText: string, categoryId: string) => {
    const value = searchText.toLowerCase();
    const filtered = products.filter((p) => {
      const matchSearch =
        p.code.toString() === value ||
        p.codeBar?.toLowerCase() === value ||
        p.name.toLowerCase().includes(value);
      const matchCategory = categoryId === "all" || p.categoryId === categoryId;
      return matchSearch && matchCategory;
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    applyFilters(e.target.value, selectedCategory);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    applyFilters(search, e.target.value);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-10%] -right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiBox size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.products.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.products.titlePrefix} <span className="text-primary italic">{t.products.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-md">{t.products.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:bg-primary/90 transition-all font-black text-sm tracking-wide"
              onClick={() => router.push("/products/add")}
            >
              <FiPlus size={20} strokeWidth={3} />
              <span>{t.products.addItem}</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-white dark:bg-card text-slate-900 dark:text-foreground border border-slate-200 dark:border-border rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/10 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-secondary transition-all font-black text-sm tracking-wide"
              onClick={() => router.push("/products/purchase")}
            >
              <FiFileText size={20} className="text-primary" />
              <span>{t.products.purchaseInvoice}</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeleteAll}
              className="px-8 py-4 bg-white dark:bg-card text-slate-600 dark:text-muted-foreground rounded-2xl border border-slate-200 dark:border-border hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/20 transition-all font-bold text-sm flex items-center gap-3 shadow-sm"
            >
              <FiAlertTriangle size={20} />
              <span>{t.products.reset}</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Filters & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 relative group">
            <FiList className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/30 group-focus-within:text-primary transition-colors text-xl pointer-events-none" />
            <select
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 dark:focus:border-primary/30 transition-all font-bold text-slate-700 dark:text-foreground appearance-none"
              value={selectedCategory}
              onChange={handleCategoryFilter}
            >
              <option value="all">{t.products.allCategories}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1 relative group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/30 group-focus-within:text-primary transition-colors text-xl pointer-events-none" />
            <input
              className="w-full pl-14 pr-6 py-5 bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 dark:focus:border-primary/30 transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30"
              type="text"
              placeholder={t.products.searchPlaceholder}
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="bg-white dark:bg-card p-5 rounded-3xl border border-slate-100 dark:border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <FiBarChart2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.totalStock}</p>
              <p className="text-xl font-black text-slate-900 dark:text-foreground">
                {filteredProducts.reduce((acc, p) => acc + p.quantity, 0)}{' '}
                <span className="text-xs text-slate-400 dark:text-muted-foreground ml-1 italic font-medium">{t.common.unit}</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-card p-5 rounded-3xl border border-slate-100 dark:border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <FiZap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.stockValue}</p>
              <p className="text-xl font-black text-slate-900 dark:text-foreground">
                {filteredProducts.reduce((acc, p) => acc + (p.price_a * p.quantity), 0).toLocaleString()}{' '}
                <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-black italic">{currency}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader />
              <p className="text-slate-400 dark:text-muted-foreground/40 font-black uppercase tracking-[0.2em] text-xs">{t.products.syncing}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground/30 mb-6"
              >
                <FiSearch size={40} />
              </motion.div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">{t.products.noResults}</h3>
              <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">
                {t.products.noResultsFor.replace('{search}', search)}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.id}</th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.name}</th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.categorySupplier}</th>
                    <th className="px-8 py-6 text-center text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.quantity}</th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.prices}</th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.expirationDate}</th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.products.table.actions}</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50 dark:divide-border"
                >
                  <AnimatePresence>
                    {currentProducts.map((p) => (
                      <motion.tr
                        key={p.id}
                        variants={itemVariants}
                        layout
                        className="hover:bg-slate-50/50 dark:hover:bg-secondary/40 transition-all group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 dark:text-foreground tracking-wider">#{p.code}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground font-mono tracking-tighter">{p.codeBar || '---'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{p.name}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col gap-2 items-start">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-3 py-1 rounded-full uppercase tracking-widest">
                              {t.products.category.replace('{name}', p.category?.name || t.products.noCategory)}
                            </span>
                            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              {t.products.supplier.replace('{name}', p.fournisseur?.name || t.products.noSupplier)}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tighter shadow-sm ${
                            p.quantity < 5
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {p.quantity} <span className="mr-1 opacity-60">{t.common.pieceShort}</span>
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-primary flex items-center gap-1">
                              {p.price_v.toLocaleString()} <span className="text-[10px] opacity-60">{currency}</span> <FiZap className="text-[10px]" />
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground">
                              {t.products.purchase.replace('{price}', p.price_a.toLocaleString())}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-muted-foreground">
                            <FiCalendar className="text-slate-300 dark:text-muted-foreground/30" />
                            {p.expirationDate}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <div className="flex justify-start gap-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                              onClick={() => router.push(`/products/${p.id}`)}
                            >
                              <FiEdit2 size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              <FiTrash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        <AnimatePresence>
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-10 px-8 py-6 bg-white/50 dark:bg-card/50 backdrop-blur-md rounded-[2.5rem] border border-white dark:border-white/5 shadow-sm"
            >
              <div className="text-xs font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">
                {t.common.page}{' '}
                <span className="text-slate-900 dark:text-foreground italic font-black">{currentPage}</span>
                {' '}—{' '}
                <span className="text-slate-900 dark:text-foreground italic font-black">{totalPages}</span>
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    currentPage === 1
                      ? "bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground/30 cursor-not-allowed"
                      : "bg-white dark:bg-card text-slate-600 dark:text-muted-foreground border border-slate-100 dark:border-border hover:border-primary/20 shadow-sm"
                  }`}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft size={18} strokeWidth={3} />
                  <span>{t.common.previous}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    currentPage === totalPages
                      ? "bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground/30 cursor-not-allowed"
                      : "bg-primary text-white shadow-xl shadow-primary/20"
                  }`}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span>{t.common.next}</span>
                  <FiChevronRight size={18} strokeWidth={3} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
