/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiSearch,
  FiPlus,
  FiInfo,
  FiArrowLeft,
  FiArrowRight
} from "react-icons/fi";
import { getDebts, addDebtPayment } from "../utlis/actions";
import Loader from "../components/Loader";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useLanguage } from "../context/LanguageContext";

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const { t, currency } = useLanguage();
  const itemsPerPage = 3;

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
    fetchDebts();
  }, [router]);

  const fetchDebts = async () => {
    setIsLoading(true);
    try {
      const data = await getDebts();
      setDebts(data);
    } catch {
      toast.error(t.dettes.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (debt: any) => {
    const { value: amount } = await Swal.fire({
      title: t.dettes.recordPaymentTitle,
      input: 'number',
      inputLabel: t.dettes.remainingAmount.replace('{amount}', debt.remaining.toFixed(0)).replace('{currency}', currency),
      inputPlaceholder: t.dettes.paymentInputPlaceholder,
      showCancelButton: true,
      confirmButtonText: t.common.confirm,
      cancelButtonText: t.common.cancel,
      confirmButtonColor: '#10b981',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return t.dettes.invalidAmountError;
        if (Number(value) > debt.remaining) return t.dettes.exceedsDebtError;
      },
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (amount) {
      try {
        const res = await addDebtPayment(debt.id, Number(amount));
        if (res.success) {
          toast.success(t.dettes.paymentSuccess);
          fetchDebts();
        } else {
          toast.error(t.dettes.paymentError);
        }
      } catch {
        toast.error(t.dettes.serverError);
      }
    }
  };

  const handleDetails = (debt: any) => {
    Swal.fire({
      title: t.dettes.detailsTitle,
      html: `
        <div class="text-left p-4 space-y-4 max-h-[400px] overflow-y-auto">
          <div class="border-b border-slate-100 pb-4 mb-4 text-right">
            <p class="text-sm"><b>${t.dettes.detailsClient}:</b> ${debt.client?.nom}</p>
            <p class="text-sm"><b>${t.dettes.detailsPhone}:</b> ${debt.client?.tel}</p>
            <p class="text-sm ${(debt.client?.solde ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-1">
              <b>${t.dettes.detailsBalance}:</b> ${(debt.client?.solde ?? 0) >= 0 ? '+' : ''}${(debt.client?.solde ?? 0).toFixed(0)} ${currency}
            </p>
          </div>
          <div class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">${t.dettes.detailsDebtHistory}</p>
            ${debt.allInvoices?.map((inv: any) => `
              <div class="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-right">
                <div class="flex justify-between items-center mb-2 flex-row-reverse">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    ${new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  <span class="text-xs font-black text-slate-900 italic">${inv.totalAmount.toFixed(0)} ${currency}</span>
                </div>
                <p class="text-[11px] text-slate-600 font-bold leading-relaxed">
                  ${inv.sales.map((s: any) => `${s.productName} <span class="text-slate-400">(x${s.quantity})</span>`).join(', ')}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      confirmButtonText: t.dettes.closeBtn,
      confirmButtonColor: '#334155',
      customClass: { popup: 'rounded-[2rem]' }
    });
  };

  const filteredDebts = debts.filter(debt =>
    debt.client?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.client?.tel?.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredDebts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDebts = filteredDebts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const statusConfig = (status: string) => {
    if (status === 'PAID')    return { label: t.dettes.statusPaid,    dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' };
    if (status === 'PARTIAL') return { label: t.dettes.statusPartial, dot: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400' };
    return                           { label: t.dettes.statusUnpaid,  dot: 'bg-rose-500',    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400' };
  };

  if (isLoading && debts.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/2 h-1/2 bg-rose-500/5 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -left-[10%] w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <FiClock size={24} />
              </div>
              <span className="text-xs font-black text-rose-500 uppercase tracking-[0.2em]">{t.dettes.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.dettes.titlePrefix} <span className="text-rose-500 italic">{t.dettes.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.dettes.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white/80 dark:bg-card/90 backdrop-blur-xl border border-white dark:border-white/5 rounded-[2rem] p-2 pl-6 shadow-sm shadow-slate-900/5 dark:shadow-black/20"
          >
            <FiSearch className="text-slate-400 dark:text-muted-foreground" />
            <input
              type="text"
              placeholder={t.dettes.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-foreground outline-none text-sm font-bold focus:ring-0 py-3 pr-6 w-64 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50"
            />
          </motion.div>
        </div>

        {/* Debt Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {currentDebts.length > 0 ? (
              currentDebts.map((debt, idx) => {
                const sc = statusConfig(debt.status);
                return (
                  <motion.div
                    key={debt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden group hover:shadow-xl dark:hover:shadow-black/40 transition-all duration-500"
                  >
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Client & Status */}
                      <div className="md:w-64 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-secondary text-white dark:text-foreground flex items-center justify-center shadow-lg shadow-slate-900/20 dark:shadow-black/30 group-hover:rotate-6 transition-transform">
                            <FiUser size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-foreground tracking-tight">
                              {debt.client?.nom || t.dettes.unknownClient}
                            </h3>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground flex items-center gap-1">
                                <FiPhone size={12} /> {debt.client?.tel || t.dettes.noPhone}
                              </p>
                              <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit ${
                                (debt.client?.solde ?? 0) >= 0
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                              }`}>
                                {(debt.client?.solde ?? 0) >= 0
                                  ? t.dettes.creditBalance.replace('{amount}', (debt.client?.solde ?? 0).toFixed(0))
                                  : t.dettes.totalDebtLabel.replace('{amount}', (debt.client?.solde ?? 0).toFixed(0))
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${sc.badge}`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${sc.dot}`} />
                          {sc.label}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic">
                            <FiCalendar size={12} /> {t.dettes.lastUpdate}
                          </p>
                          <p className="text-xs font-bold text-slate-700 dark:text-foreground/80">
                            {new Date(debt.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Financial Side */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="p-4 bg-slate-50/50 dark:bg-secondary/50 rounded-2xl border border-slate-100 dark:border-border">
                            <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-1">{t.dettes.totalLabel}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">
                              {debt.totalAmount.toFixed(0)} <span className="text-[8px] opacity-30">{currency}</span>
                            </p>
                          </div>
                          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                            <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1">{t.dettes.paidLabel}</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter italic">
                              {debt.amountPaid.toFixed(0)} <span className="text-[8px] opacity-30">{currency}</span>
                            </p>
                          </div>
                          <div className="p-4 bg-rose-50/30 dark:bg-rose-500/5 rounded-2xl border border-rose-100/50 dark:border-rose-500/10">
                            <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1">{t.dettes.remainingLabel}</p>
                            <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tighter italic">
                              {debt.remaining.toFixed(0)} <span className="text-[8px] opacity-30">{currency}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePayment(debt)}
                            disabled={debt.status === 'PAID'}
                            className="flex-1 py-4 bg-slate-900 dark:bg-foreground text-white dark:text-background rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl shadow-slate-900/20 dark:shadow-black/30 disabled:grayscale transition-all flex items-center justify-center gap-2"
                          >
                            <FiPlus size={18} /> {t.dettes.payBtn}
                          </motion.button>

                          <button
                            onClick={() => handleDetails(debt)}
                            className="w-14 h-14 bg-white dark:bg-secondary border-2 border-slate-100 dark:border-border text-slate-400 dark:text-muted-foreground rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-secondary/70 transition-all active:scale-95 shadow-sm"
                          >
                            <FiInfo size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full h-full flex flex-col items-center justify-center py-24 text-center bg-white/50 dark:bg-card/50 backdrop-blur-3xl rounded-[3rem] border border-dashed border-slate-200 dark:border-border">
                <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-200 dark:text-muted-foreground/30 border border-slate-100 dark:border-border mb-6">
                  <FiClock size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight italic">{t.dettes.noDebts}</h3>
                <p className="text-slate-400 dark:text-muted-foreground text-xs font-semibold mt-1">{t.dettes.noDebtsDesc}</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-14 h-14 bg-white dark:bg-card border-2 border-slate-100 dark:border-border text-slate-900 dark:text-foreground rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-secondary/50 disabled:opacity-30 disabled:grayscale transition-all shadow-sm active:scale-95"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="px-8 py-4 bg-white dark:bg-card border-2 border-slate-100 dark:border-border rounded-2xl shadow-sm">
              <span className="text-xs font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.dettes.pageLabel}</span>
              <span className="mx-3 text-sm font-black text-slate-900 dark:text-foreground italic">{currentPage} / {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-14 h-14 bg-white dark:bg-card border-2 border-slate-100 dark:border-border text-slate-900 dark:text-foreground rounded-2xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-secondary/50 disabled:opacity-30 disabled:grayscale transition-all shadow-sm active:scale-95"
            >
              <FiArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Global Stats */}
        {debts.length > 0 && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-card/90 p-6 rounded-[2rem] border border-white dark:border-white/5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                <FiDollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.dettes.statsRemaining}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground italic tracking-tighter">
                  {debts.reduce((acc, d) => acc + d.remaining, 0).toFixed(0)} <span className="text-sm opacity-30 tracking-normal">{currency}</span>
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-card/90 p-6 rounded-[2rem] border border-white dark:border-white/5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                <FiCheckCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.dettes.statsCollected}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground italic tracking-tighter">
                  {debts.reduce((acc, d) => acc + d.amountPaid, 0).toFixed(0)} <span className="text-sm opacity-30 tracking-normal">{currency}</span>
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-card/90 p-6 rounded-[2rem] border border-white dark:border-white/5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 dark:bg-primary/10 text-primary flex items-center justify-center">
                <FiZap size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.dettes.statsActiveFiles}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">
                  {debts.filter(d => d.status !== 'PAID').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
