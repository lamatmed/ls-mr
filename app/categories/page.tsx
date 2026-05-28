'use client'

import { useState, useEffect } from "react";
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../utlis/actions';
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiGrid,
  FiX
} from "react-icons/fi";
import Swal from "sweetalert2"
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

type Category = {
  id: string;
  name: string;
  _count?: { products: number };
};

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<{id: string, name: string} | null>(null);
  const [newCatName, setNewCatName] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          if (!userData.admin) router.push('/');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getAllCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error(t.categories.nameRequired);
      return;
    }

    Swal.fire({ title: t.categories.creating, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await addCategory(newCatName);
    Swal.close();

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.categories.addSuccess);
      setNewCatName("");
      setIsAddModalOpen(false);
      fetchCategories();
    }
  };

  const handleUpdateCategory = async () => {
    if (!currentCategory || !currentCategory.name.trim()) {
      toast.error(t.categories.nameRequired);
      return;
    }

    Swal.fire({ title: t.common.updating, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await updateCategory(currentCategory.id, currentCategory.name);
    Swal.close();

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.categories.updateSuccess);
      setIsEditModalOpen(false);
      setCurrentCategory(null);
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string, hasProducts: boolean) => {
    if (hasProducts) {
      Swal.fire({
        icon: "warning",
        title: t.categories.warningTitle,
        text: t.categories.hasProductsWarning,
        showCancelButton: true,
        confirmButtonText: t.categories.deleteAnyway,
        cancelButtonText: t.common.cancel,
        confirmButtonColor: "#ef4444",
        customClass: { popup: 'rounded-[2rem]' },
      }).then(async (result) => {
        if (result.isConfirmed) {
          executeDelete(id);
        }
      });
    } else {
      executeDelete(id);
    }
  };

  const executeDelete = async (id: string) => {
    Swal.fire({ title: t.categories.deleting, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await deleteCategory(id);
    Swal.close();

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.categories.deleteSuccess);
      fetchCategories();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-10%] -right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiGrid size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.categories.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.categories.titlePrefix} <span className="text-primary italic">{t.categories.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-md">{t.categories.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 hover:bg-primary/90 transition-all font-black text-sm tracking-wide"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus size={20} strokeWidth={3} />
              <span>{t.categories.newCategory}</span>
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden"
        >
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader />
              <p className="text-slate-400 dark:text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">{t.categories.loadingData}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-32">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground mb-6"
              >
                <FiGrid size={40} />
              </motion.div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">{t.categories.noCategories}</h3>
              <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">{t.categories.noCategoriesDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.categories.categoryName}</th>
                    <th className="px-8 py-6 text-center text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.categories.table.relatedProducts}</th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.common.actions}</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50 dark:divide-border"
                >
                  <AnimatePresence>
                    {categories.map((c) => (
                      <motion.tr
                        key={c.id}
                        variants={itemVariants}
                        layout
                        className="hover:bg-slate-50/50 dark:hover:bg-secondary/40 transition-all group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{c.name}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-tighter shadow-sm ${(c._count?.products || 0) === 0 ? 'bg-slate-100 text-slate-400 dark:bg-secondary dark:text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                            {t.categories.productsCountFmt.replace('{count}', String(c._count?.products || 0))}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <div className="flex justify-start gap-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                              onClick={() => {
                                setCurrentCategory({ id: c.id, name: c.name });
                                setIsEditModalOpen(true);
                              }}
                            >
                              <FiEdit2 size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              onClick={() => handleDeleteCategory(c.id, (c._count?.products || 0) > 0)}
                            >
                              <FiTrash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-white dark:bg-card dark:border dark:border-border w-full max-w-lg rounded-[3rem] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.categories.newCategory}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="w-12 h-12 bg-slate-50 dark:bg-secondary rounded-2xl flex items-center justify-center text-slate-400 dark:text-muted-foreground hover:text-rose-500 transition-all"><FiX size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.categories.categoryName}</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={t.categories.namePlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleAddCategory}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {t.categories.createCategory}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {isEditModalOpen && currentCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-white dark:bg-card dark:border dark:border-border w-full max-w-lg rounded-[3rem] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.categories.editCategory}</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 bg-slate-50 dark:bg-secondary rounded-2xl flex items-center justify-center text-slate-400 dark:text-muted-foreground hover:text-rose-500 transition-all"><FiX size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.categories.categoryName}</label>
                  <input
                    type="text"
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-secondary dark:text-foreground border-2 border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-secondary/80 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleUpdateCategory}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  {t.common.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
