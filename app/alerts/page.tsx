'use client'

import { useState, useEffect, useCallback } from "react";
import {
  FiPackage,
  FiCalendar,
  FiAlertCircle,
  FiActivity,
  FiZap,
  FiClock,
  FiCheckCircle,
  FiArchive
} from "react-icons/fi";
import Loader from "../components/Loader";
import { getAllProducts } from "../utlis/actions";
import { Product } from "../types/product";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const ALERT_THRESHOLD_DAYS = 20;

export default function ExpiredProducts() {
  const [alertProducts, setAlertProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const fetchAlertProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProducts();
      const today = new Date();

      const filteredData = data
        .map(product => ({
          ...product,
          expirationDate: new Date(product.expirationDate).toISOString().split("T")[0],
        }))
        .filter(product => {
          const expDate = new Date(product.expirationDate);
          const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          return daysLeft <= ALERT_THRESHOLD_DAYS;
        });

      setAlertProducts(filteredData);
    } catch {
      setError(t.alerts.syncError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAlertProducts();
  }, [fetchAlertProducts]);

  const expiredProducts = alertProducts.filter(p => new Date(p.expirationDate) < new Date());
  const expiringSoonProducts = alertProducts.filter(p => new Date(p.expirationDate) >= new Date());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-1/3 h-1/3 bg-rose-500/5 dark:bg-rose-500/3 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[10%] -right-[10%] w-1/2 h-1/2 bg-amber-500/5 dark:bg-amber-500/3 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
                <FiAlertCircle size={24} />
              </div>
              <span className="text-xs font-black text-rose-500 dark:text-rose-400 uppercase tracking-[0.2em]">
                {t.alerts.badge}
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.alerts.titlePrefix} <span className="text-rose-500 dark:text-rose-400 italic">{t.alerts.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">
              {t.alerts.subtitle}
            </p>
          </motion.div>

          {/* Stat card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                <FiAlertCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                  {t.alerts.expiredItems}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">{expiredProducts.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <Loader />
            <p className="text-slate-400 dark:text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
              {t.alerts.analyzing}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500 dark:text-rose-400 font-bold">{error}</div>
        ) : alertProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-white/50 dark:bg-card/50 backdrop-blur-2xl rounded-[3rem] border border-white dark:border-white/5 shadow-sm"
          >
            <div className="mx-auto w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
              <FiCheckCircle size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.alerts.noAlerts}
            </h3>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">
              {t.alerts.noAlertsDesc}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {/* Already expired */}
            {expiredProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-border" />
                  <h2 className="text-xs font-black text-rose-500 dark:text-rose-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FiArchive /> {t.alerts.alreadyExpired}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-border" />
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {expiredProducts.map(p => (
                    <ProductAlertCard key={p.id} product={p} status="expired" />
                  ))}
                </motion.div>
              </section>
            )}

            {/* Expiring soon */}
            {expiringSoonProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-border" />
                  <h2 className="text-xs font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FiClock /> {t.alerts.soonExpiring}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-border" />
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {expiringSoonProducts.map(p => (
                    <ProductAlertCard key={p.id} product={p} status="approaching" />
                  ))}
                </motion.div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductAlertCard({ product, status }: { product: Product; status: 'expired' | 'approaching' }) {
  const { t, currency } = useLanguage();
  const daysLeft = Math.ceil((new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isExpired = status === 'expired';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -5 }}
      className={`relative group bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border transition-all p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${
        isExpired
          ? 'border-rose-100 hover:border-rose-200 dark:border-rose-500/20 dark:hover:border-rose-500/40'
          : 'border-amber-100 hover:border-amber-200 dark:border-amber-500/20 dark:hover:border-amber-500/40'
      }`}
    >
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl ${isExpired ? 'bg-rose-500/10' : 'bg-amber-500/10'}`} />

      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
          isExpired
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'
            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400'
        }`}>
          <FiPackage size={24} />
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
          isExpired ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'
        }`}>
          {isExpired ? t.alerts.expired : t.alerts.remainingDays.replace('{days}', String(daysLeft))}
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
        {product.name}
      </h3>
      <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground font-mono tracking-tight mb-6 flex items-center gap-1">
        <FiActivity size={14} className="opacity-50" /> Ref: #{product.code}
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
            {t.alerts.quantity}
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-foreground italic">
            {t.alerts.pieces.replace('{count}', String(product.quantity))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
            {t.alerts.unitValue}
          </span>
          <span className="text-sm font-black text-primary flex items-center gap-1">
            {product.price_v.toLocaleString()}
            <span className="text-[10px] opacity-60">{currency}</span>
            <FiZap className="text-[10px]" />
          </span>
        </div>
        <div className={`mt-6 pt-6 border-t flex items-center gap-3 ${
          isExpired ? 'border-rose-50 dark:border-rose-500/10' : 'border-amber-50 dark:border-amber-500/10'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isExpired
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'
              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400'
          }`}>
            <FiCalendar size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
              {t.alerts.expirationDate}
            </p>
            <p className="text-sm font-black text-slate-700 dark:text-foreground italic">
              {new Date(product.expirationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
