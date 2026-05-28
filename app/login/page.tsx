'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { isUserBlocked, loginUser } from '../utlis/actions';
import Loader from '../components/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import logo from '../../public/logo.png';

const Login = () => {
  const [credentials, setCredentials] = useState({ nom: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth', { cache: 'no-store' });
        if (response.ok) {
          const { user } = await response.json();
          if (user) window.location.href = user.role === 'admin' ? '/dashboard' : '/sales';
        }
      } catch { /* silent */ } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.nom.trim() || !credentials.password.trim()) {
      setError(t.login.errors.enterData);
      return;
    }
    setLoading(true);
    try {
      const blockCheck = await isUserBlocked(credentials.nom);
      if (!blockCheck.success) { setError(t.login.errors.unknownUser); return; }
      if (blockCheck.isBlocked) { setError(t.login.errors.accountSuspended); return; }
      const result = await loginUser(credentials.nom, credentials.password);
      if (result.success) {
        router.push(result.user.admin ? '/dashboard' : '/sales');
      } else {
        setError(result.error || t.login.errors.invalidCredentials);
      }
    } catch {
      setError(t.login.errors.serverError);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background px-4">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-400/8 dark:bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-violet-400/6 dark:bg-violet-500/8 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Card */}
        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/40 p-8">

          {/* Logo + brand */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <div className="relative w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-slate-100 dark:border-border shadow-lg shadow-indigo-500/10">
              <Image src={logo} alt="LocalStock" fill className="object-cover" priority />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight">STOCK</span>
            </div>
            <h1 className="text-sm font-bold text-slate-500 dark:text-muted-foreground">{t.login.title}</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                {t.login.username}
              </label>
              <div className="relative group">
                <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  name="nom"
                  value={credentials.nom}
                  onChange={handleChange}
                  placeholder={t.login.usernamePlaceholder}
                  className="w-full bg-slate-50 dark:bg-secondary border border-slate-200 dark:border-border focus:border-indigo-400 dark:focus:border-indigo-500/50 rounded-xl py-3 pl-10 pr-4 outline-none font-semibold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                  {t.login.password}
                </label>
                <button type="button" className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                  {t.login.forgot}
                </button>
              </div>
              <div className="relative group">
                <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-secondary border border-slate-200 dark:border-border focus:border-indigo-400 dark:focus:border-indigo-500/50 rounded-xl py-3 pl-10 pr-10 outline-none font-semibold text-slate-800 dark:text-foreground text-sm placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 hover:text-slate-500 dark:hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-rose-500 dark:text-rose-400 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : t.login.loginBtn
              }
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-border text-center">
            <Link href="/about" className="text-[10px] font-semibold text-slate-400 dark:text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 uppercase tracking-widest transition-colors">
              {t.nav.about}
            </Link>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #f8fafc inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #1e293b inset !important;
          -webkit-text-fill-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
