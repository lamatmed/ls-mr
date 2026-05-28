/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPackage,
  FiShoppingCart,
  FiDollarSign,
  FiAlertTriangle,
  FiPlus,
  FiSettings,
  FiX,
  FiSave,
  FiActivity,
  FiTrendingUp,
  FiLayers,
  FiZap,
  FiPieChart,
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiUpload,
  FiTrash2
} from "react-icons/fi";
import { getDashboardStats, getSalesHistory, getMonthlySales, deleteAllSales, getCompany, syncAllClientBalances } from '../utlis/actions';
import Chart from "chart.js/auto";
import Loader from "../components/Loader";
import SalesHistoryDay from "../components/SalesHistoryDay";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface Stats {
  totalProducts: number;
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
  totalStockValue: number;
  totalDebts: number;
  totalExpenses: number;
}

interface Sale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  purchasePrice: number;
}

interface MonthlySales {
  month: string;
  totalSales: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [user, setUser] = useState(null);
  const { t, lang, currency, setCurrency } = useLanguage();
  const { isDark } = useTheme();

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({ name: "", address: "", contact: "", nif: "", currency: "MRU", logo: "" });
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setCompanyInfo(prev => ({ ...prev, logo: data.url }));
      } else {
        toast.error("Erreur upload: " + (data.error || "inconnu"));
      }
    } catch {
      toast.error("Erreur upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

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
      } catch (error) {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [sales, statsData, monthlyData, companyData] = await Promise.all([
          getSalesHistory(),
          getDashboardStats(),
          getMonthlySales(),
          getCompany()
        ]);

        setSalesHistory(sales.map(s => ({ ...s, productName: s.productName ?? "منتج غير معروف" })));
        setStats(statsData);

        const salesByMonth: { [key: string]: number } = {};
        monthlyData.forEach(({ month, totalSales }) => {
          salesByMonth[month] = (salesByMonth[month] || 0) + totalSales;
        });
        setMonthlySales(Object.entries(salesByMonth).map(([month, totalSales]) => ({ month, totalSales })));

        setCompanyInfo({ name: companyData.name, address: companyData.address, contact: companyData.contact, nif: companyData.nif || "", currency: companyData.currency || "MRU", logo: companyData.logo || "" });
      } catch (e) {
        toast.error(t.dashboard.syncError);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const saveCompanyInfo = async () => {
    setIsSavingCompany(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyInfo.name,
          address: companyInfo.address,
          contact: companyInfo.contact,
          nif: companyInfo.nif || null,
          currency: companyInfo.currency,
          logo: companyInfo.logo || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.dashboard.profileUpdated);
        if (companyInfo.currency) setCurrency(companyInfo.currency);
        setShowCompanyModal(false);
      } else {
        toast.error(t.dashboard.updateFailed);
      }
    } catch {
      toast.error(t.dashboard.serverError);
    } finally {
      setIsSavingCompany(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stats && chartCanvasRef.current) {
        const ctx = chartCanvasRef.current.getContext("2d");
        if (!ctx) return;
        Chart.getChart(chartCanvasRef.current)?.destroy();
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: [
              t.dashboard.stats.stockItems,
              t.dashboard.stats.sales,
              t.dashboard.stats.profits,
              t.dashboard.stats.debts,
              t.dashboard.stats.orders,
              t.dashboard.stats.expenses,
            ],
            datasets: [{
              data: [stats.totalProducts, stats.totalSales, stats.totalProfit, stats.totalDebts, stats.totalOrders, stats.totalExpenses],
              backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#64748b", "#f43f5e"],
              borderWidth: 0,
              hoverOffset: 15
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  font: { weight: 'bold', size: 11 },
                  color: isDark ? '#94a3b8' : '#475569'
                }
              }
            },
            cutout: '70%'
          }
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [stats, lang, isDark]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (monthlySales.length > 0 && monthlyChartRef.current) {
        const ctx = monthlyChartRef.current.getContext("2d");
        if (!ctx) return;
        Chart.getChart(monthlyChartRef.current)?.destroy();

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.2)');
        gradient.addColorStop(1, 'rgba(99,102,241,0)');

        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
        const tickColor = isDark ? '#94a3b8' : '#94a3b8';

        new Chart(ctx, {
          type: "line",
          data: {
            labels: monthlySales.map((sale) => sale.month),
            datasets: [{
              label: t.dashboard.chartVolumeLabel.replace('{currency}', currency),
              data: monthlySales.map((sale) => sale.totalSales),
              borderColor: "#6366f1",
              backgroundColor: gradient,
              borderWidth: 4,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: isDark ? '#1e293b' : '#fff',
              pointBorderColor: "#6366f1",
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: tickColor }
              },
              x: {
                grid: { display: false },
                ticks: { color: tickColor }
              }
            }
          }
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [monthlySales, lang, isDark]);

  const handleDeleteSales = async () => {
    const result = await Swal.fire({
      title: t.dashboard.clearLogConfirm,
      text: t.dashboard.clearLogDesc,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t.dashboard.confirmClear,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const response = await deleteAllSales();
      if (response.success) {
        toast.success(t.dashboard.clearLogSuccess);
        window.location.reload();
      } else {
        toast.error(t.dashboard.generalError);
      }
    }
  };

  const handleSyncBalances = async () => {
    const result = await Swal.fire({
      title: t.dashboard.syncBalancesConfirm,
      text: t.dashboard.syncBalancesDesc,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: t.dashboard.syncNow,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await syncAllClientBalances();
        if (res.success) {
          toast.success(t.dashboard.syncSuccess.replace('{count}', String(res.fixedCount)));
          window.location.reload();
        } else {
          toast.error(res.error || t.dashboard.syncError);
        }
      } catch (error) {
        toast.error(t.dashboard.serverError);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader /></div>;

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], x: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-emerald-300/30 dark:bg-emerald-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1 w-8 bg-indigo-600 rounded-full"></span>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t.dashboard.badge}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">
              {t.dashboard.titlePrefix} <span className="text-indigo-600 dark:text-indigo-400">{t.dashboard.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2 text-base md:text-lg">{t.dashboard.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 md:gap-4">
            <button
              onClick={() => router.push("/update")}
              className="px-6 md:px-10 py-4 md:py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-700 transition-all flex items-center gap-2 md:gap-3 shadow-2xl shadow-slate-900/20 dark:shadow-indigo-900/30"
            >
              <FiPlus size={18} /> {t.dashboard.newProduct}
            </button>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-slate-600 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm group"
            >
              <FiSettings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-10 bg-white/80 dark:bg-card/90 backdrop-blur-xl border border-white dark:border-border shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden"
        >
          <div className="grid grid-cols-3 md:flex md:flex-wrap divide-y divide-slate-100 dark:divide-border md:divide-y-0 md:divide-x rtl:md:divide-x-reverse">
            {[
              { label: t.dashboard.stats.stockItems, val: stats?.totalProducts?.toLocaleString(), icon: <FiPackage size={14} />, accent: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15" },
              { label: t.dashboard.stats.stockValue, val: stats?.totalStockValue?.toLocaleString(), suffix: currency, icon: <FiLayers size={14} />, accent: "text-slate-800 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-700/40" },
              { label: t.dashboard.stats.sales, val: stats?.totalSales?.toLocaleString(), suffix: currency, icon: <FiShoppingCart size={14} />, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
              { label: t.dashboard.stats.profits, val: stats?.totalProfit?.toLocaleString(), suffix: currency, icon: <FiDollarSign size={14} />, accent: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15" },
              { label: t.dashboard.stats.expenses, val: stats?.totalExpenses?.toLocaleString(), suffix: currency, icon: <FiDollarSign size={14} />, accent: "text-fuchsia-600 dark:text-fuchsia-400", bg: "bg-fuchsia-50 dark:bg-fuchsia-500/15" },
              { label: t.dashboard.stats.debts, val: stats?.totalDebts?.toLocaleString(), suffix: currency, icon: <FiClock size={14} />, accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 md:py-4 hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors group cursor-default border-r border-slate-100 dark:border-border last:border-r-0 md:border-r-0 md:flex-1">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl ${s.bg} ${s.accent} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5 truncate">{s.label}</p>
                  <div className="flex items-baseline gap-0.5 md:gap-1">
                    <span className={`text-sm md:text-base font-black ${s.accent} tracking-tight leading-none`}>{s.val}</span>
                    {s.suffix && <span className="text-[8px] md:text-[9px] font-bold text-slate-300 dark:text-slate-600">{s.suffix}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 mb-6 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 bg-white/70 dark:bg-card/80 backdrop-blur-3xl p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border border-white dark:border-border shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6 md:mb-12">
              <div>
                <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.dashboard.charts.timePerformance}</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-1">{t.dashboard.charts.monthlyCashFlow}</p>
              </div>
              <div className="flex gap-2">
                <span className="w-8 md:w-12 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></span>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FiTrendingUp size={20} />
                </div>
              </div>
            </div>
            <div className="h-[220px] md:h-[400px]">
              <canvas ref={monthlyChartRef}></canvas>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 bg-slate-900 dark:bg-slate-800 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 md:mb-12">
                <h3 className="text-lg md:text-2xl font-black tracking-tight italic">{t.dashboard.charts.generalAudit}</h3>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center">
                  <FiPieChart size={20} />
                </div>
              </div>
              <div className="flex-1 min-h-[200px] md:min-h-[300px]">
                <canvas ref={chartCanvasRef}></canvas>
              </div>
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/10 dark:border-white/20">
                <div className="flex items-center justify-between text-white/50 dark:text-white/60 text-[10px] font-black uppercase tracking-widest">
                  <span>{t.dashboard.charts.realtimeAccuracy}</span>
                  <span className="text-emerald-400">99.9%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions & History Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white/70 dark:bg-card/80 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] md:rounded-[4rem] border border-white dark:border-border shadow-2xl h-fit">
              <h3 className="text-sm font-black text-slate-900 dark:text-foreground uppercase tracking-widest mb-6 md:mb-10 border-b border-slate-100 dark:border-border pb-4 md:pb-6 flex items-center gap-3">
                <FiZap className="text-indigo-600 dark:text-indigo-400" /> {t.dashboard.quickCommands}
              </h3>
              <div className="space-y-3 md:space-y-4">
                <button
                  onClick={() => router.push("/periode")}
                  className="w-full p-4 md:p-6 bg-slate-50 dark:bg-secondary/60 rounded-2xl md:rounded-3xl flex items-center justify-between hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all duration-500 group"
                >
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform shrink-0">
                      <FiBarChart2 size={20} />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest opacity-40">{t.dashboard.commands.statistics}</span>
                      <span className="text-xs md:text-sm font-black italic dark:text-foreground">{t.dashboard.commands.auditByPeriod}</span>
                    </div>
                  </div>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => router.push("/alerts")}
                  className="w-full p-4 md:p-6 bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl md:rounded-3xl flex items-center justify-between hover:bg-amber-500 hover:text-white transition-all duration-500 group border border-amber-100/50 dark:border-amber-500/20"
                >
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-card text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform shrink-0">
                      <FiAlertCircle size={20} />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 text-amber-500 group-hover:text-amber-200">{t.dashboard.commands.securityMonitoring}</span>
                      <span className="text-xs md:text-sm font-black italic text-amber-600 dark:text-amber-400 group-hover:text-white">{t.dashboard.commands.expirationAlerts}</span>
                    </div>
                  </div>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all shrink-0" />
                </button>

                <button
                  onClick={() => router.push("/list")}
                  className="w-full p-4 md:p-6 bg-orange-50/50 dark:bg-orange-500/10 rounded-2xl md:rounded-3xl flex items-center justify-between hover:bg-orange-500 hover:text-white transition-all duration-500 group border border-orange-100/50 dark:border-orange-500/20"
                >
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-card text-orange-500 flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform shrink-0">
                      <FiFileText size={20} />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 text-orange-500 group-hover:text-orange-200">{t.dashboard.commands.products}</span>
                      <span className="text-xs md:text-sm font-black italic text-orange-600 dark:text-orange-400 group-hover:text-white">{t.dashboard.commands.inventoryCatalog}</span>
                    </div>
                  </div>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all shrink-0" />
                </button>

                <button
                  onClick={handleDeleteSales}
                  className="w-full p-4 md:p-6 bg-rose-50/50 dark:bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-between hover:bg-rose-600 hover:text-white transition-all duration-500 group border border-rose-100/50 dark:border-rose-500/20"
                >
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-card text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform shrink-0">
                      <FiAlertTriangle size={20} />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 text-rose-400">{t.dashboard.commands.dangerZone}</span>
                      <span className="text-xs md:text-sm font-black italic text-rose-600 dark:text-rose-400 group-hover:text-white">{t.dashboard.commands.clearLog}</span>
                    </div>
                  </div>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all shrink-0" />
                </button>

                <button
                  onClick={handleSyncBalances}
                  className="w-full p-4 md:p-6 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl md:rounded-3xl flex items-center justify-between hover:bg-emerald-600 hover:text-white transition-all duration-500 group border border-emerald-100/50 dark:border-emerald-500/20"
                >
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-card text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm group-hover:scale-90 transition-transform shrink-0">
                      <FiActivity size={20} />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest opacity-40 text-emerald-400">{t.dashboard.commands.maintenance}</span>
                      <span className="text-xs md:text-sm font-black italic text-emerald-600 dark:text-emerald-400 group-hover:text-white">{t.dashboard.commands.syncBalances}</span>
                    </div>
                  </div>
                  <FiArrowRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all shrink-0" />
                </button>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl flex items-center gap-5 md:gap-6 group hover:translate-y-[-5px] transition-transform duration-500">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-[2rem] md:rounded-[2.5rem] bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:rotate-[360deg] transition-transform duration-1000 shrink-0">
                <FiClock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{t.dashboard.networkStatus}</p>
                <p className="text-base md:text-xl font-black italic">{t.dashboard.alphaCluster}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white/70 dark:bg-card/80 backdrop-blur-3xl rounded-[2rem] md:rounded-[4rem] border border-white dark:border-border p-6 md:p-12 shadow-2xl min-h-full">
              <div className="flex items-center justify-between mb-6 md:mb-12 gap-4">
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.dashboard.flowLog}</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-1">{t.dashboard.recentEvents}</p>
                </div>
                <button
                  onClick={() => setShowSalesHistory(!showSalesHistory)}
                  className="shrink-0 px-4 md:px-8 py-2.5 md:py-3 bg-white dark:bg-secondary border border-slate-200 dark:border-border rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-foreground hover:bg-slate-900 dark:hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  {showSalesHistory ? t.dashboard.compress : t.dashboard.exploreFlow}
                </button>
              </div>

              <AnimatePresence>
                {showSalesHistory ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-1 rounded-[2rem] border border-slate-50 dark:border-border bg-slate-50/30 dark:bg-secondary/20">
                      <SalesHistoryDay sales={salesHistory} />
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center mb-6 relative">
                      <FiShoppingCart size={36} className="text-slate-200 dark:text-muted-foreground/20" />
                      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-muted-foreground italic">{t.dashboard.logAwaiting}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Company Settings Modal */}
      <AnimatePresence>
        {showCompanyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCompanyModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-12 overflow-y-auto flex-1">
                <div className="flex justify-between items-center mb-16">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">{t.dashboard.companyProfile}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{t.dashboard.companySubtitle}</p>
                  </div>
                  <button onClick={() => setShowCompanyModal(false)} className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                    <FiX size={28} />
                  </button>
                </div>

                {/* Logo */}
                <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">{t.dashboard.logoLabel}</p>
                  <div className="flex items-center gap-6">
                    {/* Preview */}
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                      {companyInfo.logo
                        ? <img src={companyInfo.logo} alt="logo" className="w-full h-full object-contain p-1" />
                        : <FiUpload size={24} className="text-slate-300" />
                      }
                    </div>
                    {/* Controls */}
                    <div className="flex flex-col gap-3 flex-1">
                      <label className={`cursor-pointer w-fit inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-md shadow-primary/20 ${isUploadingLogo ? "opacity-60 pointer-events-none" : ""}`}>
                        <FiUpload size={14} />
                        {isUploadingLogo ? "..." : t.dashboard.logoUpload}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={isUploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            uploadLogo(file);
                          }}
                        />
                      </label>
                      {companyInfo.logo && (
                        <button
                          type="button"
                          onClick={() => setCompanyInfo(prev => ({ ...prev, logo: "" }))}
                          className="w-fit inline-flex items-center gap-1.5 text-[11px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                        >
                          <FiTrash2 size={12} /> {t.dashboard.logoDelete}
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">{t.dashboard.logoHint}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: t.dashboard.businessName, val: companyInfo.name, key: 'name', ph: t.dashboard.businessNamePlaceholder, span: false },
                    { label: t.dashboard.headquarters, val: companyInfo.address, key: 'address', ph: t.dashboard.headquartersPlaceholder, span: false },
                    { label: t.dashboard.generalSupport, val: companyInfo.contact, key: 'contact', ph: t.dashboard.generalSupportPlaceholder, span: true },
                    { label: t.dashboard.nif, val: companyInfo.nif, key: 'nif', ph: t.dashboard.nifPlaceholder, span: false },
                    { label: t.dashboard.currency, val: companyInfo.currency, key: 'currency', ph: t.dashboard.currencyPlaceholder, span: false },
                  ].map((field, i) => (
                    <div key={i} className={`space-y-4 ${field.span ? 'md:col-span-2' : ''}`}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                      <input
                        type="text"
                        value={field.val}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, [field.key]: e.target.value })}
                        placeholder={field.ph}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-3xl px-8 py-6 outline-none transition-all font-bold text-slate-800 shadow-inner"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-16 flex gap-6">
                  <button
                    onClick={() => setShowCompanyModal(false)}
                    className="flex-1 py-6 border-2 border-slate-100 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={saveCompanyInfo}
                    disabled={isSavingCompany}
                    className="flex-[2] py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-900/40"
                  >
                    {isSavingCompany
                      ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      : <><FiSave size={20} /> {t.dashboard.syncProfile}</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
