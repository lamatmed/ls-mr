'use client'

import { useEffect, useState } from "react";
import { getAllTransactions, deleteTransaction } from "../utlis/actions";
import {
  FiBox,
  FiHash,
  FiPlus,
  FiCalendar,
  FiTrash2,
  FiSearch,
  FiActivity,
  FiFilter,
  FiXCircle
} from "react-icons/fi";
import Swal from "sweetalert2";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

interface Transaction {
  id: string;
  product: { name: string; code: number } | null;
  quantity: number;
  date: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const data = await getAllTransactions();
      const formatted = data.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? tx.date : tx.date.toISOString(),
      }));
      setTransactions(formatted);
      setFilteredTransactions(formatted);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let filtered = [...transactions];

    if (startDate) {
      filtered = filtered.filter(tx => new Date(tx.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(tx => new Date(tx.date) <= end);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.product?.name.toLowerCase().includes(q) ||
        tx.product?.code.toString() === q
      );
    }

    setFilteredTransactions(filtered);
  }, [startDate, endDate, searchQuery, transactions]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: t.transactions.deleteConfirm,
      text: t.transactions.deleteWarning,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.transactions.confirmDelete,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const res = await deleteTransaction(id);
      if (res.success) {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        }).fire({ icon: 'success', title: t.transactions.deleteSuccess });
      } else {
        Swal.fire({
          icon: "error",
          title: t.common.error,
          text: t.transactions.deleteError,
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

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
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-1/3 h-1/3 bg-primary/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute bottom-[10%] -right-[10%] w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiActivity size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.transactions.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.transactions.titlePrefix} <span className="text-primary italic">{t.transactions.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-md">{t.transactions.subtitle}</p>
          </motion.div>

          {/* Quick stat */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                <FiPlus size={24} strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.transactions.addedItems}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">
                  {filteredTransactions.reduce((acc, tx) => acc + tx.quantity, 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Search */}
          <div className="md:col-span-1 relative group">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t.transactions.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-4 bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 dark:focus:border-primary/30 transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40 text-right"
            />
          </div>

          {/* Start date */}
          <div className="relative group">
            <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pr-11 pl-4 py-4 bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 dark:focus:border-primary/30 transition-all font-bold text-slate-700 dark:text-foreground text-right"
            />
          </div>

          {/* End date */}
          <div className="relative group">
            <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pr-11 pl-4 py-4 bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 dark:focus:border-primary/30 transition-all font-bold text-slate-700 dark:text-foreground text-right"
            />
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground rounded-2xl hover:bg-slate-200 dark:hover:bg-secondary/70 transition-all font-bold tracking-tight"
          >
            <FiXCircle />
            <span>{t.transactions.clearFilter}</span>
          </button>
        </motion.div>

        {/* Table card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader />
              <p className="text-slate-400 dark:text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">{t.transactions.loadingData}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground/30 mb-6 border border-slate-100 dark:border-border">
                <FiFilter size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.transactions.noTransactions}</h3>
              <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">{t.transactions.noTransactionsDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.transactions.table.productCode}</th>
                    <th className="px-8 py-6 text-center text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.transactions.table.movement}</th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.transactions.table.timestamp}</th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.transactions.table.actions}</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50 dark:divide-border"
                >
                  <AnimatePresence>
                    {filteredTransactions.map((tx) => (
                      <motion.tr
                        key={tx.id}
                        variants={itemVariants}
                        layout
                        className="hover:bg-slate-50/50 dark:hover:bg-secondary/40 transition-all group"
                      >
                        {/* Product */}
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-400 dark:text-muted-foreground group-hover:bg-white dark:group-hover:bg-secondary/70 transition-colors border border-slate-100 dark:border-border group-hover:border-primary/20">
                              <FiBox size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">
                                {tx.product?.name || t.transactions.deletedProduct}
                              </p>
                              <p className="text-xs font-bold text-primary mt-0.5 flex items-center gap-1">
                                <FiHash size={12} /> {tx.product?.code || '---'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Quantity badge */}
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs tracking-tighter shadow-sm border border-emerald-100/50 dark:border-emerald-500/10">
                            <FiPlus strokeWidth={3} />
                            {tx.quantity}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-foreground/80">
                              <FiCalendar className="text-slate-400 dark:text-muted-foreground" />
                              {new Date(tx.date).toLocaleDateString()}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground mt-1 uppercase tracking-widest pr-5">
                              {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* Delete action */}
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(tx.id)}
                            className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white"
                            title={t.transactions.table.actions}
                          >
                            <FiTrash2 size={18} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
