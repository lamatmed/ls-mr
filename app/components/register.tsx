'use client';

import { useState, useEffect } from 'react';
import { addUser } from '../utlis/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { FiUser, FiLock, FiUserPlus } from 'react-icons/fi';

const Register = () => {
  const { t } = useLanguage();
  const [nom, setNom] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => { setIsClient(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t.users?.passwordMismatch || 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await addUser(nom, password, admin);
      if (result.success) {
        toast.success(t.users?.addSuccess || 'Enregistrement réussi !');
        router.push('/login');
      } else {
        toast.error(result.error || t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  const inputCls = "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl outline-none transition-all font-bold text-slate-700";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafafa] dark:bg-background px-4">
      <div className="w-full max-w-md bg-white dark:bg-card rounded-[2rem] shadow-xl border border-white dark:border-white/5 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiUserPlus size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-foreground tracking-tight">
            {t.users?.addUser || 'Créer un compte'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
              {t.users?.username || 'Nom'}
            </label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={16} />
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
              {t.users?.password || 'Mot de passe'}
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={16} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
              {t.users?.confirmPassword || 'Confirmer'}
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50" size={16} />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox" id="admin" checked={admin} onChange={() => setAdmin(!admin)}
              className="h-4 w-4 accent-primary rounded border-slate-300"
            />
            <label htmlFor="admin" className="text-sm font-bold text-slate-600 dark:text-foreground/80">
              {t.users?.adminAccount || 'Compte administrateur'}
            </label>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? t.common.loading : (t.users?.register || "S'inscrire")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
