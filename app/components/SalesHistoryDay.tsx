import React, { useState, useEffect } from "react";
import Loader from "./Loader";
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

const SalesHistoryDay: React.FC<SalesHistoryProps> = ({ sales }) => {
  const { t, currency } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [sales]);

  const grouped: Record<string, { total: number; gain: number; days: Record<string, { total: number; gain: number }> }> = {};

  sales.forEach(sale => {
    const date = new Date(sale.createdAt);
    const monthYear = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const day = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

    if (!grouped[monthYear]) grouped[monthYear] = { total: 0, gain: 0, days: {} };
    if (!grouped[monthYear].days[day]) grouped[monthYear].days[day] = { total: 0, gain: 0 };

    grouped[monthYear].total += sale.totalPrice;
    grouped[monthYear].gain += sale.totalPrice - sale.purchasePrice;
    grouped[monthYear].days[day].total += sale.totalPrice;
    grouped[monthYear].days[day].gain += sale.totalPrice - sale.purchasePrice;
  });

  if (loading) return (
    <div className="py-12 flex items-center justify-center">
      <Loader />
    </div>
  );

  return (
    <div className="mt-4 space-y-6">
      <h2 className="text-sm font-black text-slate-700 dark:text-foreground tracking-tight mb-4">
        {t.sales.history.salesByDay}
      </h2>
      {Object.keys(grouped).map(monthYear => (
        <div key={monthYear} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-border">
          <div className="bg-slate-100 dark:bg-secondary px-4 py-2.5">
            <h3 className="text-sm font-black text-slate-700 dark:text-foreground">{monthYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-secondary/50 border-b border-slate-100 dark:border-border">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest text-right">{t.common.date}</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest text-right">{t.sales.history.dailyRevenue}</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest text-right">{t.sales.history.dailyGain}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-border">
                {Object.keys(grouped[monthYear].days).map(day => (
                  <tr key={day} className="hover:bg-slate-50/60 dark:hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-foreground/80 text-right">{day}</td>
                    <td className="px-4 py-3 text-xs font-black text-indigo-700 dark:text-indigo-400 text-right">
                      {grouped[monthYear].days[day].total.toFixed(0)} <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground">{currency}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-black text-emerald-700 dark:text-emerald-400 text-right">
                      {grouped[monthYear].days[day].gain.toFixed(0)} <span className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground">{currency}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/80 dark:bg-secondary border-t border-slate-200 dark:border-border">
                  <td className="px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground text-right">
                    {t.sales.history.monthTotal.replace('{month}', monthYear)}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-indigo-700 dark:text-indigo-400 text-right">
                    {grouped[monthYear].total.toFixed(0)} <span className="text-[10px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-emerald-700 dark:text-emerald-400 text-right">
                    {grouped[monthYear].gain.toFixed(0)} <span className="text-[10px] text-slate-400 dark:text-muted-foreground">{currency}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesHistoryDay;
