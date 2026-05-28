'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiArrowLeft, FiCheck, FiBriefcase,
  FiMapPin, FiPhone, FiHash, FiDollarSign,
  FiUpload, FiX, FiLogIn, FiGlobe
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function BoardingPage() {
  const router = useRouter();
  const { t, lang, setLang, setCurrency } = useLanguage();
  const b = t.boarding;

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', address: '', contact: '', nif: '', currency: 'MRU',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setError('');
  };

  const goTo = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError(b.nameRequired); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          contact: form.contact,
          nif: form.nif || null,
          currency: form.currency || 'MRU',
          logo: logoPreview || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (form.currency) setCurrency(form.currency);
        goTo(3);
      } else {
        setError('Erreur serveur');
      }
    } catch {
      setError('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const langs: { code: 'ar' | 'fr' | 'pt' | 'en' | 'es'; label: string; flag: string }[] = [
    { code: 'ar', label: 'عربي', flag: '🇲🇷' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-background overflow-hidden flex flex-col items-center justify-center px-4 py-8 selection:bg-indigo-500 selection:text-white">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: [0, 60, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[15%] -right-[5%] w-[650px] h-[650px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 60, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[5%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/8 dark:bg-emerald-500/8 rounded-full blur-[110px]"
        />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 dark:opacity-10" />
      </div>

      {/* Language picker — top right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {langs.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
              lang === l.code
                ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-white/60 dark:bg-card/60 border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground hover:border-slate-300 dark:hover:border-border/80'
            }`}
          >
            <span className="mr-1">{l.flag}</span>{l.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5 z-20">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      {/* Step dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <motion.div
            key={i}
            animate={{
              width: step === i + 1 ? 28 : 8,
              backgroundColor: step > i ? '#6366f1' : step === i + 1 ? '#6366f1' : '#e2e8f0',
            }}
            className="h-2 rounded-full"
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mt-10">
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.07)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              {/* Logo hero */}
              <div className="relative flex justify-center items-center pt-12 pb-6 bg-gradient-to-b from-indigo-50/60 dark:from-indigo-500/5 to-transparent">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                  className="relative"
                >
                  {/* Glow */}
                  <div className="absolute inset-0 bg-indigo-400/20 dark:bg-indigo-500/25 rounded-[3rem] blur-[40px] scale-110" />
                  <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 border-[6px] border-white dark:border-white/10 ring-4 ring-indigo-500/10">
                    <Image src="/logo.png" alt="Logo" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                  </div>
                  {/* Floating badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-3 -right-3 px-3 py-1.5 bg-emerald-500 rounded-xl shadow-lg"
                  >
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">v2.4</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Text */}
              <div className="px-10 pb-10 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{b.badge}</span>
                </div>

                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-foreground tracking-tighter italic mb-1">
                    {b.welcomeTitle}
                  </h1>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <span className="text-[9px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
                    <span className="text-xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight">STOCK</span>
                  </div>
                  <p className="text-slate-500 dark:text-muted-foreground font-medium text-sm leading-relaxed max-w-xs mx-auto">
                    {b.welcomeDesc}
                  </p>
                </div>

                <button
                  onClick={() => goTo(2)}
                  className="group w-full relative overflow-hidden py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/15 dark:shadow-indigo-900/40 transition-all mt-2"
                >
                  <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  <span className="relative">{b.start}</span>
                  <FiArrowRight size={16} className="relative group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 text-slate-400 dark:text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <FiLogIn size={13} />
                  {t.notFound.explore}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Company form ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.07)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              <div className="pt-10 pb-6 px-10 text-center border-b border-slate-100 dark:border-border">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
                  <FiBriefcase size={11} className="text-indigo-500 dark:text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{b.setupBadge}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">{b.setupTitle}</h2>
                <p className="text-slate-500 dark:text-muted-foreground text-xs font-medium mt-1">{b.setupSubtitle}</p>
              </div>

              <div className="px-8 py-7 space-y-4 max-h-[60vh] overflow-y-auto">

                {/* Name */}
                <Field icon={<FiBriefcase size={16} />} label={b.name} required>
                  <input
                    value={form.name}
                    onChange={set('name')}
                    placeholder={b.namePlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                  />
                </Field>

                {/* Address */}
                <Field icon={<FiMapPin size={16} />} label={b.address}>
                  <input
                    value={form.address}
                    onChange={set('address')}
                    placeholder={b.addressPlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                  />
                </Field>

                {/* Contact */}
                <Field icon={<FiPhone size={16} />} label={b.contact}>
                  <input
                    value={form.contact}
                    onChange={set('contact')}
                    placeholder={b.contactPlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                    dir="ltr"
                  />
                </Field>

                {/* NIF + Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<FiHash size={16} />} label={b.nif}>
                    <input
                      value={form.nif}
                      onChange={set('nif')}
                      placeholder={b.nifPlaceholder}
                      className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                      dir="ltr"
                    />
                  </Field>
                  <Field icon={<FiDollarSign size={16} />} label={b.currency}>
                    <input
                      value={form.currency}
                      onChange={set('currency')}
                      placeholder={b.currencyPlaceholder}
                      className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-indigo-200 dark:focus:border-indigo-500/30 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                      dir="ltr"
                    />
                  </Field>
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <FiUpload size={11} /> {b.logoLabel}
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  {logoPreview ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/30 group">
                      <Image src={logoPreview} alt="logo" fill className="object-cover" />
                      <button
                        onClick={() => { setLogoPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <FiX size={20} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-border hover:border-indigo-300 dark:hover:border-indigo-500/40 bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 text-xs font-black uppercase tracking-widest transition-all w-full justify-center"
                    >
                      <FiUpload size={14} /> {b.logoUpload}
                      <span className="opacity-50 font-medium normal-case tracking-normal">{b.logoHint}</span>
                    </button>
                  )}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-bold text-rose-500 flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={() => goTo(1)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-secondary border border-slate-200 dark:border-border flex items-center justify-center text-slate-500 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-secondary/80 transition-all flex-shrink-0"
                >
                  <FiArrowLeft size={18} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="group flex-1 relative overflow-hidden py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 dark:shadow-indigo-900/30 disabled:opacity-50 transition-all"
                >
                  <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  {saving ? (
                    <div className="relative w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="relative">{b.save}</span>
                      <FiArrowRight size={15} className="relative group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip */}
              <div className="pb-6 text-center">
                <button
                  onClick={() => goTo(3)}
                  className="text-[11px] font-black text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground uppercase tracking-widest transition-colors"
                >
                  {b.skip}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-[0_24px_60px_rgba(0,0,0,0.07)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center px-10 py-14 gap-6">

                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="relative"
                >
                  <div className="w-28 h-28 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <FiCheck size={52} className="text-white stroke-[3]" />
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                    className="absolute inset-0 rounded-[2rem] bg-emerald-500/30"
                  />
                </motion.div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{b.doneBadge}</span>
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-foreground tracking-tighter italic">{b.doneTitle}</h2>
                  <p className="text-slate-500 dark:text-muted-foreground font-medium text-sm max-w-xs mx-auto leading-relaxed">{b.doneSubtitle}</p>
                </div>

                {/* Company name display */}
                {form.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-secondary rounded-2xl border border-slate-100 dark:border-border w-full"
                  >
                    {logoPreview ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-border">
                        <Image src={logoPreview} alt="logo" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                        <FiBriefcase size={18} className="text-indigo-500 dark:text-indigo-400" />
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{b.setupBadge}</p>
                      <p className="font-black text-slate-900 dark:text-foreground text-sm truncate">{form.name}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/15 rounded-lg">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{form.currency || 'MRU'}</span>
                    </div>
                  </motion.div>
                )}

                {/* Go to login */}
                <button
                  onClick={() => router.push('/login')}
                  className="group w-full relative overflow-hidden py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/15 dark:shadow-indigo-900/30 transition-all"
                >
                  <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  <FiLogIn size={16} className="relative" />
                  <span className="relative">{b.goLogin}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step label */}
        <motion.p
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-6"
        >
          {b.step.replace('{current}', String(step)).replace('{total}', String(TOTAL_STEPS))}
        </motion.p>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}

function Field({ icon, label, required, children }: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-slate-300 dark:text-muted-foreground/50">{icon}</span>
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
