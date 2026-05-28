'use client'

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { addClient, deleteClient, getAllClients, updateClient, addVersement } from "../utlis/actions";
import { useRouter } from "next/navigation";
import {
  FiUserPlus,
  FiEdit3,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiPhone,
  FiHash,
  FiCreditCard,
  FiFilter,
  FiActivity,
  FiMail,
  FiDollarSign
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";

interface Client {
  id: string;
  nom: string;
  tel: string;
  nif: string | null;
  solde: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({ nom: "", tel: "", nif: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const clientsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) throw new Error('unauthorized');
        fetchClients();
      } catch {
        router.push('/login');
      }
    };
    verifyAuth();
  }, [router]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { success, clients: fetchedClients, error } = await getAllClients();
      if (!success) throw new Error(error || t.clients.operationError);
      setClients(fetchedClients);
      setFilteredClients(fetchedClients);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [t.clients.operationError]);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.nif && client.nif.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.tel.includes(searchTerm)
    );
    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [searchTerm, clients]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toastStatus = (icon: 'success' | 'error', title: string) => {
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    }).fire({ icon, title });
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.tel) {
      Swal.fire({
        icon: "error",
        title: t.clients.validation.requiredFields,
        text: t.clients.validation.namePhoneRequired,
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { nom, tel, nif } = formData;
      const result = editingClient
        ? await updateClient(editingClient.id, nom, tel, nif)
        : await addClient(nom, tel, nif || null);

      if (!result.success) throw new Error(result.error);

      toastStatus("success", editingClient ? t.clients.updateSuccess : t.clients.addSuccess);
      resetForm();
      await fetchClients();
    } catch {
      toastStatus("error", t.clients.operationError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
      title: t.clients.deleteConfirm,
      text: t.clients.deleteWarning,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: t.common.delete,
      cancelButtonText: t.clients.keep,
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (!isConfirmed) return;

    try {
      const result = await deleteClient(id);
      if (!result.success) throw new Error(result.error);
      toastStatus("success", t.clients.deleteSuccess);
      await fetchClients();
    } catch (error: any) {
      toastStatus("error", error.message || t.clients.deleteFailed);
    }
  };

  const resetForm = () => {
    setFormData({ nom: "", tel: "", nif: "" });
    setEditingClient(null);
  };

  const startEditing = (client: Client) => {
    setEditingClient(client);
    setFormData({ nom: client.nom, tel: client.tel, nif: client.nif || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVersement = async (client: Client) => {
    const { value: amount } = await Swal.fire({
      title: t.clients.versementTitle,
      text: t.clients.versementClient.replace('{name}', client.nom),
      input: 'number',
      inputPlaceholder: t.clients.versementPlaceholder,
      showCancelButton: true,
      confirmButtonText: t.common.confirm,
      cancelButtonText: t.common.cancel,
      confirmButtonColor: '#10b981',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return t.clients.versementInvalidAmount;
      },
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (amount) {
      try {
        const res = await addVersement(client.id, Number(amount));
        if (!('error' in res)) {
          toastStatus("success", t.clients.paymentSuccess);
          await fetchClients();
        } else {
          toastStatus("error", (res as any).error || t.clients.paymentError);
        }
      } catch {
        toastStatus("error", t.clients.serverError);
      }
    }
  };

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiActivity size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.clients.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.clients.titlePrefix} <span className="text-primary italic">{t.clients.titleHighlight}</span>
            </h1>
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.clients.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                <FiUsers size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.clientDatabase}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">{clients.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Search + Form */}
          <div className="lg:col-span-4 space-y-8">
            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-secondary flex items-center justify-center text-slate-400 dark:text-muted-foreground">
                  <FiSearch size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.quickSearch}</h3>
              </div>
              <div className="relative group">
                <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={t.clients.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40"
                />
              </div>
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2 mb-8">
                {editingClient ? (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FiEdit3 size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FiUserPlus size={20} />
                  </div>
                )}
                <h2 className="text-lg font-black text-slate-900 dark:text-foreground tracking-tight italic">
                  {editingClient ? t.clients.editClient : t.clients.newClient}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.clients.form.fullName}</label>
                  <div className="relative group">
                    <FiUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="nom"
                      placeholder={t.clients.form.fullNamePlaceholder}
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.clients.form.phone}</label>
                  <div className="relative group">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="tel"
                      type="tel"
                      placeholder={t.clients.form.phonePlaceholder}
                      value={formData.tel}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.clients.form.nif}</label>
                  <div className="relative group">
                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      name="nif"
                      placeholder={t.clients.form.nifPlaceholder}
                      value={formData.nif}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-2xl font-black text-xs tracking-[0.15em] uppercase transition-all shadow-xl ${isSubmitting
                      ? "bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-white shadow-primary/20"}`}
                  >
                    {isSubmitting
                      ? t.common.processing
                      : editingClient ? t.clients.form.update : t.clients.form.register}
                  </motion.button>

                  {editingClient && (
                    <button
                      onClick={resetForm}
                      className="w-full py-3 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-foreground transition-colors"
                    >
                      {t.clients.form.cancelEdit}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Table */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-50/50 dark:bg-secondary/30 border-b border-slate-100 dark:border-border flex items-center justify-between">
                <h2 className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                  <FiUsers /> {t.clients.table.title}
                </h2>
                <span className="px-4 py-1.5 bg-white dark:bg-card rounded-full text-[10px] font-black text-slate-400 dark:text-muted-foreground shadow-sm border border-slate-100 dark:border-border italic">
                  {t.clients.partnerCount.replace('{count}', String(filteredClients.length))}
                </span>
              </div>

              {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <Loader />
                  <p className="text-slate-400 dark:text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">{t.clients.loadingData}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-border">
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.table.clientIdentity}</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.table.contactInfo}</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.table.balance}</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.table.nifStatus}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.clients.table.actions}</th>
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="divide-y divide-slate-50 dark:divide-border"
                    >
                      <AnimatePresence mode="popLayout">
                        {currentClients.length > 0 ? (
                          currentClients.map((client) => (
                            <motion.tr
                              key={client.id}
                              variants={itemVariants}
                              layout
                              className="group hover:bg-slate-50 dark:hover:bg-secondary/40 transition-all"
                            >
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-[1.1rem] bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-100/50 dark:border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                    {client.nom.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{client.nom}</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <FiMail size={10} /> {t.clients.directClient}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-8 py-6 whitespace-nowrap text-center">
                                <span className="text-xs font-black text-slate-600 dark:text-foreground/80 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-secondary py-1.5 px-3 rounded-xl mx-auto w-fit italic">
                                  <FiPhone className="text-primary" size={12} /> {client.tel}
                                </span>
                              </td>

                              <td className="px-8 py-6 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border ${
                                  (client.solde ?? 0) >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
                                }`}>
                                  {(client.solde ?? 0) >= 0
                                    ? t.clients.prepaid.replace('{amount}', (client.solde ?? 0).toFixed(0))
                                    : t.clients.debt.replace('{amount}', (client.solde ?? 0).toFixed(0))
                                  }
                                </span>
                              </td>

                              <td className="px-8 py-6 whitespace-nowrap text-center">
                                {client.nif ? (
                                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                    <FiCreditCard size={10} /> {client.nif}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-300 dark:text-muted-foreground/40 uppercase tracking-widest italic">{t.clients.nifNotSet}</span>
                                )}
                              </td>

                              <td className="px-8 py-6 whitespace-nowrap text-left">
                                <div className="flex justify-start gap-2 -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleVersement(client)}
                                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-50 dark:border-emerald-500/20"
                                    title={t.clients.tooltips.registerPayment}
                                  >
                                    <FiDollarSign size={16} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => startEditing(client)}
                                    className="p-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/5 dark:border-primary/20"
                                    title={t.clients.tooltips.editFile}
                                  >
                                    <FiEdit3 size={16} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(client.id)}
                                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-50 dark:border-rose-500/20"
                                    title={t.clients.tooltips.delete}
                                  >
                                    <FiTrash2 size={16} />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <motion.tr variants={itemVariants}>
                            <td colSpan={5} className="px-8 py-32 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-200 dark:text-muted-foreground/30 border border-slate-100 dark:border-border">
                                  <FiUsers size={32} />
                                </div>
                                <div>
                                  <h3 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight italic">{t.clients.noClients}</h3>
                                  <p className="text-slate-400 dark:text-muted-foreground text-sm font-medium mt-1">{t.clients.noClientsDesc}</p>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </motion.tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-secondary/30 border-t border-slate-100 dark:border-border flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.2em]">
                    {t.clients.pagination
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <motion.button
                        key={page}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white dark:bg-card border border-slate-100 dark:border-border text-slate-400 dark:text-muted-foreground hover:border-primary/30 hover:text-slate-600 dark:hover:text-foreground'
                        }`}
                      >
                        {page.toString().padStart(2, '0')}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
