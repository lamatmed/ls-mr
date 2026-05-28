'use client';

import Link from "next/link";
import Image from "next/image";
import logo from "../../public/icons/icon-512x512.png";
import {
  FiMail,
  FiGithub,
  FiLinkedin,
  FiArrowRight,
  FiShield,
  FiMapPin,
  FiPhone,
  FiGlobe,
  FiExternalLink
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { getCompany } from "../utlis/actions";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [companyInfo, setCompanyInfo] = useState({ name: "", address: "", contact: "" });
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCompany = async () => {
      const company = await getCompany();
      setCompanyInfo({ name: company.name, address: company.address, contact: company.contact });
    };
    fetchCompany();
  }, []);

  const navLinks = [
    { name: t.footer.links.dashboard, href: "/dashboard" },
    { name: t.footer.links.salesMovement, href: "/sales" },
    { name: t.footer.links.expenses, href: "/depenses" },
    { name: t.footer.links.inventoryCatalog, href: "/list" },
    { name: t.footer.links.about, href: "/about" },
  ];

  const socials = [
    { icon: FiMail, href: "mailto:lamat032025@gmail.com", label: "Email" },
    { icon: FiGithub, href: "#", label: "GitHub" },
    { icon: FiLinkedin, href: "#", label: "LinkedIn" },
    { icon: FiGlobe, href: "#", label: "Web" },
  ];

  return (
    <footer className="relative w-full bg-slate-900 dark:bg-[#060d1f] border-t border-white/5 dark:border-white/10 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Atmospheric blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/[0.08] dark:bg-indigo-500/[0.12] rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/[0.05] dark:bg-emerald-500/[0.08] rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 sm:pt-20 lg:pt-28 pb-8 sm:pb-12">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 mb-10 sm:mb-16">

          {/* Brand — full width on mobile, 5 cols on lg */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-500 flex-shrink-0 border-2 border-white/15 ring-4 ring-indigo-500/10">
                <Image src={logo} alt="Logo" fill className="object-cover" />
              </div>
              <div className="flex flex-col leading-none gap-1">
                <span className="text-[10px] font-black text-white/25 uppercase tracking-[0.5em]">local</span>
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent uppercase tracking-tighter leading-none">STOCK</span>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">{t.footer.enterpriseOS}</p>
              </div>
            </Link>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium max-w-sm">
              {t.footer.mission}
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {socials.map((s, i) => (
                <Link
                  key={i}
                  href={s.href}
                  aria-label={s.label}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 dark:bg-white/[0.08] border border-white/10 dark:border-white/[0.15] flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all duration-300"
                >
                  <s.icon size={17} />
                </Link>
              ))}
            </div>

            {/* Inline status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.footer.version}</span>
            </div>
          </div>

          {/* Navigation — 3 cols on lg */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-4 h-px bg-indigo-500/60 rounded-full" />
              {t.footer.navigation}
            </h3>
            {/* 2-col grid on mobile, 1-col on lg */}
            <nav className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-1 gap-x-4 gap-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <FiArrowRight size={12} className="text-indigo-500/60 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                  <span className="font-bold text-sm truncate">{link.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Support — 4 cols on lg */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-4 h-px bg-emerald-500/60 rounded-full" />
              {t.footer.supportCenter}
            </h3>
            <div className="space-y-3">
              {/* Location */}
              <div className="flex items-center gap-3 p-4 bg-white/[0.03] dark:bg-white/[0.06] rounded-2xl border border-white/5 dark:border-white/10 hover:bg-white/[0.07] dark:hover:bg-white/[0.10] hover:border-white/10 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FiMapPin size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-white/30 dark:text-white/40 uppercase tracking-widest leading-none mb-0.5">{t.footer.location}</p>
                  <p className="text-sm text-white font-bold truncate">{companyInfo.address || "كرو، موريتانيا"}</p>
                </div>
              </div>
              {/* Contact */}
              <div className="flex items-center gap-3 p-4 bg-white/[0.03] dark:bg-white/[0.06] rounded-2xl border border-white/5 dark:border-white/10 hover:bg-white/[0.07] dark:hover:bg-white/[0.10] hover:border-white/10 transition-all group">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FiPhone size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-white/30 dark:text-white/40 uppercase tracking-widest leading-none mb-0.5">{t.footer.help}</p>
                  <p className="text-sm text-white font-bold truncate">{companyInfo.contact || "+222 30 57 28 16"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] dark:border-white/[0.12]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            {/* Left: copyright + encrypted */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-wide">
                {t.footer.copyright
                  .replace('{year}', currentYear.toString())
                  .replace('{company}', companyInfo.name || "STOCKLOCAL")}
              </p>
              <div className="flex items-center gap-1.5">
                <FiShield size={11} className="text-emerald-500/70" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t.footer.encryptedSession}</span>
              </div>
            </div>

            {/* Right: digital assets */}
            <p className="text-[9px] font-black text-white/15 uppercase tracking-widest">{t.footer.digitalAssets}</p>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-600/40 dark:via-indigo-400/50 to-transparent" />
    </footer>
  );
};

export default Footer;
