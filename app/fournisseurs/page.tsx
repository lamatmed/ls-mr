/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from "react";
import { getAllFournisseurs, addFournisseur, updateFournisseur, deleteFournisseur } from '../utlis/actions';
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import {
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiTruck,
  FiSave,
  FiX
} from "react-icons/fi";
import Swal from "sweetalert2"
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

type Fournisseur = {
  id: string;
  name: string;
  contact?: string | null;
  _count?: { products: number };
};

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentFournisseur, setCurrentFournisseur] = useState<{ id: string; name: string; contact?: string } | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newContact, setNewContact] = useState("");

  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
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
    fetchFournisseurs();
  }, []);

  const fetchFournisseurs = async () => {
    setLoading(true);
    const data = await getAllFournisseurs();
    setFournisseurs(data);
    setLoading(false);
  };

  const handleAddFournisseur = async () => {
    if (!newCatName.trim()) {
      toast.error(t.fournisseurs.nameRequired);
      return;
    }
    Swal.fire({ title: t.fournisseurs.creating, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await addFournisseur(newCatName, newContact);
    Swal.close();
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.fournisseurs.addSuccess);
      setNewCatName("");
      setNewContact("");
      setIsAddModalOpen(false);
      fetchFournisseurs();
    }
  };

  const handleUpdateFournisseur = async () => {
    if (!currentFournisseur || !currentFournisseur.name.trim()) {
      toast.error(t.fournisseurs.nameRequired);
      return;
    }
    Swal.fire({ title: t.common.updating, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await updateFournisseur(currentFournisseur.id, currentFournisseur.name, currentFournisseur.contact);
    Swal.close();
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.fournisseurs.updateSuccess);
      setIsEditModalOpen(false);
      setCurrentFournisseur(null);
      fetchFournisseurs();
    }
  };

  const handleDeleteFournisseur = async (id: string, hasProducts: boolean) => {
    if (hasProducts) {
      Swal.fire({
        icon: "warning",
        title: t.fournisseurs.warningTitle,
        text: t.fournisseurs.hasProductsWarning,
        showCancelButton: true,
        confirmButtonText: t.fournisseurs.deleteAnyway,
        cancelButtonText: t.common.cancel,
        confirmButtonColor: "#ef4444",
        customClass: { popup: 'rounded-[2rem]' }
      }).then(async (result) => {
        if (result.isConfirmed) executeDelete(id);
      });
    } else {
      executeDelete(id);
    }
  };

  const executeDelete = async (id: string) => {
    Swal.fire({ title: t.fournisseurs.deleting, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const response = await deleteFournisseur(id);
    Swal.close();
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success(t.fournisseurs.deleteSuccess);
      fetchFournisseurs();
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
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-10%] -right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <FiTruck size={24} />
              </div>
              <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em]">{t.fournisseurs.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.fournisseurs.titlePrefix} <span className="text-teal-600 dark:text-teal-400 italic">{t.fournisseurs.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-md">{t.fournisseurs.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-teal-600 text-white rounded-2xl shadow-xl shadow-teal-600/20 flex items-center gap-3 hover:bg-teal-700 transition-all font-black text-sm tracking-wide"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus size={20} strokeWidth={3} />
              <span>{t.fournisseurs.newSupplier}</span>
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-card/90 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <Loader />
              <p className="text-slate-400 dark:text-muted-foreground/40 font-black uppercase tracking-[0.2em] text-xs">{t.fournisseurs.loadingData}</p>
            </div>
          ) : fournisseurs.length === 0 ? (
            <div className="text-center py-32">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary text-slate-300 dark:text-muted-foreground/30 mb-6"
              >
                <FiTruck size={40} />
              </motion.div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">{t.fournisseurs.noSuppliers}</h3>
              <p className="text-slate-500 dark:text-muted-foreground font-medium mt-2">{t.fournisseurs.noSuppliersDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border">
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.fournisseurs.table.name}</th>
                    <th className="px-8 py-6 text-center text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.fournisseurs.table.contact}</th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.fournisseurs.table.actions}</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50 dark:divide-border"
                >
                  <AnimatePresence>
                    {fournisseurs.map((f) => (
                      <motion.tr
                        key={f.id}
                        variants={itemVariants}
                        layout
                        className="hover:bg-slate-50/50 dark:hover:bg-secondary/40 transition-all group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{f.name}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className="text-sm font-black text-slate-500 dark:text-muted-foreground tracking-tight">
                            {f.contact || t.fournisseurs.noContact}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-left">
                          <div className="flex justify-start gap-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 transition-all shadow-sm"
                              onClick={() => {
                                setCurrentFournisseur({ id: f.id, name: f.name, contact: f.contact || "" });
                                setIsEditModalOpen(true);
                              }}
                            >
                              <FiEdit2 size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              onClick={() => handleDeleteFournisseur(f.id, (f._count?.products || 0) > 0)}
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

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-white dark:bg-card w-full max-w-lg rounded-[3rem] shadow-2xl dark:shadow-black/40 p-10 border border-transparent dark:border-border"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.fournisseurs.newSupplier}</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-12 h-12 bg-slate-50 dark:bg-secondary rounded-2xl flex items-center justify-center text-slate-400 dark:text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">{t.fournisseurs.supplierName}</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder={t.fournisseurs.namePlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-teal-500/20 dark:focus:border-teal-500/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">{t.fournisseurs.contactOptional}</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder={t.fournisseurs.contactPlaceholder}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-teal-500/20 dark:focus:border-teal-500/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                  />
                </div>
                <button
                  onClick={handleAddFournisseur}
                  className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all"
                >
                  {t.fournisseurs.createSupplier}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && currentFournisseur && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative bg-white dark:bg-card w-full max-w-lg rounded-[3rem] shadow-2xl dark:shadow-black/40 p-10 border border-transparent dark:border-border"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic">{t.fournisseurs.editSupplier}</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-12 h-12 bg-slate-50 dark:bg-secondary rounded-2xl flex items-center justify-center text-slate-400 dark:text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">{t.fournisseurs.supplierName}</label>
                  <input
                    type="text"
                    value={currentFournisseur.name}
                    onChange={(e) => setCurrentFournisseur({ ...currentFournisseur, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-teal-500/20 dark:focus:border-teal-500/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest ml-1">{t.fournisseurs.contact}</label>
                  <input
                    type="text"
                    value={currentFournisseur.contact || ""}
                    onChange={(e) => setCurrentFournisseur({ ...currentFournisseur, contact: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-teal-500/20 dark:focus:border-teal-500/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl p-4 outline-none transition-all font-bold text-slate-800 dark:text-foreground"
                  />
                </div>
                <button
                  onClick={handleUpdateFournisseur}
                  className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all"
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
