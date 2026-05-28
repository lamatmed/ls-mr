import React, { useState, useEffect } from "react";
import Loader from "./Loader";
import {
  FiBox, FiCalendar, FiActivity, FiClock,
  FiChevronLeft, FiChevronRight,
  FiTrendingUp, FiBarChart2, FiPieChart, FiXCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

interface Sale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  purchasePrice: number;
  createdAt: string;
}

interface SalesHistoryProps {
  sales: Sale[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales }) => {
  const { t, currency } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTotalsPage, setCurrentTotalsPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  const TOTALS_PER_PAGE = 4;

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [sales]);

  useEffect(() => {
    setCurrentPage(1);
    setCurrentTotalsPage(1);
  }, [searchDate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const u = await res.json();
          setIsAdmin(!!u.admin);
        }
      } catch { /* silent */ }
    })();
  }, []);

  const filteredSales = searchDate
    ? sales.filter(s => s.createdAt.startsWith(searchDate))
    : sales;

  const totalByDay: Record<string, number> = {};
  const totalByMonth: Record<string, number> = {};
  const totalByYear: Record<string, number> = {};

  filteredSales.forEach(sale => {
    const dayKey = sale.createdAt.split('T')[0];
    totalByDay[dayKey] = (totalByDay[dayKey] || 0) + sale.totalPrice;
    const date = new Date(sale.createdAt);
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    const year = `${date.getFullYear()}`;
    totalByMonth[month] = (totalByMonth[month] || 0) + sale.totalPrice;
    totalByYear[year] = (totalByYear[year] || 0) + sale.totalPrice;
  });

  const sortedDays = Object.entries(totalByDay).sort((a, b) => b[0].localeCompare(a[0]));
  const totalsPageCount = Math.ceil(sortedDays.length / TOTALS_PER_PAGE);
  const paginatedDays = sortedDays.slice(
    (currentTotalsPage - 1) * TOTALS_PER_PAGE,
    currentTotalsPage * TOTALS_PER_PAGE
  );

  const currentSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageCount = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

  const cardCls = "bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)]";
  const paginationBtnCls = "w-10 h-10 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-400 dark:text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary disabled:opacity-20 transition-all shadow-sm";

  return (
    <div className="mt-8 space-y-8 pb-12">

      {/* Sales log card */}
      <div className={cardCls}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight italic flex items-center gap-2">
              <FiClock className="text-primary" />
              {t.sales.history.title}
            </h2>
            <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
              {t.sales.history.subtitle}
            </p>
          </div>

          {/* Date filter */}
          <div className="relative group w-full md:w-64">
            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={15} />
            <input
              type="date"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl outline-none transition-all font-black text-slate-700 text-sm"
            />
            {searchDate && (
              <button
                onClick={() => setSearchDate("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 hover:text-rose-500 transition-colors"
              >
                <FiXCircle size={15} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-border">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">{t.sales.history.productName}</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">{t.common.quantity}</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">{t.sales.history.value}</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">{t.sales.history.timing}</th>
                </tr>
              </thead>
              <motion.tbody
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="visible"
                className="divide-y divide-slate-50 dark:divide-border"
              >
                <AnimatePresence mode="popLayout">
                  {currentSales.length > 0 ? (
                    currentSales.map(sale => (
                      <motion.tr
                        key={sale.id}
                        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                        layout
                        className="group hover:bg-slate-50/80 dark:hover:bg-secondary/30 transition-all cursor-default"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <FiBox size={18} />
                            </div>
                            <span className="text-sm font-black text-slate-700 dark:text-foreground tracking-tight">{sale.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-secondary rounded-lg text-xs font-black text-slate-500 dark:text-muted-foreground italic">
                            × {sale.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-black text-slate-900 dark:text-foreground tracking-tight">
                          {sale.totalPrice.toFixed(0)} <span className="text-[10px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-slate-600 dark:text-foreground/80 italic">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase">
                              {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-200 dark:text-muted-foreground/30 border border-slate-100 dark:border-border">
                            <FiActivity size={28} />
                          </div>
                          <p className="text-slate-400 dark:text-muted-foreground font-bold italic tracking-tight">
                            {t.sales.history.noTransactions}
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </motion.tbody>
            </table>

            {filteredSales.length > ITEMS_PER_PAGE && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-50 dark:border-border pt-6 px-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={paginationBtnCls}
                >
                  <FiChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em] italic">
                  {t.common.page} <span className="text-primary">{currentPage}</span> / {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
                  disabled={currentPage === pageCount}
                  className={paginationBtnCls}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Daily totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cardCls}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 dark:text-foreground uppercase tracking-widest flex items-center gap-2 italic">
              <FiTrendingUp className="text-primary" />
              {t.sales.history.dailyTotals}
            </h3>
            {totalsPageCount > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTotalsPage(p => Math.max(p - 1, 1))}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                >
                  <FiChevronLeft size={14} />
                </button>
                <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground">{currentTotalsPage}/{totalsPageCount}</span>
                <button
                  onClick={() => setCurrentTotalsPage(p => Math.min(p + 1, totalsPageCount))}
                  className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {paginatedDays.length > 0 ? (
              paginatedDays.map(([day, total]) => (
                <div key={day} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-secondary/50 rounded-2xl border border-slate-100 dark:border-border group hover:border-primary/20 dark:hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full group-hover:scale-y-125 transition-transform" />
                    <span className="text-xs font-black text-slate-600 dark:text-foreground/80 italic tracking-tight">{day}</span>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-foreground tracking-tight">
                    {total.toFixed(2)} <span className="text-[9px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 dark:text-muted-foreground text-xs italic py-8 uppercase tracking-widest font-black">
                {t.sales.history.emptyArchive}
              </p>
            )}
          </div>
        </motion.div>

        {/* Monthly + Annual (admin only) */}
        {!searchDate && isAdmin && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className={cardCls}>
              <h3 className="text-sm font-black text-slate-800 dark:text-foreground uppercase tracking-widest flex items-center gap-2 italic mb-6">
                <FiBarChart2 className="text-primary" />
                {t.sales.history.monthlyPerf}
              </h3>
              <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {Object.entries(totalByMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, total]) => (
                  <div key={month} className="flex justify-between items-center py-2.5 px-3 rounded-xl border-b border-slate-50 dark:border-border last:border-0 hover:bg-slate-50 dark:hover:bg-secondary/50 transition-colors">
                    <span className="text-xs font-black text-slate-600 dark:text-foreground/80">{month}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-foreground tracking-tight">
                      {total.toFixed(0)} <span className="text-[9px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-[#0d1b3e] rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 border border-white/5">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic mb-6">
                <FiPieChart className="text-indigo-400" />
                {t.sales.history.annualBudget}
              </h3>
              <div className="space-y-4">
                {Object.entries(totalByYear).sort((a, b) => b[0].localeCompare(a[0])).map(([year, total]) => (
                  <div key={year} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                    <span className="text-lg font-black italic text-white">{year}</span>
                    <span className="text-xl font-black text-indigo-400">
                      {total.toFixed(0)} <span className="text-xs text-white/40">{currency}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
