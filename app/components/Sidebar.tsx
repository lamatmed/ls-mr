'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiGrid,
  FiPackage,
  FiShoppingCart,
  FiActivity,
  FiUsers,
  FiClock,
  FiDollarSign,
  FiUser,
  FiFileText,
  FiPlusSquare,
  FiTruck,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

interface User {
  nom: string;
  admin: boolean;
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const { isDark } = useTheme();

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAdmin(userData.admin);
      } else {
        setUser(null);
        setAdmin(false);
      }
    } catch {
      setUser(null);
      setAdmin(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // Sync collapse state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }

    const handleToggle = () => {
      setIsCollapsed(prev => {
        const next = !prev;
        localStorage.setItem("sidebar-collapsed", String(next));
        return next;
      });
    };

    window.addEventListener("toggle-sidebar", handleToggle);

    const interval = setInterval(fetchUser, 10000);
    return () => {
      window.removeEventListener("toggle-sidebar", handleToggle);
      clearInterval(interval);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  // Do not render sidebar if user is not logged in or if on public landing/login pages
  // Or if on boarding page
  const publicPages = ["/", "/login", "/boarding", "/about"];
  if (!user || publicPages.includes(pathname)) {
    return null;
  }

  const navLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: FiGrid, color: "text-teal-500", adminOnly: true },
    { href: "/products", label: t.nav.items, icon: FiPackage, color: "text-indigo-500", adminOnly: true },
    { href: "/categories", label: t.nav.categories, icon: FiGrid, color: "text-pink-500", adminOnly: true },
    { href: "/fournisseurs", label: t.nav.suppliers, icon: FiTruck, color: "text-teal-500", adminOnly: true },
    { href: "/commandes", label: t.nav.sales, icon: FiFileText, color: "text-violet-500", adminOnly: true },
    { href: "/update", label: t.nav.management, icon: FiPlusSquare, color: "text-fuchsia-500", adminOnly: true },
    { href: "/depenses", label: t.nav.expenses, icon: FiDollarSign, color: "text-fuchsia-500", adminOnly: true },
    { href: "/users", label: t.nav.users, icon: FiUser, color: "text-blue-500", adminOnly: true },
    { href: "/sales", label: t.nav.cashRegister, icon: FiShoppingCart, color: "text-rose-500", adminOnly: false },
    { href: "/transactions", label: t.nav.transactions, icon: FiActivity, color: "text-amber-500", adminOnly: false },
    { href: "/clients", label: t.nav.clients, icon: FiUsers, color: "text-emerald-500", adminOnly: false },
    { href: "/dettes", label: t.nav.debts, icon: FiClock, color: "text-rose-500", adminOnly: false },
  ];

  const filteredLinks = navLinks.filter(link => !link.adminOnly || admin);
  const isRtl = lang === "ar";
  const CollapseIcon = isCollapsed ? (isRtl ? FiChevronLeft : FiChevronRight) : (isRtl ? FiChevronRight : FiChevronLeft);

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 h-auto bg-card border-e border-border select-none relative transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar header / Branding */}
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[73px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg flex-shrink-0">
            {user.nom.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col leading-none"
            >
              <span className="text-sm font-black text-foreground truncate max-w-[140px]">{user.nom}</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter mt-0.5">
                {admin ? t.common.admin : t.common.seller}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                isActive
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className={`${link.color} transition-transform group-hover:scale-110 flex-shrink-0`} size={18} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate whitespace-nowrap"
                >
                  {link.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={`absolute top-2 bottom-2 w-1 bg-primary rounded-full ${isRtl ? "right-0" : "left-0"}`}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle button */}
      <div className="p-4 border-t border-border flex justify-center">
        <button
          onClick={toggleCollapse}
          className="w-10 h-10 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all flex items-center justify-center text-muted-foreground cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <CollapseIcon size={18} />
        </button>
      </div>
    </aside>
  );
}
