/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDollarSign,
  FiPlus,
  FiList,
  FiFileText,
  FiTag,
  FiCalendar,
  FiBriefcase,
  FiHome,
  FiMoreHorizontal,
  FiSave,
  FiTrash2,
  FiAlertTriangle
} from "react-icons/fi";
import { addExpense, getExpenses, deleteExpense } from "../utlis/actions";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";

interface Expense {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { t, currency, lang } = useLanguage();
  const localeMap: Record<string, string> = { ar: 'ar-EG', fr: 'fr-FR', en: 'en-US', pt: 'pt-PT', es: 'es-ES' };
  const locale = localeMap[lang] ?? 'fr-FR';

  const [type, setType] = useState("رواتب العمال");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const expenseTypes = [
    { value: "رواتب العمال", label: t.depenses.types.salaries, icon: <FiBriefcase /> },
    { value: "إيجار", label: t.depenses.types.rent, icon: <FiHome /> },
    { value: "أخرى", label: t.depenses.types.other, icon: <FiMoreHorizontal /> },
  ];

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      toast.error(t.depenses.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/user').then(async res => {
      if (!res.ok) {
        router.push('/login');
      } else {
        const userData = await res.json();
        if (!userData.admin) {
          router.push('/');
        } else {
          fetchExpenses();
        }
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.warning(t.depenses.invalidAmount);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addExpense(type, Number(amount), description);
      if (result.success) {
        toast.success(t.depenses.addSuccess);
        setAmount("");
        setDescription("");
        setType("رواتب العمال");
        fetchExpenses();
      } else {
        toast.error(result.error || t.depenses.addError);
      }
    } catch {
      toast.error(t.depenses.serverError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteExpense(id);
      if (result.success) {
        toast.success(t.depenses.deleteSuccess);
        setDeleteConfirm(null);
        fetchExpenses();
      } else {
        toast.error(result.error || t.depenses.deleteError);
      }
    } catch {
      toast.error(t.depenses.serverError);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeIcon = (kind: string) => {
    if (kind.includes("رواتب")) return <FiBriefcase className="text-blue-500 dark:text-blue-400" />;
    if (kind.includes("إيجار")) return <FiHome className="text-emerald-500 dark:text-emerald-400" />;
    return <FiMoreHorizontal className="text-amber-500 dark:text-amber-400" />;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-background">
      <Loader />
    </div>
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#f8fafc] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], x: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1 w-8 bg-rose-500 rounded-full"></span>
              <span className="text-xs font-black text-rose-500 uppercase tracking-widest">{t.depenses.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">
              {t.depenses.titlePrefix} <span className="text-rose-500">{t.depenses.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 text-lg">{t.depenses.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 dark:bg-card text-white px-8 py-6 rounded-[2rem] shadow-2xl shadow-slate-900/20 dark:shadow-black/30 flex items-center gap-6 border border-transparent dark:border-border"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 dark:bg-rose-500/10 flex items-center justify-center">
              <FiDollarSign size={24} className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 dark:text-muted-foreground">{t.depenses.totalExpenses}</p>
              <p className="text-3xl font-black italic text-white dark:text-foreground">
                {totalExpenses.toLocaleString()} <span className="text-sm">{currency}</span>
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Add Expense Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            <div className="bg-white/70 dark:bg-card/90 backdrop-blur-xl p-10 rounded-[3rem] border border-white dark:border-white/5 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight italic mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                  <FiPlus size={20} />
                </div>
                {t.depenses.newExpense}
              </h3>

              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">
                    {t.depenses.expenseType}
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-500/20 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl px-6 py-4 appearance-none outline-none transition-all font-bold text-slate-800 dark:text-foreground"
                    >
                      {expenseTypes.map((et) => (
                        <option key={et.value} value={et.value}>{et.label}</option>
                      ))}
                    </select>
                    <FiTag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">
                    {t.depenses.amountLabel.replace('{currency}', currency)}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-500/20 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground text-left direction-ltr placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">
                    {t.depenses.detailsLabel}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.depenses.descriptionPlaceholder}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-rose-100 dark:focus:border-rose-500/20 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground resize-none placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-black dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 dark:shadow-black/20 disabled:opacity-70 mt-4"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><FiSave size={18} /> {t.depenses.save}</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Expenses List */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="bg-white/70 dark:bg-card/90 backdrop-blur-xl p-10 rounded-[3rem] border border-white dark:border-white/5 shadow-xl h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight italic flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground flex items-center justify-center">
                    <FiList size={20} />
                  </div>
                  {t.depenses.history}
                </h3>
                <span className="px-4 py-2 bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground rounded-xl text-xs font-bold">
                  {t.depenses.movementCount.replace('{count}', String(expenses.length))}
                </span>
              </div>

              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center h-64">
                  <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center mb-6">
                    <FiFileText size={32} className="text-slate-300 dark:text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest">{t.depenses.noExpenses}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {expenses.map((expense, index) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-6 bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md dark:hover:shadow-black/20 transition-shadow"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-secondary flex items-center justify-center">
                            {getTypeIcon(expense.type)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-foreground text-lg">
                              {expenseTypes.find(et => et.value === expense.type)?.label ?? expense.type}
                            </p>
                            <div className="flex items-center gap-2 mt-1 opacity-60">
                              <FiCalendar size={12} />
                              <span className="text-[10px] font-bold tracking-widest uppercase">
                                {new Date(expense.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {expense.description && (
                              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-2 font-medium">{expense.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left md:text-right">
                            <span className="block text-xl font-black text-rose-500 italic">
                              - {expense.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">
                              {currency}
                            </span>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-400 hover:text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all flex-shrink-0"
                            title={t.depenses.deleteBtn}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              className="bg-white dark:bg-card rounded-[2.5rem] p-10 shadow-2xl dark:shadow-black/40 max-w-md w-full border border-slate-100 dark:border-border"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                  <FiAlertTriangle size={28} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight">{t.depenses.deleteConfirmTitle}</h3>
                <p className="text-slate-500 dark:text-muted-foreground font-medium text-sm leading-relaxed">
                  {t.depenses.deleteQuestion}<br />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.depenses.deleteNote}</span>
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-[1.5rem] border-2 border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-secondary transition-all disabled:opacity-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={() => handleDeleteExpense(deleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-[1.5rem] bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiTrash2 size={15} /> {t.depenses.deleteBtn}</>
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
