"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTruck, FiSmartphone, FiLock,
  FiZap, FiLayers, FiCpu, FiCode, FiCheckCircle,
  FiPackage, FiBox, FiPhone, FiMail, FiMapPin,
  FiBarChart2, FiShoppingCart, FiFileText, FiUsers,
  FiAlertTriangle, FiRefreshCw, FiDollarSign, FiList,
  FiCalendar, FiTag, FiUserCheck, FiChevronDown,
  FiBookOpen, FiGrid, FiArrowRight
} from "react-icons/fi";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { Language } from "../context/LanguageContext";
import logo from "../../public/icons/icon-512x512.png";

type GuideModule = {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  path: string;
  description: string;
  steps: string[];
  adminOnly?: boolean;
};

type GuideSection = {
  label: string;
  modules: GuideModule[];
};

type GuideContent = {
  sectionTitle: string;
  sectionSubtitle: string;
  adminBadge: string;
  sections: GuideSection[];
};

const guide: Record<Language, GuideContent> = {
  fr: {
    sectionTitle: "Guide d'utilisation",
    sectionSubtitle: "Découvrez toutes les fonctionnalités de LocalStock et comment les utiliser efficacement.",
    adminBadge: "Admin uniquement",
    sections: [
      {
        label: "Gestion des stocks",
        modules: [
          {
            icon: FiPackage, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Articles", path: "/products",
            description: "Gérez l'ensemble de votre inventaire : consultez, filtrez, modifiez ou supprimez chaque produit.",
            steps: [
              "Filtrez par catégorie ou recherchez par nom / code",
              "Cliquez sur l'icône crayon pour modifier un article",
              "Supprimez un article avec l'icône corbeille",
              "Le bouton « Ajouter » crée un nouvel article",
              "« Facture d'achat » permet d'importer plusieurs articles à la fois",
            ],
          },
          {
            icon: FiGrid, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15",
            title: "Catalogue complet", path: "/list",
            description: "Vue complète du stock avec codes-barres, dates d'expiration et export PDF.",
            steps: [
              "Recherchez par nom, code ou code-barres",
              "Modifiez la date d'expiration directement dans le tableau",
              "Exportez tout le catalogue en PDF via le bouton dédié",
              "Consultez les totaux : articles, stock, valeur d'achat",
            ],
          },
          {
            icon: FiRefreshCw, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/15",
            title: "Mise à jour rapide", path: "/update",
            description: "Réapprovisionnez rapidement un produit existant ou modifiez ses prix.",
            steps: [
              "Recherchez le produit ou scannez son code-barres",
              "Saisissez la quantité à ajouter et les nouveaux prix",
              "Confirmez pour mettre à jour le stock immédiatement",
              "Le bouton « Nouveau produit » redirige vers la création",
            ],
          },
          {
            icon: FiTag, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15",
            title: "Catégories", path: "/categories",
            description: "Organisez vos produits en catégories pour faciliter la navigation.",
            steps: [
              "Créez une catégorie avec un nom unique",
              "Modifiez ou supprimez une catégorie existante",
              "La suppression dissocie les produits (sans les supprimer)",
            ],
          },
          {
            icon: FiTruck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Fournisseurs", path: "/fournisseurs",
            description: "Gérez vos fournisseurs et associez-les à vos produits.",
            steps: [
              "Ajoutez un fournisseur avec son nom et contact",
              "Chaque produit peut être associé à un fournisseur",
              "Modifiez ou supprimez un fournisseur existant",
            ],
          },
          {
            icon: FiAlertTriangle, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Alertes d'expiration", path: "/alerts",
            description: "Identifiez instantanément les produits expirés ou proches de leur date limite.",
            steps: [
              "Les produits déjà expirés apparaissent en rouge",
              "Les produits expirant bientôt sont signalés en orange",
              "Chaque carte affiche la quantité restante et la date exacte",
            ],
          },
        ],
      },
      {
        label: "Ventes & Facturation",
        modules: [
          {
            icon: FiShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15",
            title: "Station de vente", path: "/sales",
            description: "Effectuez des ventes rapides en espèces ou à crédit avec impression de reçu.",
            steps: [
              "Scannez ou saisissez le code-barres pour ajouter au panier",
              "Choisissez le mode : Espèces ou Crédit",
              "Pour le crédit, sélectionnez un client existant",
              "Ajustez la quantité et le prix si nécessaire",
              "Confirmez la transaction et imprimez le reçu",
              "Enregistrez un versement partiel depuis la liste des clients",
            ],
          },
          {
            icon: FiFileText, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/15",
            title: "Factures", path: "/commandes",
            description: "Consultez et gérez toutes les factures émises.",
            steps: [
              "Recherchez par numéro de facture ou nom de client",
              "Réimprimez une facture en PDF avec le bouton dédié",
              "Annulez une facture : les produits sont remis en stock",
              "Les ventes à crédit sont clairement identifiées",
            ],
          },
          {
            icon: FiUserCheck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/15",
            title: "Clients", path: "/clients",
            description: "Gérez votre portefeuille clients avec suivi des soldes et des dettes.",
            steps: [
              "Créez un client avec son nom, téléphone et NIF (optionnel)",
              "Le solde s'affiche en vert (crédit) ou rouge (dette)",
              "Enregistrez un versement directement depuis la liste",
              "Modifiez ou supprimez un dossier client",
            ],
          },
          {
            icon: FiDollarSign, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15",
            title: "Dettes", path: "/dettes",
            description: "Suivez toutes les créances impayées et gérez les remboursements.",
            steps: [
              "Vue globale de toutes les dettes par client",
              "Cliquez sur un client pour voir le détail de ses dettes",
              "Enregistrez un paiement partiel ou total",
              "Les statuts : Non soldé / Partiel / Soldé",
            ],
          },
        ],
      },
      {
        label: "Administration & Rapports",
        modules: [
          {
            icon: FiBarChart2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15",
            title: "Tableau de bord", path: "/dashboard",
            description: "Vue d'ensemble complète : KPIs, graphiques de ventes, profil entreprise et journal.",
            steps: [
              "Consultez les statistiques : stock, ventes, bénéfices, dettes",
              "Analysez le flux de trésorerie via les graphiques mensuels",
              "Configurez le profil entreprise (nom, adresse, logo, devise)",
              "Synchronisez les soldes clients d'un clic",
              "Videz le journal de ventes si nécessaire",
              "Accédez aux commandes rapides : alertes, catalogue, audit",
            ],
            adminOnly: true,
          },
          {
            icon: FiList, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Dépenses", path: "/depenses",
            description: "Enregistrez et suivez toutes vos charges opérationnelles.",
            steps: [
              "Types disponibles : Salaires, Loyer, Autres",
              "Saisissez le montant et une note optionnelle",
              "Historique complet avec date et type de dépense",
              "Supprimez une dépense pour la retrancher des coûts",
            ],
            adminOnly: true,
          },
          {
            icon: FiRefreshCw, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/15",
            title: "Transactions", path: "/transactions",
            description: "Journal complet des mouvements de stock (réapprovisionnements).",
            steps: [
              "Filtrez par date de début et de fin",
              "Chaque ligne affiche le produit, la quantité ajoutée et la date",
              "Supprimez une transaction si nécessaire",
            ],
          },
          {
            icon: FiCalendar, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Audit par période", path: "/periode",
            description: "Générez des rapports PDF détaillés pour n'importe quelle période.",
            steps: [
              "Sélectionnez une date de début et de fin",
              "Générez le rapport en un clic",
              "Le PDF inclut : résumé, top produits, soldes clients",
              "Téléchargement automatique du rapport",
            ],
            adminOnly: true,
          },
          {
            icon: FiUsers, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Utilisateurs", path: "/users",
            description: "Gérez les comptes, les rôles et les accès à l'application.",
            steps: [
              "Créez un compte Vendeur ou Administrateur",
              "Bloquez/Débloquez un utilisateur sans le supprimer",
              "Modifiez le mot de passe ou les droits d'un compte",
              "Les vendeurs accèdent aux ventes uniquement",
              "Les admins ont accès à toutes les fonctionnalités",
            ],
            adminOnly: true,
          },
        ],
      },
    ],
  },
  en: {
    sectionTitle: "User Guide",
    sectionSubtitle: "Discover all LocalStock features and how to use them effectively.",
    adminBadge: "Admin only",
    sections: [
      {
        label: "Inventory Management",
        modules: [
          {
            icon: FiPackage, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Products", path: "/products",
            description: "Manage your entire inventory: browse, filter, edit or delete any product.",
            steps: [
              "Filter by category or search by name / code",
              "Click the pencil icon to edit a product",
              "Delete a product with the trash icon",
              "The \"Add\" button creates a new product",
              "\"Purchase Invoice\" imports multiple products at once",
            ],
          },
          {
            icon: FiGrid, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15",
            title: "Full Catalog", path: "/list",
            description: "Complete stock view with barcodes, expiration dates and PDF export.",
            steps: [
              "Search by name, code or barcode",
              "Edit expiration dates directly in the table",
              "Export the full catalog as PDF",
              "View totals: items, stock, purchase value",
            ],
          },
          {
            icon: FiRefreshCw, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/15",
            title: "Quick Update", path: "/update",
            description: "Quickly restock a product or update its prices.",
            steps: [
              "Search or scan the barcode to select a product",
              "Enter quantity to add and new prices",
              "Confirm to update stock immediately",
            ],
          },
          {
            icon: FiTag, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15",
            title: "Categories", path: "/categories",
            description: "Organize products into categories for easier navigation.",
            steps: [
              "Create a category with a unique name",
              "Edit or delete an existing category",
              "Deletion unlinks products (without deleting them)",
            ],
          },
          {
            icon: FiTruck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Suppliers", path: "/fournisseurs",
            description: "Manage your suppliers and link them to products.",
            steps: [
              "Add a supplier with name and contact",
              "Each product can be linked to a supplier",
              "Edit or delete suppliers",
            ],
          },
          {
            icon: FiAlertTriangle, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Expiry Alerts", path: "/alerts",
            description: "Instantly identify expired or near-expiry products.",
            steps: [
              "Expired products appear in red",
              "Products expiring soon are highlighted in orange",
              "Each card shows remaining quantity and exact date",
            ],
          },
        ],
      },
      {
        label: "Sales & Billing",
        modules: [
          {
            icon: FiShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15",
            title: "Sales Station", path: "/sales",
            description: "Process fast cash or credit sales with receipt printing.",
            steps: [
              "Scan or type barcode to add product to cart",
              "Choose mode: Cash or Credit",
              "For credit, select an existing client",
              "Adjust quantity and price if needed",
              "Confirm and print the receipt",
            ],
          },
          {
            icon: FiFileText, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/15",
            title: "Invoices", path: "/commandes",
            description: "View and manage all issued invoices.",
            steps: [
              "Search by invoice number or client name",
              "Reprint an invoice as PDF",
              "Cancel an invoice: stock is automatically restored",
            ],
          },
          {
            icon: FiUserCheck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/15",
            title: "Clients", path: "/clients",
            description: "Manage your client portfolio with balance and debt tracking.",
            steps: [
              "Create a client with name, phone and NIF (optional)",
              "Balance shown in green (credit) or red (debt)",
              "Record a payment directly from the list",
              "Edit or delete a client file",
            ],
          },
          {
            icon: FiDollarSign, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15",
            title: "Debts", path: "/dettes",
            description: "Track all unpaid receivables and manage repayments.",
            steps: [
              "Overview of all debts by client",
              "Click a client to see debt details",
              "Record partial or full payments",
              "Status: Unpaid / Partial / Settled",
            ],
          },
        ],
      },
      {
        label: "Administration & Reports",
        modules: [
          {
            icon: FiBarChart2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15",
            title: "Dashboard", path: "/dashboard",
            description: "Complete overview: KPIs, sales charts, company profile and logs.",
            steps: [
              "View stats: stock, sales, profits, debts",
              "Analyze cash flow via monthly charts",
              "Configure company profile (name, address, logo, currency)",
              "Sync client balances with one click",
              "Access quick commands: alerts, catalog, audit",
            ],
            adminOnly: true,
          },
          {
            icon: FiList, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Expenses", path: "/depenses",
            description: "Record and track all operational expenses.",
            steps: [
              "Types: Salaries, Rent, Other",
              "Enter amount and an optional note",
              "Full history with date and expense type",
              "Delete an expense to deduct it from costs",
            ],
            adminOnly: true,
          },
          {
            icon: FiRefreshCw, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/15",
            title: "Transactions", path: "/transactions",
            description: "Complete log of stock movements (restocking operations).",
            steps: [
              "Filter by start and end date",
              "Each row shows product, quantity added and date",
              "Delete a transaction if needed",
            ],
          },
          {
            icon: FiCalendar, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Period Audit", path: "/periode",
            description: "Generate detailed PDF reports for any time period.",
            steps: [
              "Select a start and end date",
              "Generate report with one click",
              "PDF includes: summary, top products, client balances",
              "Automatic download",
            ],
            adminOnly: true,
          },
          {
            icon: FiUsers, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Users", path: "/users",
            description: "Manage accounts, roles and application access.",
            steps: [
              "Create Seller or Administrator accounts",
              "Block/Unblock a user without deleting",
              "Edit password or permissions",
              "Sellers access sales only; admins access everything",
            ],
            adminOnly: true,
          },
        ],
      },
    ],
  },
  ar: {
    sectionTitle: "دليل الاستخدام",
    sectionSubtitle: "اكتشف جميع ميزات LocalStock وكيفية استخدامها بفاعلية.",
    adminBadge: "مشرف فقط",
    sections: [
      {
        label: "إدارة المخزون",
        modules: [
          {
            icon: FiPackage, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "المنتجات", path: "/products",
            description: "إدارة المخزون بالكامل: تصفح وتعديل وحذف أي منتج.",
            steps: [
              "تصفية حسب الفئة أو البحث بالاسم أو الكود",
              "انقر على أيقونة القلم لتعديل منتج",
              "احذف منتجاً بأيقونة سلة المهملات",
              "زر «إضافة» لإنشاء منتج جديد",
              "«فاتورة شراء» لاستيراد عدة منتجات دفعة واحدة",
            ],
          },
          {
            icon: FiGrid, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15",
            title: "الكتالوج الكامل", path: "/list",
            description: "عرض شامل للمخزون مع الباركود وتواريخ الانتهاء وتصدير PDF.",
            steps: [
              "البحث بالاسم أو الكود أو الباركود",
              "تعديل تاريخ الانتهاء مباشرة في الجدول",
              "تصدير الكتالوج كاملاً بصيغة PDF",
              "عرض الإجماليات: المنتجات، المخزون، قيمة الشراء",
            ],
          },
          {
            icon: FiRefreshCw, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/15",
            title: "تحديث سريع", path: "/update",
            description: "إعادة تموين منتج أو تحديث أسعاره بسرعة.",
            steps: [
              "ابحث أو امسح الباركود لتحديد المنتج",
              "أدخل الكمية المضافة والأسعار الجديدة",
              "أكد لتحديث المخزون فوراً",
            ],
          },
          {
            icon: FiTag, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15",
            title: "الفئات", path: "/categories",
            description: "تنظيم المنتجات في فئات لسهولة التنقل.",
            steps: [
              "إنشاء فئة باسم فريد",
              "تعديل أو حذف فئة موجودة",
              "الحذف يفصل المنتجات دون إزالتها",
            ],
          },
          {
            icon: FiTruck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "الموردون", path: "/fournisseurs",
            description: "إدارة الموردين وربطهم بالمنتجات.",
            steps: [
              "أضف مورداً باسمه وبيانات الاتصال",
              "يمكن ربط كل منتج بمورد",
              "تعديل أو حذف موردين",
            ],
          },
          {
            icon: FiAlertTriangle, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "تنبيهات انتهاء الصلاحية", path: "/alerts",
            description: "تحديد المنتجات المنتهية أو القريبة من انتهاء صلاحيتها فوراً.",
            steps: [
              "المنتجات المنتهية تظهر باللون الأحمر",
              "المنتجات قريبة الانتهاء باللون البرتقالي",
              "كل بطاقة تعرض الكمية المتبقية والتاريخ الدقيق",
            ],
          },
        ],
      },
      {
        label: "المبيعات والفواتير",
        modules: [
          {
            icon: FiShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15",
            title: "نقطة البيع", path: "/sales",
            description: "إجراء مبيعات نقدية أو بالأجل مع طباعة الفاتورة.",
            steps: [
              "امسح أو أدخل الباركود لإضافة المنتج للسلة",
              "اختر الطريقة: نقداً أو أجلاً",
              "للأجل: حدد عميلاً موجوداً",
              "عدّل الكمية والسعر إذا لزم",
              "أكد المعاملة واطبع الفاتورة",
            ],
          },
          {
            icon: FiFileText, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/15",
            title: "الفواتير", path: "/commandes",
            description: "عرض وإدارة جميع الفواتير الصادرة.",
            steps: [
              "البحث برقم الفاتورة أو اسم العميل",
              "إعادة طباعة الفاتورة بصيغة PDF",
              "إلغاء فاتورة: تُعاد الكميات للمخزون تلقائياً",
            ],
          },
          {
            icon: FiUserCheck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/15",
            title: "العملاء", path: "/clients",
            description: "إدارة قاعدة العملاء مع تتبع الأرصدة والديون.",
            steps: [
              "أنشئ عميلاً بالاسم والهاتف والرقم الضريبي (اختياري)",
              "الرصيد يظهر بالأخضر (رصيد) أو الأحمر (دين)",
              "سجّل دفعة مباشرة من القائمة",
              "تعديل أو حذف ملف عميل",
            ],
          },
          {
            icon: FiDollarSign, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15",
            title: "الديون", path: "/dettes",
            description: "تتبع جميع المستحقات غير المسددة وإدارة المدفوعات.",
            steps: [
              "نظرة عامة على الديون حسب العميل",
              "انقر على عميل لرؤية تفاصيل ديونه",
              "سجّل مدفوعات جزئية أو كاملة",
              "الحالات: غير مسدد / جزئي / مسدد",
            ],
          },
        ],
      },
      {
        label: "الإدارة والتقارير",
        modules: [
          {
            icon: FiBarChart2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15",
            title: "لوحة التحكم", path: "/dashboard",
            description: "نظرة شاملة: مؤشرات الأداء، رسوم المبيعات، ملف الشركة والسجل.",
            steps: [
              "عرض الإحصاءات: المخزون، المبيعات، الأرباح، الديون",
              "تحليل التدفق النقدي عبر الرسوم الشهرية",
              "تكوين ملف الشركة (اسم، عنوان، شعار، عملة)",
              "مزامنة أرصدة العملاء بنقرة واحدة",
            ],
            adminOnly: true,
          },
          {
            icon: FiList, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "المصاريف", path: "/depenses",
            description: "تسجيل ومتابعة جميع النفقات التشغيلية.",
            steps: [
              "الأنواع: رواتب، إيجار، أخرى",
              "أدخل المبلغ وملاحظة اختيارية",
              "سجل كامل بالتاريخ ونوع المصروف",
            ],
            adminOnly: true,
          },
          {
            icon: FiRefreshCw, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/15",
            title: "المعاملات", path: "/transactions",
            description: "سجل كامل لحركات المخزون (عمليات التموين).",
            steps: [
              "تصفية بتاريخ البداية والنهاية",
              "كل صف يعرض المنتج والكمية والتاريخ",
              "حذف معاملة عند الحاجة",
            ],
          },
          {
            icon: FiCalendar, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "تقرير الفترة", path: "/periode",
            description: "إنشاء تقارير PDF مفصلة لأي فترة زمنية.",
            steps: [
              "حدد تاريخ البداية والنهاية",
              "أنشئ التقرير بنقرة واحدة",
              "يتضمن PDF: الملخص، أفضل المنتجات، أرصدة العملاء",
            ],
            adminOnly: true,
          },
          {
            icon: FiUsers, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "المستخدمون", path: "/users",
            description: "إدارة الحسابات والأدوار والصلاحيات.",
            steps: [
              "إنشاء حسابات بائع أو مشرف",
              "حظر/رفع الحظر عن مستخدم دون حذفه",
              "تعديل كلمة المرور أو الصلاحيات",
              "البائعون يصلون للمبيعات فقط؛ المشرفون لكل شيء",
            ],
            adminOnly: true,
          },
        ],
      },
    ],
  },
  pt: {
    sectionTitle: "Guia de Uso",
    sectionSubtitle: "Descubra todas as funcionalidades do LocalStock e como usá-las eficientemente.",
    adminBadge: "Apenas admin",
    sections: [
      {
        label: "Gestão de Estoque",
        modules: [
          {
            icon: FiPackage, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Produtos", path: "/products",
            description: "Gerencie todo o inventário: visualize, filtre, edite ou exclua produtos.",
            steps: [
              "Filtre por categoria ou pesquise por nome/código",
              "Clique no ícone de lápis para editar um produto",
              "Exclua com o ícone de lixeira",
              "\"Adicionar\" cria um novo produto",
              "\"Fatura de compra\" importa vários produtos de uma vez",
            ],
          },
          {
            icon: FiGrid, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15",
            title: "Catálogo Completo", path: "/list",
            description: "Visão completa do estoque com códigos de barras, datas de validade e exportação PDF.",
            steps: [
              "Pesquise por nome, código ou código de barras",
              "Edite datas de validade diretamente na tabela",
              "Exporte o catálogo completo como PDF",
            ],
          },
          {
            icon: FiRefreshCw, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/15",
            title: "Atualização Rápida", path: "/update",
            description: "Reabastecimento rápido de produto ou atualização de preços.",
            steps: [
              "Pesquise ou leia o código de barras",
              "Insira quantidade a adicionar e novos preços",
              "Confirme para atualizar o estoque imediatamente",
            ],
          },
          {
            icon: FiTag, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15",
            title: "Categorias", path: "/categories",
            description: "Organize produtos em categorias.",
            steps: [
              "Crie uma categoria com nome único",
              "Edite ou exclua categorias existentes",
            ],
          },
          {
            icon: FiTruck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Fornecedores", path: "/fournisseurs",
            description: "Gerencie fornecedores e associe-os a produtos.",
            steps: [
              "Adicione fornecedor com nome e contato",
              "Associe produtos a fornecedores",
            ],
          },
          {
            icon: FiAlertTriangle, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Alertas de Validade", path: "/alerts",
            description: "Identifique produtos vencidos ou próximos do vencimento.",
            steps: [
              "Produtos vencidos em vermelho",
              "Próximos do vencimento em laranja",
            ],
          },
        ],
      },
      {
        label: "Vendas & Faturamento",
        modules: [
          {
            icon: FiShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15",
            title: "Estação de Vendas", path: "/sales",
            description: "Processe vendas à vista ou a crédito com impressão de recibo.",
            steps: [
              "Leia ou digite o código de barras para adicionar ao carrinho",
              "Escolha o modo: À vista ou Crédito",
              "Para crédito, selecione um cliente existente",
              "Confirme e imprima o recibo",
            ],
          },
          {
            icon: FiFileText, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/15",
            title: "Faturas", path: "/commandes",
            description: "Visualize e gerencie todas as faturas emitidas.",
            steps: [
              "Pesquise por número da fatura ou nome do cliente",
              "Reimprima uma fatura como PDF",
              "Cancele uma fatura: o estoque é restaurado automaticamente",
            ],
          },
          {
            icon: FiUserCheck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/15",
            title: "Clientes", path: "/clients",
            description: "Gerencie clientes com rastreamento de saldo e dívidas.",
            steps: [
              "Crie cliente com nome, telefone e NIF",
              "Saldo em verde (crédito) ou vermelho (dívida)",
              "Registre pagamentos diretamente da lista",
            ],
          },
          {
            icon: FiDollarSign, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15",
            title: "Dívidas", path: "/dettes",
            description: "Acompanhe todas as dívidas e gerencie pagamentos.",
            steps: [
              "Visão geral de dívidas por cliente",
              "Registre pagamentos parciais ou totais",
              "Status: Não pago / Parcial / Liquidado",
            ],
          },
        ],
      },
      {
        label: "Administração & Relatórios",
        modules: [
          {
            icon: FiBarChart2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15",
            title: "Painel", path: "/dashboard",
            description: "Visão geral completa: KPIs, gráficos de vendas e perfil da empresa.",
            steps: [
              "Veja estatísticas: estoque, vendas, lucros, dívidas",
              "Configure perfil da empresa (nome, endereço, logo, moeda)",
              "Sincronize saldos de clientes com um clique",
            ],
            adminOnly: true,
          },
          {
            icon: FiList, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Despesas", path: "/depenses",
            description: "Registre e acompanhe todas as despesas operacionais.",
            steps: [
              "Tipos: Salários, Aluguel, Outros",
              "Histórico completo com data e tipo",
            ],
            adminOnly: true,
          },
          {
            icon: FiRefreshCw, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/15",
            title: "Transações", path: "/transactions",
            description: "Registro completo de movimentos de estoque.",
            steps: [
              "Filtre por data de início e fim",
              "Cada linha mostra produto, quantidade e data",
            ],
          },
          {
            icon: FiCalendar, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Auditoria por Período", path: "/periode",
            description: "Gere relatórios PDF detalhados para qualquer período.",
            steps: [
              "Selecione data de início e fim",
              "PDF inclui: resumo, top produtos, saldos de clientes",
            ],
            adminOnly: true,
          },
          {
            icon: FiUsers, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Usuários", path: "/users",
            description: "Gerencie contas, funções e acessos.",
            steps: [
              "Crie contas Vendedor ou Administrador",
              "Bloqueie/Desbloqueie sem excluir",
              "Vendedores acessam só vendas; admins acessam tudo",
            ],
            adminOnly: true,
          },
        ],
      },
    ],
  },
  es: {
    sectionTitle: "Guía de Uso",
    sectionSubtitle: "Descubre todas las funcionalidades de LocalStock y cómo usarlas eficientemente.",
    adminBadge: "Solo admin",
    sections: [
      {
        label: "Gestión de Inventario",
        modules: [
          {
            icon: FiPackage, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Productos", path: "/products",
            description: "Gestiona todo tu inventario: navega, filtra, edita o elimina productos.",
            steps: [
              "Filtra por categoría o busca por nombre/código",
              "Haz clic en el lápiz para editar un producto",
              "Elimina con el icono de papelera",
              "\"Agregar\" crea un nuevo producto",
            ],
          },
          {
            icon: FiGrid, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15",
            title: "Catálogo Completo", path: "/list",
            description: "Vista completa del stock con códigos de barras y exportación PDF.",
            steps: [
              "Busca por nombre, código o código de barras",
              "Edita fechas de vencimiento en la tabla",
              "Exporta el catálogo como PDF",
            ],
          },
          {
            icon: FiRefreshCw, color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/15",
            title: "Actualización Rápida", path: "/update",
            description: "Reabastece un producto o actualiza sus precios rápidamente.",
            steps: [
              "Busca o escanea el código de barras",
              "Ingresa cantidad y nuevos precios",
              "Confirma para actualizar el stock",
            ],
          },
          {
            icon: FiTag, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15",
            title: "Categorías", path: "/categories",
            description: "Organiza productos en categorías.",
            steps: ["Crea categorías con nombre único", "Edita o elimina categorías"],
          },
          {
            icon: FiTruck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Proveedores", path: "/fournisseurs",
            description: "Gestiona proveedores y asócialos a productos.",
            steps: ["Agrega proveedor con nombre y contacto", "Asocia productos a proveedores"],
          },
          {
            icon: FiAlertTriangle, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Alertas de Vencimiento", path: "/alerts",
            description: "Identifica productos vencidos o próximos a vencer.",
            steps: ["Vencidos en rojo", "Por vencer en naranja"],
          },
        ],
      },
      {
        label: "Ventas & Facturación",
        modules: [
          {
            icon: FiShoppingCart, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/15",
            title: "Punto de Venta", path: "/sales",
            description: "Procesa ventas en efectivo o crédito con impresión de recibo.",
            steps: [
              "Escanea o escribe el código para agregar al carrito",
              "Elige modo: Efectivo o Crédito",
              "Para crédito, selecciona un cliente",
              "Confirma e imprime el recibo",
            ],
          },
          {
            icon: FiFileText, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/15",
            title: "Facturas", path: "/commandes",
            description: "Consulta y gestiona todas las facturas emitidas.",
            steps: [
              "Busca por número de factura o cliente",
              "Reimprime como PDF",
              "Cancela: el stock se restaura automáticamente",
            ],
          },
          {
            icon: FiUserCheck, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/15",
            title: "Clientes", path: "/clients",
            description: "Gestiona clientes con seguimiento de saldo y deudas.",
            steps: [
              "Crea cliente con nombre, teléfono y NIF",
              "Saldo en verde (crédito) o rojo (deuda)",
              "Registra pagos desde la lista",
            ],
          },
          {
            icon: FiDollarSign, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/15",
            title: "Deudas", path: "/dettes",
            description: "Seguimiento de todas las cuentas por cobrar.",
            steps: [
              "Vista general de deudas por cliente",
              "Registra pagos parciales o totales",
            ],
          },
        ],
      },
      {
        label: "Administración & Reportes",
        modules: [
          {
            icon: FiBarChart2, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/15",
            title: "Panel de Control", path: "/dashboard",
            description: "Vista completa: KPIs, gráficos de ventas y perfil de empresa.",
            steps: [
              "Estadísticas: stock, ventas, ganancias, deudas",
              "Configura perfil de empresa (nombre, logo, divisa)",
              "Sincroniza saldos de clientes",
            ],
            adminOnly: true,
          },
          {
            icon: FiList, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/15",
            title: "Gastos", path: "/depenses",
            description: "Registra y realiza seguimiento de gastos operativos.",
            steps: ["Tipos: Salarios, Alquiler, Otros", "Historial con fecha y tipo"],
            adminOnly: true,
          },
          {
            icon: FiRefreshCw, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/15",
            title: "Transacciones", path: "/transactions",
            description: "Registro completo de movimientos de stock.",
            steps: ["Filtra por fecha", "Cada fila muestra producto, cantidad y fecha"],
          },
          {
            icon: FiCalendar, color: "text-indigo-500 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/15",
            title: "Auditoría por Período", path: "/periode",
            description: "Genera informes PDF detallados para cualquier período.",
            steps: ["Selecciona fechas de inicio y fin", "El PDF incluye resumen y top productos"],
            adminOnly: true,
          },
          {
            icon: FiUsers, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15",
            title: "Usuarios", path: "/users",
            description: "Gestiona cuentas, roles y accesos.",
            steps: [
              "Crea cuentas Vendedor o Administrador",
              "Bloquea/Desbloquea sin eliminar",
            ],
            adminOnly: true,
          },
        ],
      },
    ],
  },
};

export default function About() {
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const { t, lang } = useLanguage();
  const a = t.about;
  const g = guide[lang] ?? guide.fr;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: FiPackage,    text: a.features.pharmaceutical, color: "text-indigo-500 dark:text-indigo-400",  bg: "bg-indigo-50 dark:bg-indigo-500/15" },
    { icon: FiTruck,      text: a.features.logistics,       color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
    { icon: FiSmartphone, text: a.features.multichannel,    color: "text-blue-500 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-500/15" },
    { icon: FiLock,       text: a.features.encryption,      color: "text-rose-500 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/15" },
  ];

  const technologies = [
    { name: a.framework, val: "Next.js 15 Edge",      icon: FiZap },
    { name: a.dataLayer, val: "Prisma & PostgreSQL",  icon: FiLayers },
    { name: a.engine,    val: "Node.js Runtime",      icon: FiCpu },
    { name: a.design,    val: "Tailwind Adaptive UI", icon: FiCode },
  ];

  const stats = [
    { val: "99.9%", label: a.statsUptime, color: "text-emerald-500 dark:text-emerald-400" },
    { val: "<50ms", label: a.statsSpeed,  color: "text-indigo-500 dark:text-indigo-400" },
    { val: "∞",     label: a.statsUsers,  color: "text-violet-500 dark:text-violet-400" },
  ];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-background">
      <Loader />
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-muted-foreground animate-pulse">{a.loading}</p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-background overflow-hidden selection:bg-indigo-500 selection:text-white">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 50, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -right-[5%] w-[700px] h-[700px] bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[0%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/8 dark:bg-emerald-500/8 rounded-full blur-[110px]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 relative z-10">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 md:mb-28"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-[2.5rem] blur-[30px] scale-110" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] overflow-hidden border-4 border-white dark:border-white/10 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                <Image src={logo} alt="LocalStock" fill className="object-cover" />
              </div>
            </motion.div>
          </div>

          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{a.badge}</span>
            <span className="w-px h-3 bg-indigo-200 dark:bg-indigo-500/30" />
            <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">{a.version}</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter italic leading-none mb-4">
            <span className="text-slate-900 dark:text-foreground">{a.titlePrefix} </span>
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">{a.titleHighlight}</span>
          </h1>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            <span className="text-[11px] font-black text-slate-400 dark:text-muted-foreground/60 uppercase tracking-[0.5em]">local</span>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent uppercase tracking-tight">STOCK</span>
          </div>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-500 dark:text-muted-foreground font-medium leading-relaxed">
            {a.subtitle}
          </p>
        </motion.div>

        {/* ── STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 md:gap-6 mb-16"
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem] border border-white dark:border-border p-6 md:p-8 text-center shadow-sm">
              <p className={`text-3xl md:text-4xl font-black italic ${s.color} mb-1`}>{s.val}</p>
              <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Vision card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="lg:col-span-7 bg-white/80 dark:bg-card/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-white dark:border-border shadow-sm relative overflow-hidden"
          >
            <FiBox size={220} className="absolute -bottom-10 -right-10 text-slate-100 dark:text-white/[0.03] pointer-events-none" />

            <h2 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight italic mb-6 flex items-center gap-4">
              <span className="w-10 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex-shrink-0" />
              {a.vision}
            </h2>
            <p className="text-slate-600 dark:text-muted-foreground text-base md:text-lg leading-relaxed font-medium mb-10">
              {a.visionText}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-4 p-5 bg-slate-50/80 dark:bg-secondary/50 rounded-[1.5rem] border border-white dark:border-border hover:shadow-md dark:hover:shadow-slate-900/30 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <f.icon size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-foreground italic">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tech stack card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/40 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[length:22px_22px] rounded-[3rem]" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full gap-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
                <FiCpu size={11} className="text-indigo-400" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{a.techIdentity}</span>
              </div>

              <div className="space-y-6 flex-1">
                {technologies.map((tech, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/35">{tech.name}</span>
                      <tech.icon size={13} className="text-indigo-400/40 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-base font-black text-white italic">{tech.val}</p>
                    <div className="mt-2 h-px bg-white/5" />
                  </div>
                ))}
              </div>

              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle size={16} className="text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-snug">{a.highAvailability}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── USER GUIDE ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-16"
        >
          {/* Guide header */}
          <div className="flex items-center gap-4 mb-4">
            <span className="w-10 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em]">{g.sectionTitle}</span>
          </div>
          <p className="text-slate-500 dark:text-muted-foreground font-medium mb-10 max-w-2xl">
            {g.sectionSubtitle}
          </p>

          {/* Accordion sections */}
          <div className="space-y-4">
            {g.sections.map((section, si) => (
              <motion.div
                key={si}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + si * 0.08 }}
                className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2rem] border border-white dark:border-border shadow-sm overflow-hidden"
              >
                {/* Section toggle */}
                <button
                  onClick={() => setOpenSection(openSection === si ? null : si)}
                  className="w-full flex items-center justify-between px-8 py-6 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <FiBookOpen size={18} />
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-foreground tracking-tight italic">
                      {section.label}
                    </span>
                    <span className="hidden sm:inline-flex px-3 py-1 bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground rounded-full text-[10px] font-black uppercase tracking-widest">
                      {section.modules.length} modules
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openSection === si ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-secondary flex items-center justify-center flex-shrink-0"
                  >
                    <FiChevronDown size={16} className="text-slate-400 dark:text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Modules grid */}
                <AnimatePresence>
                  {openSection === si && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {section.modules.map((mod, mi) => (
                          <motion.div
                            key={mi}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mi * 0.04 }}
                            className="relative p-6 bg-slate-50/80 dark:bg-secondary/50 rounded-[1.5rem] border border-white dark:border-border hover:shadow-md dark:hover:shadow-black/20 transition-all"
                          >
                            {mod.adminOnly && (
                              <span className="absolute top-4 right-4 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                                {g.adminBadge}
                              </span>
                            )}

                            {/* Icon + title */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-11 h-11 rounded-xl ${mod.bg} ${mod.color} flex items-center justify-center flex-shrink-0`}>
                                <mod.icon size={19} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-foreground text-sm italic">{mod.title}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                                  <FiArrowRight size={9} /> {mod.path}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-500 dark:text-muted-foreground font-medium leading-relaxed mb-4">
                              {mod.description}
                            </p>

                            {/* Steps */}
                            <ul className="space-y-1.5">
                              {mod.steps.map((step, sti) => (
                                <li key={sti} className="flex items-start gap-2">
                                  <span className={`mt-0.5 w-4 h-4 rounded-full ${mod.bg} ${mod.color} flex items-center justify-center flex-shrink-0 text-[8px] font-black`}>
                                    {sti + 1}
                                  </span>
                                  <span className="text-[11px] text-slate-600 dark:text-muted-foreground font-medium leading-snug">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── CONTACT ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
            <h3 className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-[0.3em]">{a.contactTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: FiPhone,  label: a.hotline,       val: "+22230572816",           color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-100 dark:ring-emerald-500/10" },
              { icon: FiMail,   label: a.expertSupport, val: "lamat032025@gmail.com",  color: "text-indigo-500 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-500/15",   ring: "ring-indigo-100 dark:ring-indigo-500/10" },
              { icon: FiMapPin, label: a.mainHQ,        val: "Nouakchott, Mauritanie", color: "text-rose-500 dark:text-rose-400",       bg: "bg-rose-50 dark:bg-rose-500/15",       ring: "ring-rose-100 dark:ring-rose-500/10" },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-7 md:p-8 rounded-[2.5rem] border border-white dark:border-border shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/30 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-[1.5rem] ${c.bg} ${c.color} ring-4 ${c.ring} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <c.icon size={24} />
                </div>
                <p className="text-[9px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-2">{c.label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-foreground italic break-words leading-snug">{c.val}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}
