"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiHome } from "react-icons/fi";
import { useLanguage } from "./context/LanguageContext";
import logo from "../public/icons/icon-512x512.png";

export default function NotFound() {
  const { t } = useLanguage();
  const n = t.notFound;

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-background overflow-hidden flex flex-col items-center justify-center px-6 selection:bg-indigo-500 selection:text-white">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[5%] -left-[10%] w-[400px] h-[400px] bg-rose-400/8 dark:bg-rose-500/8 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div className="relative w-20 h-20 rounded-[1.8rem] overflow-hidden shadow-2xl shadow-indigo-500/20 border-2 border-white dark:border-white/10 ring-4 ring-indigo-500/10">
            <Image src={logo} alt="Logo" fill className="object-cover" />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">
            {n.badge}
          </span>
        </motion.div>

        {/* 404 illustration + number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mb-6"
        >
          <Image
            src="/not-found.png"
            alt="Not Found"
            width={260}
            height={260}
            unoptimized
            className="opacity-90 dark:opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[100px] sm:text-[120px] font-black text-slate-900/[0.06] dark:text-white/[0.04] leading-none select-none tracking-tighter">
              {n.code}
            </span>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">
            {n.title}
          </h1>
          <p className="text-slate-500 dark:text-muted-foreground font-medium text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
            {n.subtitle}
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Link
            href="/"
            className="group relative overflow-hidden px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 dark:shadow-indigo-900/40 transition-all"
          >
            <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <FiHome size={16} className="relative" />
            <span className="relative">{n.backHome}</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white dark:bg-card border-2 border-slate-100 dark:border-border text-slate-800 dark:text-foreground rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {n.explore}
            <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>

      {/* Bottom gradient line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}
