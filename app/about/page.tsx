"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiTruck, FiSmartphone, FiLock,
  FiZap, FiLayers, FiCpu, FiCode, FiCheckCircle,
  FiPackage, FiBox, FiPhone, FiMail, FiMapPin
} from "react-icons/fi";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import logo from "../../public/icons/icon-512x512.png";

export default function About() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const a = t.about;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: FiPackage,    text: a.features.pharmaceutical, color: "text-indigo-500 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-500/15" },
    { icon: FiTruck,      text: a.features.logistics,       color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
    { icon: FiSmartphone, text: a.features.multichannel,    color: "text-blue-500 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/15" },
    { icon: FiLock,       text: a.features.encryption,      color: "text-rose-500 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/15" },
  ];

  const technologies = [
    { name: a.framework, val: "Next.js 15 Edge",      icon: FiZap },
    { name: a.dataLayer, val: "Prisma & SQLite",      icon: FiLayers },
    { name: a.engine,    val: "Node.js Runtime",      icon: FiCpu },
    { name: a.design,    val: "Tailwind Adaptive UI", icon: FiCode },
  ];

  const stats = [
    { val: "99.9%", label: a.statsUptime, color: "text-emerald-500 dark:text-emerald-400" },
    { val: "<50ms", label: a.statsSpeed,  color: "text-indigo-500 dark:text-indigo-400" },
    { val: "∞",     label: a.statsUsers,  color: "text-violet-500 dark:text-violet-400" },
  ];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-muted-foreground animate-pulse">{a.loading}</p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-background overflow-hidden selection:bg-indigo-500 selection:text-white">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 50, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -right-[5%] w-[700px] h-[700px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[0%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/8 dark:bg-emerald-500/8 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 relative z-10">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 md:mb-28"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-[2.5rem] blur-[30px] scale-110" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] overflow-hidden border-4 border-white dark:border-white/10 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                <Image src={logo} alt="LocalStock" fill className="object-cover" />
              </div>
            </motion.div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{a.badge}</span>
            <span className="w-px h-3 bg-indigo-200 dark:bg-indigo-500/30" />
            <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">{a.version}</span>
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter italic leading-none mb-4">
            <span className="text-slate-900 dark:text-foreground">{a.titlePrefix} </span>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">{a.titleHighlight}</span>
          </h1>

          {/* Wordmark */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <span className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight">STOCK</span>
          </div>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-500 dark:text-muted-foreground font-medium leading-relaxed">
            {a.subtitle}
          </p>
        </motion.div>

        {/* ── STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 md:gap-6 mb-16"
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem] border border-white dark:border-border p-6 md:p-8 text-center shadow-sm">
              <p className={`text-3xl md:text-4xl font-black italic ${s.color} mb-1`}>{s.val}</p>
              <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Vision card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="lg:col-span-7 bg-white/80 dark:bg-card/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white dark:border-border shadow-sm relative overflow-hidden"
          >
            <FiBox size={220} className="absolute -bottom-10 -right-10 text-slate-100 dark:text-white/[0.03] pointer-events-none" />

            <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic mb-6 flex items-center gap-4">
              <span className="w-10 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex-shrink-0" />
              {a.vision}
            </h2>
            <p className="text-slate-600 dark:text-muted-foreground text-base md:text-lg leading-relaxed font-medium mb-10">
              {a.visionText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-4 p-5 bg-slate-50/80 dark:bg-secondary/50 rounded-[1.5rem] border border-white dark:border-border hover:shadow-md dark:hover:shadow-slate-900/30 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <f.icon size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-foreground italic">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tech stack card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/40 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[length:22px_22px] rounded-[3rem]" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full gap-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
                <FiCpu size={11} className="text-indigo-400" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{a.techIdentity}</span>
              </div>

              <div className="space-y-6 flex-1">
                {technologies.map((tech, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/35">{tech.name}</span>
                      <tech.icon size={13} className="text-indigo-400/40 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-base font-black text-white italic">{tech.val}</p>
                    <div className="mt-2 h-px bg-white/5" />
                  </div>
                ))}
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle size={16} className="text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-snug">{a.highAvailability}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── CONTACT ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em]">{a.contactTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: FiPhone,  label: a.hotline,       val: "+22230572816",           color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-100 dark:ring-emerald-500/10" },
              { icon: FiMail,   label: a.expertSupport, val: "lamat032025@gmail.com",  color: "text-indigo-500 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-500/15",   ring: "ring-indigo-100 dark:ring-indigo-500/10" },
              { icon: FiMapPin, label: a.mainHQ,        val: "Nouakchott, Mauritanie", color: "text-rose-500 dark:text-rose-400",       bg: "bg-rose-50 dark:bg-rose-500/15",       ring: "ring-rose-100 dark:ring-rose-500/10" },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-7 md:p-8 rounded-[2.5rem] border border-white dark:border-border shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/30 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-[1.5rem] ${c.bg} ${c.color} ring-4 ${c.ring} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <c.icon size={24} />
                </div>
                <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-2">{c.label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-foreground italic break-words leading-snug">{c.val}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Bottom gradient line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}
