'use client'
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../public/icons/icon-512x512.png";
import {
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiX,
  FiInfo,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiUser,
  FiPlusSquare,
  FiFileText,
  FiGrid,
  FiActivity,
  FiClock,
  FiDollarSign,
  FiTruck,
  FiSun,
  FiMoon,
  FiBell,
  FiAlertCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCompany, getAllProducts } from "../utlis/actions";
import { useLanguage, type Language } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Product } from "../types/product";

interface User {
  nom: string;
  admin: boolean;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇲🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [alertProducts, setAlertProducts] = useState<Product[]>([]);

  const ALERT_THRESHOLD_DAYS = 20;

  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const fetchUser = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/user", { signal });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAdmin(userData.admin);
      } else {
        setUser(null);
        setAdmin(false);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setUser(null);
      setAdmin(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await getAllProducts();
      const today = new Date();
      const filtered = data
        .map(p => ({ ...p, expirationDate: new Date(p.expirationDate).toISOString().split("T")[0] }))
        .filter(p => {
          const daysLeft = Math.ceil((new Date(p.expirationDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
          return daysLeft <= ALERT_THRESHOLD_DAYS;
        });
      setAlertProducts(filtered);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchUser(controller.signal);

    const fetchCompany = async () => {
      const company = await getCompany();
      setCompanyName(company.name);
    };
    fetchCompany();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    let isFetching = false;
    const interval = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      await fetchUser();
      isFetching = false;
    }, 10000);

    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch alerts on every route change so badge stays up to date without page reload
  useEffect(() => {
    if (user) fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: t.nav.logoutConfirmTitle,
      text: t.nav.logoutConfirmDesc,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.common.yes,
      cancelButtonText: t.common.cancel,
      customClass: {
        confirmButton: 'bg-primary rounded-xl px-6 py-3',
        cancelButton: 'bg-secondary rounded-xl px-6 py-3 text-foreground'
      }
    });
    if (result.isConfirmed) {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      setAdmin(false);
      router.push("/");
    }
  };

  const navLinks = [
    ...(admin ? [
      { href: "/products", label: t.nav.items, icon: FiPackage, color: "text-indigo-500" },
      { href: "/categories", label: t.nav.categories, icon: FiGrid, color: "text-pink-500" },
      { href: "/fournisseurs", label: t.nav.suppliers, icon: FiTruck, color: "text-teal-500" },
      { href: "/commandes", label: t.nav.sales, icon: FiFileText, color: "text-violet-500" },
      { href: "/update", label: t.nav.management, icon: FiPlusSquare, color: "text-fuchsia-500" },
      { href: "/depenses", label: t.nav.expenses, icon: FiDollarSign, color: "text-fuchsia-500" },
      { href: "/alerts", label: t.nav.notifications, icon: FiBell, color: "text-amber-500" },
    ] : []),
    { href: "/sales", label: t.nav.cashRegister, icon: FiShoppingCart, color: "text-rose-500" },
    { href: "/transactions", label: t.nav.transactions, icon: FiActivity, color: "text-amber-500" },
    { href: "/clients", label: t.nav.clients, icon: FiUsers, color: "text-emerald-500" },
    { href: "/dettes", label: t.nav.debts, icon: FiClock, color: "text-rose-500" },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'py-1' : 'py-2'}`}>
      <nav className={`mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 transition-all duration-300 ${scrolled ? 'glass-modern py-1.5' : 'border-b border-border/50 py-1.5'}`}>
        <div className="flex items-center justify-between gap-2 min-w-0">

          {/* Brand */}
          {/* Brand & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg ring-2 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-hover:scale-105 group-hover:shadow-primary/20">
                <Image src={logo} alt="Logo" fill className="object-cover" />
              </div>
              <div className="hidden sm:flex flex-col leading-none gap-[3px]">
                <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
                <span className="text-[15px] font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight leading-none">STOCK</span>
              </div>
            </Link>

            {user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                title="Afficher/Masquer la barre latérale"
              >
                <FiMenu size={16} />
              </button>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 overflow-x-auto scrollbar-none gap-0.5">
            {!user && (
              <Link
                href="/about"
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all group ${pathname === '/about' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              >
                <FiInfo size={15} className="text-indigo-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>{t.nav.about}</span>
                {pathname === '/about' && (
                  <motion.div layoutId="nav-active" className="absolute bottom-0.5 left-2 right-2 h-0.5 bg-primary/40 rounded-full" />
                )}
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

            {/* Admin shortcuts — desktop only */}
            {user && admin && (
              <div className="hidden lg:flex items-center gap-0.5 border-e border-border pe-1.5 me-0.5">
                <Link href="/users" className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title={t.nav.users}>
                  <FiUser size={16} />
                </Link>
                <Link href="/dashboard" className="p-1.5 text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition-colors" title={t.nav.dashboard}>
                  <FiGrid size={16} />
                </Link>
              </div>
            )}

            {/* Notification Bell */}
            {user && (
              <>
                {/* Mobile backdrop */}
                <AnimatePresence>
                  {notifOpen && isMobile && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setNotifOpen(false)}
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
                    />
                  )}
                </AnimatePresence>

                <div
                  className="relative"
                  onBlur={(e) => { if (!isMobile && !e.currentTarget.contains(e.relatedTarget)) setNotifOpen(false); }}
                >
                  <button
                    onClick={() => setNotifOpen(o => !o)}
                    className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    title={t.nav.notifications}
                  >
                    <FiBell size={15} className={alertProducts.length > 0 ? "text-amber-500" : ""} />
                    {alertProducts.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -end-1 min-w-[16px] h-4 px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none"
                      >
                        {alertProducts.length > 99 ? "99+" : alertProducts.length}
                      </motion.span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={isMobile ? { y: "100%" } : { opacity: 0, y: -6, scale: 0.96 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isMobile ? { y: "100%" } : { opacity: 0, y: -6, scale: 0.96 }}
                        transition={isMobile ? { type: "spring", damping: 30, stiffness: 280 } : { duration: 0.15 }}
                        className={
                          isMobile
                            ? "fixed inset-x-0 bottom-0 bg-card border-t border-border rounded-t-3xl shadow-2xl z-[60] flex flex-col max-h-[75vh]"
                            : "absolute top-full mt-2 end-0 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                        }
                      >
                        {/* Mobile handle bar */}
                        {isMobile && (
                          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                            <div className="w-10 h-1 bg-border rounded-full" />
                          </div>
                        )}

                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <FiBell size={14} className="text-amber-500" />
                            <span className="text-xs font-black text-foreground uppercase tracking-wider">{t.nav.notifications}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {alertProducts.length > 0 && (
                              <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">{alertProducts.length}</span>
                            )}
                            {isMobile && (
                              <button
                                onClick={() => setNotifOpen(false)}
                                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <FiX size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Product list */}
                        <div className="overflow-y-auto flex-1">
                          {alertProducts.length === 0 ? (
                            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                              <FiBell size={28} className="opacity-30" />
                              <p className="text-xs font-bold">{t.alerts.noAlerts}</p>
                            </div>
                          ) : (
                            alertProducts.map(p => {
                              const daysLeft = Math.ceil((new Date(p.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                              const isExpired = daysLeft <= 0;
                              return (
                                <div key={p.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 active:bg-secondary/60 hover:bg-secondary/40 transition-colors ${isExpired ? 'bg-rose-500/5' : 'bg-amber-500/5'}`}>
                                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-500' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-500'}`}>
                                    {isExpired ? <FiAlertCircle size={15} /> : <FiAlertTriangle size={15} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{p.name}</p>
                                    <p className={`text-[11px] font-bold mt-0.5 ${isExpired ? 'text-rose-500' : 'text-amber-500'}`}>
                                      {isExpired
                                        ? t.alerts.expired
                                        : t.alerts.remainingDays.replace('{days}', String(daysLeft))}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer link */}
                        {alertProducts.length > 0 && (
                          <div className="px-4 py-3 border-t border-border bg-secondary/20 flex-shrink-0">
                            <Link
                              href="/alerts"
                              onClick={() => setNotifOpen(false)}
                              className="flex items-center justify-center gap-1.5 text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-colors py-1"
                            >
                              <FiAlertCircle size={12} />
                              {t.nav.viewAllAlerts}
                            </Link>
                          </div>
                        )}

                        {/* iOS safe area bottom padding */}
                        {isMobile && <div className="h-safe-area-inset-bottom min-h-4 flex-shrink-0" />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Language Switcher */}
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setLangOpen(false); }}>
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/60 border border-border/40 text-[10px] font-black uppercase tracking-wider text-foreground hover:bg-secondary transition-all"
              >
                <span className="text-sm leading-none">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
                <span>{lang}</span>
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-muted-foreground text-[8px] leading-none"
                >▾</motion.span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1.5 end-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[130px]"
                  >
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                          lang === l.code
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <span className="text-base leading-none">{l.flag}</span>
                        <span>{l.label}</span>
                        {lang === l.code && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <FiSun size={15} className="text-amber-400" /> : <FiMoon size={15} />}
            </button>

            {/* User / Login — desktop */}
            {!user ? (
              <Link href="/login" className="btn-primary-modern hidden sm:flex items-center gap-1.5 !px-3 !py-2 !text-xs">
                <FiLogIn size={15} />
                <span>{t.nav.login}</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="hidden lg:flex flex-col items-end text-right max-w-[80px]">
                  <span className="text-[11px] font-black text-foreground truncate">{user.nom}</span>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-tighter ring-1 ring-primary/20 px-1 rounded-sm bg-primary/5">
                    {admin ? t.common.admin : t.common.seller}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-border/50"
                  title={t.nav.logout}
                >
                  <FiLogOut size={15} />
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-white transition-all"
              aria-label="Menu"
            >
              {isMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 h-screen w-[300px] max-w-[85vw] bg-card border-l border-border z-50 lg:hidden shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 overflow-hidden rounded-xl shadow-md">
                    <Image src={logo} alt="Logo" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col leading-none gap-[2px]">
                    <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
                    <span className="text-[15px] font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight leading-none">STOCK</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* User info card (mobile) */}
              {user && (
                <div className="mx-4 mt-4 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base flex-shrink-0">
                    {user.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-foreground truncate">{user.nom}</p>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-sm">
                      {admin ? t.common.admin : t.common.seller}
                    </span>
                  </div>
                  <button
                    onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    title={t.nav.logout}
                  >
                    <FiLogOut size={15} />
                  </button>
                </div>
              )}

              {/* Language switcher + Theme toggle (mobile) */}
              <div className="mx-4 mt-4 flex gap-2">
                <div className="flex-1 flex gap-1.5 bg-secondary/60 rounded-xl p-1 border border-border/40">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${lang === l.code ? 'bg-card text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.code}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={toggleTheme}
                  className="w-11 bg-secondary/60 rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                >
                  {isDark ? <FiSun size={18} className="text-amber-400" /> : <FiMoon size={18} />}
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 mt-4 pb-4 space-y-1">
                {!user ? (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20"
                    >
                      <FiLogIn size={18} />
                      <span>{t.nav.login}</span>
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${pathname === '/about' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-secondary text-foreground'}`}
                    >
                      <FiInfo size={18} className={pathname === '/about' ? 'text-white' : 'text-indigo-500'} />
                      <span className="text-sm">{t.nav.about}</span>
                    </Link>
                  </div>
                ) : (
                  <>
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${pathname === link.href ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-secondary text-foreground'}`}
                      >
                        <link.icon size={18} className={pathname === link.href ? 'text-white' : link.color} />
                        <span className="text-sm flex-1">{link.label}</span>
                        {link.href === '/alerts' && alertProducts.length > 0 && (
                          <span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                            {alertProducts.length}
                          </span>
                        )}
                      </Link>
                    ))}

                    {admin && (
                      <>
                        <div className="h-px bg-border my-3" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">{t.nav.users} / {t.nav.dashboard}</p>
                        <Link
                          href="/users"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${pathname === '/users' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-secondary text-foreground'}`}
                        >
                          <FiUser size={18} className={pathname === '/users' ? 'text-white' : 'text-blue-500'} />
                          <span className="text-sm">{t.nav.users}</span>
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${pathname === '/dashboard' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'hover:bg-secondary text-foreground'}`}
                        >
                          <FiGrid size={18} className={pathname === '/dashboard' ? 'text-white' : 'text-teal-500'} />
                          <span className="text-sm">{t.nav.dashboard}</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .glass-modern {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
          border-radius: 1.5rem;
        }
        .dark .glass-modern {
          background: rgba(15, 23, 42, 0.7);
          border-color: rgba(255, 255, 255, 0.05);
        }
        .btn-primary-modern {
          background: var(--primary);
          color: white;
          padding: 0.6rem 1.4rem;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 0.875rem;
          transition: all 0.3s;
          box-shadow: 0 4px 15px -5px var(--primary);
          display: inline-flex;
          align-items: center;
        }
        .btn-primary-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px var(--primary);
          filter: brightness(1.1);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </header>
  );
};

export default Header;
