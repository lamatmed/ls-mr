/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from "react";
import { addUser, blockUser, deleteUser, getAllUsers, unblockUser, updateUser } from "../utlis/actions";
import Swal from "sweetalert2";
import Loader from "../components/Loader";
import { useRouter } from "next/navigation";
import {
  FiUserPlus,
  FiEdit3,
  FiShield,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiUsers,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiStar
} from "react-icons/fi";
import { User } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ nom: "", password: "", admin: false });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) throw new Error("unauthorized");
        const userData = await response.json();
        setCurrentUser(userData);
        fetchUsers();
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      Swal.fire({
        icon: "error",
        title: t.common.error,
        text: t.users.loadError,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  async function handleSubmit() {
    const { nom, password } = formData;
    if (!nom || (!password && !editingUser)) {
      Swal.fire({
        icon: "error",
        title: t.users.requiredFields,
        text: t.users.requiredFieldsDesc,
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }

    setProcessing(true);
    try {
      if (editingUser) {
        const confirm = await Swal.fire({
          title: t.users.editConfirmTitle,
          text: t.users.editConfirmDesc.replace('{name}', editingUser.nom),
          icon: "question",
          showCancelButton: true,
          confirmButtonText: t.common.confirm,
          cancelButtonText: t.common.cancel,
          confirmButtonColor: "#4f46e5",
          cancelButtonColor: "#64748b",
          customClass: { popup: 'rounded-[2rem]' }
        });
        if (!confirm.isConfirmed) { setProcessing(false); return; }

        const res = await updateUser(editingUser.id, nom, password, formData.admin);
        if (res?.error) {
          Swal.fire({ icon: "error", title: t.common.error, text: res.error, customClass: { popup: 'rounded-[2rem]' } });
          setProcessing(false);
          return;
        }
        toastStatus("success", t.users.updateSuccess);
      } else {
        const res = await addUser(nom, password, formData.admin);
        if (res?.error) {
          Swal.fire({ icon: "error", title: t.common.error, text: res.error, customClass: { popup: 'rounded-[2rem]' } });
          setProcessing(false);
          return;
        }
        toastStatus("success", t.users.addSuccess);
      }

      resetForm();
      setIsFormOpen(false);
      await fetchUsers();
    } catch {
      Swal.fire({
        icon: "error",
        title: t.common.error,
        text: t.users.operationError,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setProcessing(false);
    }
  }

  const toastStatus = (icon: 'success' | 'error', title: string) => {
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    }).fire({ icon, title });
  };

  async function handleDelete(id: string) {
    const isLastAdmin = users.filter(u => u.admin).length === 1 && users.some(u => u.id === id && u.admin);
    if (isLastAdmin) {
      Swal.fire({
        icon: "error",
        title: t.users.lastAdminTitle,
        text: t.users.lastAdminDesc,
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }

    const confirm = await Swal.fire({
      title: t.users.deleteConfirm,
      text: t.users.deleteWarning,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.users.confirmDestroy,
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (confirm.isConfirmed) {
      try {
        await deleteUser(id);
        toastStatus("success", t.users.deleteSuccess);
        await fetchUsers();
      } catch {
        toastStatus("error", t.users.deleteFailed);
      }
    }
  }

  const handleBlockUser = async (user: User) => {
    const action = user.isBlocked ? t.users.unblock : t.users.block;

    const confirm = await Swal.fire({
      title: `${action.toUpperCase()} ?`,
      text: t.users.blockConfirmDesc.replace('{action}', action).replace('{name}', user.nom),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: user.isBlocked ? "#10b981" : "#f59e0b",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.users.yesAction.replace('{action}', action),
      cancelButtonText: t.common.cancel,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (!confirm.isConfirmed) return;

    try {
      if (user.isBlocked) {
        await unblockUser(user.id);
      } else {
        await blockUser(user.id);
      }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
      toastStatus("success", user.isBlocked ? t.users.unblockSuccess : t.users.blockSuccess);
    } catch {
      toastStatus("error", t.users.actionFailed);
    }
  };

  function resetForm() {
    setFormData({ nom: "", password: "", admin: false });
    setEditingUser(null);
  }

  if (!currentUser) return <Loader />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-1/2 h-1/2 bg-primary/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -right-[-10%] w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiSettings size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.users.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.users.titlePrefix} <span className="text-primary italic">{t.users.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.users.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                <FiUsers size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.users.collaborators}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">{users.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Panel */}
          {currentUser.admin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-foreground">{t.users.adminSection}</h3>
                <button
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="px-4 py-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white transition-colors"
                >
                  {isFormOpen ? t.users.hideForm : t.users.addUser}
                </button>
              </div>

              <AnimatePresence>
                {isFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center gap-2 mb-8">
                        {editingUser ? (
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <FiEdit3 size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <FiUserPlus size={20} />
                          </div>
                        )}
                        <h2 className="text-lg font-black text-slate-900 dark:text-foreground tracking-tight italic">
                          {editingUser ? t.users.editProfile : t.users.newAccount}
                        </h2>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.users.identifierLabel}</label>
                          <div className="relative">
                            <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <input
                              name="nom"
                              type="text"
                              placeholder={t.users.usernamePlaceholder}
                              value={formData.nom}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40 text-right"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.users.securityKey}</label>
                          <div className="relative">
                            <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <input
                              name="password"
                              type="password"
                              placeholder={editingUser ? t.users.keepPasswordPlaceholder : t.users.passwordPlaceholder}
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40 text-right"
                            />
                          </div>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-secondary rounded-2xl border border-slate-100 dark:border-border">
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.admin ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-muted text-slate-400 dark:text-muted-foreground'}`}>
                                <FiShield size={16} />
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-foreground/85 uppercase tracking-wider">{t.users.adminPermission}</span>
                            </div>
                            <div className="relative inline-flex items-center">
                              <input
                                name="admin"
                                type="checkbox"
                                checked={formData.admin}
                                onChange={handleInputChange}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-300 dark:bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                          </label>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={processing}
                            className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl ${processing
                              ? "bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-white shadow-primary/20"}`}
                          >
                            {processing
                              ? t.common.syncing
                              : editingUser ? t.users.applyChanges : t.users.createAccount}
                          </motion.button>

                          <AnimatePresence>
                            {editingUser && (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                onClick={resetForm}
                                className="w-full py-4 text-xs font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-foreground transition-colors"
                              >
                                {t.users.cancelEdit}
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Users List */}
          <div className={currentUser.admin ? "lg:col-span-8" : "lg:col-span-12"}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border flex items-center justify-between">
                <h2 className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                  <FiUsers /> {t.users.accountsRegistry}
                </h2>
                <span className="px-4 py-1.5 bg-white dark:bg-card rounded-full text-[10px] font-black text-slate-400 dark:text-muted-foreground shadow-sm border border-slate-100 dark:border-border italic">
                  {t.users.activeFiles.replace('{count}', String(users.length))}
                </span>
              </div>

              {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <Loader />
                  <p className="text-slate-400 dark:text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">{t.users.verifyingData}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <motion.tbody
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="divide-y divide-slate-50 dark:divide-border"
                    >
                      <AnimatePresence>
                        {users.map((user) => (
                          <motion.tr
                            key={user.id}
                            variants={itemVariants}
                            layout
                            className={`group hover:bg-slate-50 dark:hover:bg-secondary/40 transition-all ${user.isBlocked ? 'opacity-60 grayscale' : ''}`}
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-inner relative transition-transform duration-500 group-hover:rotate-12 ${user.admin
                                  ? 'bg-primary/10 text-primary border border-primary/10'
                                  : 'bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground border border-slate-100 dark:border-border'}`}>
                                  {user.nom.charAt(0).toUpperCase()}
                                  {user.admin && <FiStar className="absolute -top-1 -right-1 text-primary fill-primary" size={14} />}
                                </div>
                                <div>
                                  <p className={`text-base font-black tracking-tight flex items-center gap-2 ${user.isBlocked ? 'text-slate-400 dark:text-muted-foreground line-through' : 'text-slate-800 dark:text-foreground'}`}>
                                    {user.nom}
                                    {currentUser.id === user.id && (
                                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[9px] rounded-full uppercase tracking-widest font-black ring-1 ring-emerald-100 dark:ring-emerald-500/20 ring-inset">
                                        {t.users.me}
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${user.admin ? 'text-primary' : 'text-slate-400 dark:text-muted-foreground'}`}>
                                      <FiShield size={10} /> {user.admin ? t.users.superAdmin : t.common.user}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-muted-foreground/30"></span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${user.isBlocked ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                      {user.isBlocked ? <FiXCircle size={10} /> : <FiCheckCircle size={10} />}
                                      {user.isBlocked ? t.users.suspendedAccount : t.users.active}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {currentUser.admin && (
                              <td className="px-8 py-6 text-left">
                                <div className="flex justify-start gap-3 -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      setEditingUser(user);
                                      setFormData({ nom: user.nom, password: "", admin: user.admin });
                                      setIsFormOpen(true);
                                    }}
                                    className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title={t.users.editFileTitle}
                                  >
                                    <FiEdit3 size={16} />
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleBlockUser(user)}
                                    disabled={currentUser.id === user.id}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${user.isBlocked
                                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 hover:bg-amber-500 hover:text-white'} disabled:opacity-20 disabled:grayscale`}
                                    title={user.isBlocked ? t.users.unblock : t.users.block}
                                  >
                                    {user.isBlocked ? <FiUnlock size={16} /> : <FiLock size={16} />}
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(user.id)}
                                    disabled={currentUser.id === user.id}
                                    className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-20 disabled:grayscale"
                                    title={t.users.permanentDeleteTitle}
                                  >
                                    <FiTrash2 size={16} />
                                  </motion.button>
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </motion.tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
