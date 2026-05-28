"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Loader from "./components/Loader";
import { motion } from "framer-motion";
import {
  FiArrowRight, FiShield, FiZap, FiBox,
  FiCheckCircle, FiGlobe, FiTrendingUp, FiPackage
} from "react-icons/fi";
import { getCompany } from "./utlis/actions";
import { useLanguage } from "./context/LanguageContext";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    const fetchCompany = async () => {
      const company = await getCompany();
      setCompanyName(company.name);
    };
    fetchCompany();
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="h-screen w-full flex flex-col justify-center items-center bg-[#fafafa] dark:bg-background">
      <Loader />
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-muted-foreground animate-pulse"
      >
        {t.home.loading}
      </motion.p>
    </div>
  );

  const trust = [
    { icon: <FiShield size={18} />, label: t.home.security, val: t.home.securityValue, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15" },
    { icon: <FiZap size={18} />,    label: t.home.response, val: t.home.responseValue,  color: "text-amber-500 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/15"  },
    { icon: <FiBox size={18} />,    label: t.home.cloud,    val: t.home.cloudValue,     color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
  ];

  const features = [
    { icon: <FiPackage size={20} />,    color: "text-indigo-500 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-500/15",  label: t.home.security,  desc: t.home.securityValue },
    { icon: <FiTrendingUp size={20} />, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", label: t.home.response,  desc: t.home.responseValue },
    { icon: <FiShield size={20} />,     color: "text-violet-500 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-500/15",   label: t.home.cloud,     desc: t.home.cloudValue },
  ];

  return (
    <section className="relative min-h-screen bg-[#fafafa] dark:bg-background overflow-hidden selection:bg-indigo-500 selection:text-white">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -right-[5%] w-[700px] h-[700px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[5%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/8 dark:bg-emerald-500/8 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-20 md:pt-20 md:pb-32">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {t.home.badge}
            </span>
          </div>
        </motion.div>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 md:mb-24">

          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center lg:text-start order-2 lg:order-1"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-foreground leading-[0.92] tracking-tighter mb-6 italic">
              {t.home.titlePrefix}<br />
              <span className="text-indigo-600 dark:text-indigo-400">{t.home.title2}</span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 dark:text-muted-foreground max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed mb-10">
              {t.home.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link
                href="/login"
                className="group relative overflow-hidden px-8 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 dark:shadow-indigo-900/40 transition-all"
              >
                <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                <span className="relative">{t.home.btnLogin}</span>
                <FiArrowRight size={18} className="relative group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="px-8 py-5 bg-white dark:bg-card border-2 border-slate-100 dark:border-border text-slate-800 dark:text-foreground rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-secondary/60 transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                {t.home.btnPlatform} <FiGlobe size={16} />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-4 pt-10 border-t border-slate-100 dark:border-border">
              {trust.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center lg:items-start gap-2"
                >
                  <div className={`w-10 h-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <div className="text-center lg:text-start">
                    <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{item.label}</p>
                    <p className="text-sm font-black text-slate-900 dark:text-foreground italic">{item.val}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: logo visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end order-1 lg:order-2"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-0 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-[4rem] blur-[70px]" />

              {/* Logo card */}
              <div className="relative z-10 w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px] rounded-[3rem] overflow-hidden border-[8px] border-white dark:border-card shadow-[0_40px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                <Image src="/logo.png" alt={companyName || "StockLocal"} fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />

                {/* Status badge inside logo */}
                <div className="absolute bottom-5 left-5 right-5 px-4 py-3 bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                      <FiCheckCircle size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-white/60 uppercase tracking-widest leading-none">{t.home.systemStatus}</p>
                      <p className="text-xs font-black text-white leading-tight mt-0.5">{t.home.optimizedSystem}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-300 shrink-0">V2.4</span>
                </div>
              </div>

              {/* Floating top-left: company name */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-5 -left-5 md:-left-8 px-4 py-3 bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl shadow-xl dark:shadow-slate-900/60"
              >
                <p className="text-[8px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-0.5">{t.home.liveAnalytics}</p>
                <p className="text-sm font-black text-slate-900 dark:text-foreground italic truncate max-w-[130px]">
                  {companyName || "StockLocal"}
                </p>
              </motion.div>

              {/* Floating bottom-right: efficiency */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-5 -right-5 md:-right-8 px-4 py-3 bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl shadow-xl dark:shadow-slate-900/60"
              >
                <p className="text-[8px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-0.5">{t.home.efficiencyIncrease}</p>
                <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400 italic leading-none">+42%</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature cards row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-white dark:border-border rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/40 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-foreground uppercase tracking-widest mb-1">{f.label}</p>
              <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">{f.desc}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
