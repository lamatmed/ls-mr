/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import SalesHistory from "../components/SelesHostory";
import { addMultipleSales, getAllClients, getAllProducts, getSalesHistory, getCompany, addVersement } from "../utlis/actions";
import { useRouter } from "next/navigation";
import { ArabicFont } from "../utlis/fonts";
import { getCircularLogo } from "../utlis/pdfLogo";
import {
  FiShoppingBag,
  FiUser,
  FiSearch,
  FiTrash2,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBox,
  FiZap,
  FiPlus,
  FiActivity,
  FiXCircle,
  FiDollarSign
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";

interface Product {
  id: string;
  code: number;
  name: string;
  quantity: number;
  price_v: number;
  price_a: number;
  codeBar?: string | null;
}

interface Sale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  purchasePrice: number;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

type Client = {
  id: string;
  nom: string;
  tel: string;
  nif: string | null;
  solde: number;
};

interface User {
  nom: string;
  admin: boolean;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<"CASH" | "DEBT">("CASH");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; address: string; contact: string; nif?: string | null; currency?: string; logo?: string | null } | null>(null);

  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, currency } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setUser(await response.json());
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
    async function init() {
      try {
        const [clientsRes, productsRes, salesRes, companyRes] = await Promise.all([
          getAllClients(),
          getAllProducts(),
          getSalesHistory(),
          getCompany()
        ]);
        if (clientsRes.success) setClients(clientsRes.clients);
        setProducts(productsRes);
        setSalesHistory(salesRes.map((s: any) => ({ ...s, productName: s.productName ?? t.sales.unknownProduct })));
        setCompanyInfo(companyRes as any);
      } catch {
        // silent
      }
    }
    init();
  }, [t.sales.unknownProduct]);

  const filteredProduct = products.find(
    (p) => p.codeBar === searchTerm.trim() || p.code === Number(searchTerm.trim())
  );

  useEffect(() => {
    if (filteredProduct) {
      setCustomPrice(filteredProduct.price_v);
    } else {
      setCustomPrice("");
    }
  }, [filteredProduct]);

  const addToCart = () => {
    if (!filteredProduct) { toast.error(t.sales.errors.selectProduct); return; }
    const qte = Number(quantity);
    if (qte <= 0) { toast.error(t.sales.errors.invalidQuantity); return; }
    if (filteredProduct.quantity < qte) { toast.error(t.sales.errors.insufficientStock); return; }
    const price = Number(customPrice);
    if (isNaN(price) || price <= 0) { toast.error(t.sales.errors.invalidPrice); return; }
    if (price <= filteredProduct.price_a) {
      toast.error(t.sales.errors.priceTooLow.replace('{purchase_price}', String(filteredProduct.price_a)));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === filteredProduct.id && item.unitPrice === price);
      if (existing) {
        return prev.map((item) =>
          (item.productId === filteredProduct.id && item.unitPrice === price)
            ? { ...item, quantity: item.quantity + qte, totalPrice: (item.quantity + qte) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: filteredProduct.id,
        productName: filteredProduct.name,
        quantity: qte,
        unitPrice: price,
        totalPrice: price * qte,
      }];
    });

    setQuantity(1);
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.info(t.sales.itemRemoved);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    toast.info(t.sales.cartReset);
  };

  const handleSale = async () => {
    if (cart.length === 0) { toast.error(t.sales.cartEmptyError); return; }

    const confirm = await Swal.fire({
      title: t.sales.confirmTransactionTitle,
      text: t.sales.confirmTransactionDesc,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.sales.confirmSale,
      cancelButtonText: t.common.cancel,
      confirmButtonColor: "#10b981",
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (confirm.isConfirmed) {
      if (saleType === "DEBT") {
        if (!selectedClient) { toast.error(t.sales.customerRequiredDebt); return; }
        if (!selectedClient.tel) { toast.error(t.sales.customerPhoneRequired); return; }
      }

      setLoading(true);
      try {
        const result = await addMultipleSales(
          cart.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })),
          saleType,
          selectedClient?.id
        );
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(t.sales.saleSuccess);
          generateInvoice();
          setCart([]);
          const [productList, sales] = await Promise.all([getAllProducts(), getSalesHistory()]);
          setProducts(productList);
          setSalesHistory(sales.map((s: any) => ({ ...s, productName: s.productName ?? t.sales.unknownProduct })));
        }
      } catch {
        toast.error(t.sales.serverError);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVersement = async () => {
    if (!selectedClient) return;

    const { value: amount } = await Swal.fire({
      title: t.sales.paymentDialog.title,
      text: t.sales.paymentDialog.customer.replace('{name}', selectedClient.nom),
      input: 'number',
      inputPlaceholder: t.sales.paymentDialog.amountPlaceholder,
      showCancelButton: true,
      confirmButtonText: t.common.confirm,
      cancelButtonText: t.common.cancel,
      confirmButtonColor: '#10b981',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return t.sales.paymentDialog.invalidAmount;
      },
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (amount) {
      try {
        const res = await addVersement(selectedClient.id, Number(amount));
        if (res.success) {
          toast.success(t.sales.paymentSuccess);
          const clientsRes = await getAllClients();
          if (clientsRes.success) {
            setClients(clientsRes.clients);
            setSelectedClient(clientsRes.clients.find((c: Client) => c.id === selectedClient.id) || null);
          }
        } else {
          toast.error((res as any).error || t.sales.paymentError);
        }
      } catch {
        toast.error(t.sales.serverError);
      }
    }
  };

  const generateInvoice = async () => {
    if (cart.length === 0) { toast.error(t.sales.cartEmptyError); return; }

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 150] });
      doc.addFileToVFS("Amiri.ttf", ArabicFont);
      doc.addFont("Amiri.ttf", "Amiri", "normal", "Identity-H");
      doc.addFont("Amiri.ttf", "Amiri", "bold", "Identity-H");
      doc.setFont("Amiri", "normal");

      const now = new Date();
      const invoiceId = `TKT-${now.getTime().toString().slice(-6)}`;
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(0);

      // Company header with adaptive Y
      const logoData = await getCircularLogo(companyInfo?.logo);
      let y = 8;
      if (logoData) {
        try { doc.addImage(logoData, 'PNG', 32, 2, 16, 16); y = 24; } catch { /* invalid */ }
      }
      doc.setFontSize(18);
      doc.text(companyInfo?.name || "", 40, y, { align: "center" });
      y += 7;
      doc.setFontSize(12);
      if (companyInfo?.address) { doc.text(companyInfo.address, 40, y, { align: "center" }); y += 6; }
      if (companyInfo?.contact) { doc.text(companyInfo.contact, 40, y, { align: "center" }); y += 6; }
      if (companyInfo?.nif) { doc.text(`NIF: ${companyInfo.nif}`, 40, y, { align: "center" }); y += 6; }
      doc.setLineWidth(0.3);
      doc.line(5, y, 75, y);
      y += 4;

      doc.setFontSize(12);
      doc.text(t.sales.invoice.ticketNumber.replace('{id}', invoiceId), 5, y + 4, { align: "left" });
      doc.text(t.sales.invoice.dateTime.replace('{date}', formattedDate).replace('{time}', formattedTime), 5, y + 10, { align: "left" });
      doc.text(t.sales.invoice.seller.replace('{name}', user?.nom || ""), 5, y + 16, { align: "left" });

      if (saleType === "DEBT") {
        doc.setFontSize(14);
        doc.setTextColor(255, 0, 0);
        doc.text(t.sales.invoice.debtSale, 75, y + 4, { align: "right" });
        doc.setTextColor(0, 0, 0);
      }

      let tableStartY = y + 22;
      if (selectedClient) {
        doc.setFontSize(12);
        doc.text(t.sales.invoice.customer.replace('{name}', selectedClient.nom.substring(0, 20)), 5, y + 22, { align: "left" });
        doc.text(t.sales.invoice.phone.replace('{phone}', selectedClient.tel), 5, y + 28, { align: "left" });
        doc.line(5, y + 30, 75, y + 30);
        tableStartY = y + 34;
      }

      autoTable(doc, {
        startY: tableStartY,
        margin: { left: 2, right: 2 },
        head: [[t.sales.invoice.products, t.sales.invoice.qty, t.sales.invoice.unitPrice, t.sales.invoice.total]],
        body: cart.map(item => [
          item.productName.substring(0, 18),
          item.quantity,
          item.unitPrice.toFixed(0),
          item.totalPrice.toFixed(0)
        ]),
        styles: { fontSize: 10, cellPadding: 2, halign: 'left', font: 'Amiri', fontStyle: 'normal' },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], font: 'Amiri', fontStyle: 'normal' },
        bodyStyles: { font: 'Amiri', fontStyle: 'normal' },
        columnStyles: { 0: { cellWidth: 35, halign: 'left' }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        didParseCell: (data) => {
          data.cell.styles.font = 'Amiri';
          data.cell.styles.fontStyle = 'normal';
          if (data.section === 'head') {
            data.cell.styles.fillColor = [0, 0, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(14);
      doc.text(t.sales.invoice.grandTotal.replace('{amount}', totalAmount).replace('{currency}', companyInfo?.currency || currency), 40, finalY + 5, { align: "center" });

      if (selectedClient) {
        doc.setFontSize(11);
        doc.setTextColor(selectedClient.solde < 0 ? 255 : 0, 0, 0);
        const newSolde = saleType === "DEBT" ? selectedClient.solde - Number(totalAmount) : selectedClient.solde;
        doc.text(t.sales.invoice.newBalance.replace('{balance}', newSolde.toFixed(0)).replace('{currency}', companyInfo?.currency || currency), 40, finalY + 11, { align: "center" });
        doc.setTextColor(0, 0, 0);
      }

      doc.setFontSize(10);
      doc.text(t.sales.invoice.contact.replace('{contact}', companyInfo?.contact || ""), 40, finalY + 18, { align: "center" });
      doc.text(t.sales.invoice.thankYou, 40, finalY + 24, { align: "center" });
      doc.text(t.sales.invoice.alwaysAtService, 40, finalY + 30, { align: "center" });

      doc.save(`TICKET_${invoiceId}.pdf`);
    } catch {
      toast.error(t.sales.serverError);
    }
  };

  if (pageLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
    </div>
  );

  return (
    <div className="relative min-h-screen p-6 md:p-12 bg-[#fafafa] dark:bg-background overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 35, repeat: Infinity }}
          className="absolute -top-[10%] -right-[5%] w-1/2 h-1/2 bg-primary/5 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute bottom-[-10%] -left-[10%] w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FiZap size={24} />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{t.sales.badge}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-foreground tracking-tight italic">
              {t.sales.titlePrefix} <span className="text-primary italic">{t.sales.titleHighlight}</span>
            </h1>
            {user && (
              <div className="flex items-center gap-2 mt-4 bg-white/50 dark:bg-card/50 w-fit px-4 py-2 rounded-2xl border border-white dark:border-white/5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.sales.activeAccountant}</span>
                <span className="text-xs font-black text-slate-900 dark:text-foreground uppercase italic underline decoration-primary/30 decoration-2 underline-offset-4">{user.nom}</span>
              </div>
            )}
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-3 max-w-lg">{t.sales.subtitle}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 dark:bg-primary/10 text-primary flex items-center justify-center">
                <FiShoppingBag size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.sales.itemsInCart}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-foreground">{cart.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Input form */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="space-y-6">
                {/* Sale Type Toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.sales.saleMethod}</label>
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-secondary rounded-2xl">
                    <button
                      onClick={() => setSaleType("CASH")}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${saleType === "CASH" ? "bg-white dark:bg-card text-primary shadow-sm" : "text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground"}`}
                    >
                      {t.sales.cash}
                    </button>
                    <button
                      onClick={() => setSaleType("DEBT")}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${saleType === "DEBT" ? "bg-white dark:bg-card text-rose-500 shadow-sm" : "text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground"}`}
                    >
                      {t.sales.debt}
                    </button>
                  </div>
                </div>

                {/* Client Select */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{t.sales.customerPartner}</label>
                    {selectedClient && saleType === "DEBT" && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleVersement}
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <FiDollarSign size={10} /> {t.sales.payment}
                        </motion.button>
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2 ${
                            (selectedClient.solde ?? 0) >= 0
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${(selectedClient.solde ?? 0) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {(selectedClient.solde ?? 0) >= 0
                            ? t.sales.prepaid.replace('{amount}', (selectedClient.solde ?? 0).toFixed(0))
                            : t.sales.outstandingDebt.replace('{amount}', (selectedClient.solde ?? 0).toFixed(0))
                          }
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <select
                      onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground appearance-none"
                    >
                      <option value="">{t.sales.transientCustomer}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                </div>

                {/* Barcode Search */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.sales.scanBarcode}</label>
                  <div className="relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t.sales.scanPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                {/* Product Preview */}
                <div className={`p-5 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
                  filteredProduct
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-primary/5'
                    : 'bg-slate-50 dark:bg-secondary border-transparent opacity-60'
                }`}>
                  {filteredProduct ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
                          {filteredProduct.code}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-foreground tracking-tight">{filteredProduct.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground flex items-center gap-2 mt-0.5 uppercase tracking-wider">
                            <span className="text-primary font-black">{filteredProduct.quantity} {t.sales.inStock}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-muted-foreground/30"></span>
                            <span>{filteredProduct.price_v} {currency}</span>
                          </p>
                        </div>
                      </div>
                      <FiCheckCircle className="text-emerald-500 text-2xl" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400 dark:text-muted-foreground py-2 italic font-medium">
                      <FiAlertCircle size={20} />
                      <span className="text-xs">{t.sales.selectProduct}</span>
                    </div>
                  )}
                </div>

                {/* Quantity & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.sales.quantity}</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none text-center font-black text-slate-700 dark:text-foreground"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest ml-1">{t.sales.sellingPrice}</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full py-4 bg-slate-50 dark:bg-secondary border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-secondary/70 rounded-2xl outline-none text-center font-black text-slate-700 dark:text-foreground"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addToCart}
                    disabled={!filteredProduct}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl shadow-primary/20 disabled:grayscale transition-all flex items-center justify-center gap-2"
                  >
                    <FiPlus size={20} /> {t.sales.addToCart}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Archive toggle */}
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setShowSalesHistory(!showSalesHistory)}
              className="w-full py-6 bg-slate-900 dark:bg-slate-700 text-slate-100 rounded-[2rem] font-black text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:bg-black dark:hover:bg-slate-600 transition-all group"
            >
              <FiClock className="group-hover:rotate-12 transition-transform" />
              {showSalesHistory ? t.sales.hideLog : t.sales.transactionArchive}
            </motion.button>
          </div>

          {/* Right: Cart */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 dark:bg-card/90 backdrop-blur-3xl rounded-[2.5rem] border border-white dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col min-h-[500px]"
            >
              {/* Cart header */}
              <div className="px-8 py-6 border-b border-slate-50 dark:border-border flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 italic">
                  <FiShoppingBag /> {t.sales.currentCart}
                </h2>
                {cart.length > 0 && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={clearCart}
                    className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-100/50 dark:border-rose-500/20"
                  >
                    <FiTrash2 /> {t.sales.clearAll}
                  </motion.button>
                )}
              </div>

              {/* Cart items */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[400px]">
                <AnimatePresence mode="popLayout">
                  {cart.length > 0 ? (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group bg-slate-50/50 dark:bg-secondary/30 border border-slate-100/50 dark:border-border/50 rounded-3xl p-5 flex items-center justify-between hover:bg-white dark:hover:bg-card hover:shadow-xl transition-all duration-500"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-secondary border border-slate-100 dark:border-border flex items-center justify-center text-primary shadow-sm group-hover:rotate-6 transition-transform">
                              <FiBox size={22} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 dark:text-foreground tracking-tight">{item.productName}</p>
                              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-1">
                                {item.quantity} {t.common.units}
                                <span className="mx-1 opacity-20">|</span>
                                {item.unitPrice} {currency}/{t.common.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-lg font-black text-slate-900 dark:text-foreground tracking-tight italic">
                              {item.totalPrice} <span className="text-[10px] opacity-40 italic">{currency}</span>
                            </span>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                              <FiXCircle size={20} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-200 dark:text-muted-foreground/20 border border-slate-100 dark:border-border mb-6">
                        <FiActivity size={48} />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-foreground tracking-tight italic">{t.sales.emptyCart}</h3>
                      <p className="text-slate-400 dark:text-muted-foreground text-xs font-semibold mt-1">{t.sales.emptyCartDesc}</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart footer */}
              <div className="p-8 border-t border-slate-50 dark:border-border bg-slate-50/20 dark:bg-secondary/10">
                {cart.length > 0 && (
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em]">{t.sales.totalAmountDue}</p>
                      <p className="text-5xl font-black text-primary tracking-tighter italic">
                        {cart.reduce((sum, item) => sum + item.totalPrice, 0)}{' '}
                        <span className="text-xl opacity-30 tracking-normal">{currency}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                        {cart.length} {t.sales.confirmedItems}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSale}
                    disabled={loading || cart.length === 0}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:grayscale border-b-4 border-emerald-700/50"
                  >
                    {loading
                      ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      : <><FiCheckCircle size={20} /> {t.sales.confirmTransaction}</>
                    }
                  </motion.button>
                  <button
                    onClick={generateInvoice}
                    disabled={cart.length === 0}
                    className="w-full py-5 bg-white dark:bg-card text-slate-800 dark:text-foreground border-2 border-slate-100 dark:border-border rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase hover:bg-slate-50 dark:hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <FiFileText size={18} /> {t.sales.printReceipt}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sales History */}
        <AnimatePresence>
          {showSalesHistory && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-12"
            >
              <SalesHistory sales={salesHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
