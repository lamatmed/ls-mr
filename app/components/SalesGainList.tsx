import React from "react";

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
  const totalByMonth: Record<string, number> = {};
  const totalByYear: Record<string, number> = {};
  const gainByMonth: Record<string, number> = {};
  const gainByYear: Record<string, number> = {};

  sales.forEach(sale => {
    const date = new Date(sale.createdAt);
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    const year = `${date.getFullYear()}`;
    const gain = sale.totalPrice - sale.purchasePrice;
    totalByMonth[month] = (totalByMonth[month] || 0) + sale.totalPrice;
    totalByYear[year] = (totalByYear[year] || 0) + sale.totalPrice;
    gainByMonth[month] = (gainByMonth[month] || 0) + gain;
    gainByYear[year] = (gainByYear[year] || 0) + gain;
  });

  const thCls = "border border-slate-200 dark:border-border px-4 py-2.5 text-[10px] font-black text-slate-500 dark:text-muted-foreground uppercase tracking-widest text-right bg-slate-50 dark:bg-secondary";
  const tdCls = "border border-slate-100 dark:border-border px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-foreground text-right";

  return (
    <div className="mt-6 bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border space-y-8">
      <div>
        <h2 className="text-base font-black text-primary mb-4">Totaux des ventes et gains</h2>
        <h3 className="text-sm font-black text-slate-600 dark:text-foreground/80 mb-3">Par Mois</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Mois</th>
                <th className={thCls}>Total Vente</th>
                <th className={thCls}>Gain</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalByMonth).map(([month, total]) => (
                <tr key={month} className="hover:bg-slate-50 dark:hover:bg-secondary/50 transition-colors">
                  <td className={`${tdCls} font-black`}>{month}</td>
                  <td className={tdCls}>{total.toFixed(2)}</td>
                  <td className={`${tdCls} text-emerald-600 dark:text-emerald-400`}>{gainByMonth[month].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black text-slate-600 dark:text-foreground/80 mb-3">Par Année</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Année</th>
                <th className={thCls}>Total Vente</th>
                <th className={thCls}>Gain</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalByYear).map(([year, total]) => (
                <tr key={year} className="hover:bg-slate-50 dark:hover:bg-secondary/50 transition-colors">
                  <td className={`${tdCls} font-black`}>{year}</td>
                  <td className={tdCls}>{total.toFixed(2)}</td>
                  <td className={`${tdCls} text-emerald-600 dark:text-emerald-400`}>{gainByYear[year].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
