/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
interface SaleRecord {
  productId: string;
  quantity: number;
  totalPrice: number;
  purchasePrice: number;
}
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// 🔹 Ajouter un utilisateur
export async function addUser(
  nom: string,
  password: string,
  admin: boolean = false
) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { nom },
    });

    if (existingUser) {
      return { error: "يوجد مستخدم بهذا الاسم بالفعل!" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        nom,
        password: hashedPassword,
        admin,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur:", error);
    return { error: "خطأ أثناء إضافة المستخدم" };
  }
}

// 🔹 Récupérer tous les produits
export async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      where: { deleted: false },
      select: {
        id: true,
        code: true,
        name: true,
        quantity: true,
        price_v: true,
        price_a: true,
        expirationDate: true,
        codeBar: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          }
        },
        fournisseurId: true,
        fournisseur: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return [];
  }
}

// 🔹 Modifier un utilisateur
export async function updateUser(
  id: string,
  nom: string,
  password?: string,
  admin: boolean = false
) {
  try {
    const updateData: any = {
      nom,
      admin,
    };

    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur:", error);
    return { error: "خطأ أثناء تعديل المستخدم" };
  }
}

// 🔹 Bloquer un utilisateur
export const blockUser = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return { error: "L'utilisateur n'existe pas." };
    }

    if (user.isBlocked) {
      return { error: "المستخدم محظور بالفعل." };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Erreur lors du blocage de l'utilisateur:", error);
    return { error: "خطأ أثناء حظر المستخدم" };
  }
};

// 🔹 Débloquer un utilisateur
export const unblockUser = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return { error: "المستخدم غير موجود." };
    }

    if (!user.isBlocked) {
      return { error: "المستخدم غير محظور." };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Erreur lors du débloquage de l'utilisateur:", error);
    return { error: "خطأ أثناء إلغاء حظر المستخدم" };
  }
};

// 🔹 Vérifier si un utilisateur est bloqué
export const isUserBlocked = async (nom: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { nom },
      select: { isBlocked: true },
    });

    if (!user) {
      return { error: "المستخدم غير موجود." };
    }

    return { success: true, isBlocked: user.isBlocked };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut de blocage:", error);
    return { error: "خطأ أثناء التحقق من حالة الحظر" };
  }
};

// 🔹 Supprimer un utilisateur
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return { error: "خطأ أثناء حذف المستخدم" };
  }
}

// 🔹 Récupérer tous les utilisateurs
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
}


// 🔹 Ajouter un produit
export async function addProduct(
  code: number,
  name: string,
  quantity: number,
  price_v: number,
  price_a: number,
  expirationDate: string,
  codeBar: string,
  categoryId?: string | null,
  fournisseurId?: string | null
) {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { code },
    });

    if (existingProduct) {
      if (existingProduct.deleted) {
        // Si le produit existant est supprimé, on change son code pour libérer celui-ci
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: { code: existingProduct.code + 1000000 }
        });
      } else {
        return { error: "كود المنتج هذا موجود بالفعل!" };
      }
    }

    const existingProductcodeBar = await prisma.product.findUnique({
      where: { codeBar },
    });

    if (existingProductcodeBar) {
      if (existingProductcodeBar.deleted) {
        // On change aussi le codeBar du supprimé pour libérer celui-ci
        await prisma.product.update({
          where: { id: existingProductcodeBar.id },
          data: { codeBar: existingProductcodeBar.codeBar + "_old_" + Date.now() }
        });
      } else {
        return { error: "الرمز الشريطي لهذا المنتج موجود بالفعل!" };
      }
    }

    if (price_v <= price_a) {
      return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    }

    if (quantity < 0) {
      return { error: "لا يمكن أن تكون الكمية سالبة!" };
    }

    await prisma.product.create({
      data: {
        code,
        name,
        quantity,
        price_v,
        price_a,
        expirationDate: new Date(expirationDate),
        codeBar,
        categoryId,
        fournisseurId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit:", error);
    return { error: "خطأ أثناء إضافة المنتج" };
  }
}

// 🔹 Modifier un produit
export async function updateProduct(
  id: string,
  code: number,
  name: string,
  quantity: number,
  price_v: number,
  price_a: number,
  expirationDate: string,
  codeBar: string,
  categoryId?: string | null,
  fournisseurId?: string | null
) {
  try {
    if (price_v <= price_a) {
      return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    }
    await prisma.product.update({
      where: { id },
      data: {
        code,
        name,
        quantity,
        price_v,
        price_a,
        expirationDate: new Date(expirationDate),
        codeBar,
        categoryId,
        fournisseurId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la modification du produit:", error);
    return { error: "خطأ أثناء تعديل المنتج" };
  }
}

// 🔹 Supprimer un produit (Soft Delete)
export async function deleteProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { error: "المنتج غير موجود" };

    await prisma.product.update({
      where: { id },
      data: { 
        deleted: true,
        // On change le code pour éviter les collisions et permettre la réutilisation
        code: product.code + 1000000 
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du produit:", error);
    return { error: "خطأ أثناء حذف المنتج" };
  }
}

// 🔹 Récupérer un produit par son ID
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        quantity: true,
        price_v: true,
        price_a: true,
        expirationDate: true,
        createdAt: true,
        codeBar: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          }
        },
        fournisseurId: true,
        fournisseur: {
          select: {
            name: true,
          }
        }
      },
    });

    if (!product) {
      return { error: "المنتج غير موجود" };
    }

    return {
      ...product,
      expirationDate: product.expirationDate.toISOString(),
      createdAt: product.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du produit:", error);
    return { error: "خطأ أثناء استرجاع المنتج" };
  }
}

// 🔹 Récupérer les 5 derniers produits ajoutés
export async function getLatestProducts() {
  try {
    const latestProducts = await prisma.product.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        quantity: true,
        price_v: true,
        price_a: true,
        expirationDate: true,
        codeBar: true,
      },
    });

    return latestProducts;
  } catch (error) {
    console.error("Erreur lors de la récupération des derniers produits :", error);
    return [];
  }
}

// 🔹 Récupérer les statistiques du dashboard
export async function getDashboardStats() {
  try {
    const totalProducts = await prisma.product.count();

    const sales = await prisma.sale.findMany({
      select: {
        totalPrice: true,
        purchasePrice: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      select: { amount: true }
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalPurchaseCost = sales.reduce((sum, sale) => sum + sale.purchasePrice, 0);
    const totalProfit = totalSales - totalPurchaseCost - totalExpenses;

    const totalOrders = await prisma.sale.count();

    const products = await prisma.product.findMany({
      select: {
        quantity: true,
        price_a: true,
      },
    });
    const totalStockValue = products.reduce((sum, product) => sum + (product.quantity * product.price_a), 0);

    const debts = await prisma.debt.findMany({
      select: { remaining: true }
    });
    const totalDebts = debts.reduce((sum, debt) => sum + debt.remaining, 0);

    return {
      totalProducts,
      totalSales: totalSales || 0,
      totalProfit: totalProfit || 0,
      totalOrders,
      totalStockValue: totalStockValue || 0,
      totalDebts: totalDebts || 0,
      totalExpenses: totalExpenses || 0,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    return {
      totalProducts: 0,
      totalSales: 0,
      totalProfit: 0,
      totalOrders: 0,
      totalStockValue: 0,
      totalDebts: 0,
      totalExpenses: 0,
    };
  }
}


export async function addMultipleSales(
  salesData: { productId: string; quantity: number; unitPrice?: number }[],
  type: string = "CASH",
  clientId?: string
) {
  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: salesData.map(sale => sale.productId) },
      },
    });

    let totalAmount = 0;
    let purchaseTotal = 0;
    const salesRecords: SaleRecord[] = [];

    for (const sale of salesData) {
      const product = products.find(p => p.id === sale.productId);
      if (!product) return { error: `المنتج غير موجود: ${sale.productId}` };
      if (product.quantity < sale.quantity) return { error: `المخزون غير كافٍ لـ ${product.name}` };

      const unitPrice = sale.unitPrice ?? product.price_v;

      if (unitPrice <= product.price_a) {
        return { error: `سعر البيع لـ ${product.name} يجب أن يكون أكبر من سعر الشراء (${product.price_a})` };
      }

      const totalPrice = unitPrice * sale.quantity;
      const purchasePrice = product.price_a * sale.quantity;
      totalAmount += totalPrice;
      purchaseTotal += purchasePrice;

      salesRecords.push({
        productId: sale.productId,
        quantity: sale.quantity,
        totalPrice,
        purchasePrice,
      });
    }

    const saleTransaction = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.create({
        data: {
          totalAmount,
          purchaseTotal,
          type,
          clientId,
        },
      });

      for (const record of salesRecords) {
        await prisma.sale.create({
          data: {
            ...record,
            invoiceId: invoice.id,
          },
        });

        await prisma.product.update({
          where: { id: record.productId },
          data: {
            quantity: { decrement: record.quantity },
          },
        });
      }

      if (type === "DEBT" && clientId) {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) throw new Error("العميل غير موجود");

        // Calculate how much of the totalAmount is covered by the existing deposit
        const currentSolde = client.solde;
        const depositUsed = Math.max(0, Math.min(currentSolde, totalAmount));
        const effectiveDebtIncrement = totalAmount - depositUsed;

        await prisma.client.update({
          where: { id: clientId },
          data: { solde: { decrement: totalAmount } }
        });

        const existingDebt = await prisma.debt.findUnique({
          where: { clientId }
        });

        if (existingDebt) {
          await prisma.debt.update({
            where: { clientId },
            data: {
              totalAmount: { increment: effectiveDebtIncrement },
              remaining: { increment: effectiveDebtIncrement },
              status: "PARTIAL",
              invoices: { connect: { id: invoice.id } }
            }
          });
        } else {
          await prisma.debt.create({
            data: {
              clientId,
              totalAmount: effectiveDebtIncrement,
              remaining: effectiveDebtIncrement,
              status: "UNPAID",
              invoices: { connect: { id: invoice.id } }
            }
          });
        }
      }
      return invoice.id;
    });

    return { success: true, invoiceId: saleTransaction };
  } catch (error) {
    console.error("Erreur lors de l'ajout des ventes:", error);
    return { error: "Erreur lors de l'ajout des ventes" };
  }
}

export async function getSalesHistory() {
  try {
    const sales = await prisma.sale.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return sales.map((sale) => ({
      id: sale.id,
      productName: sale.product?.name ?? "Produit inconnu",
      quantity: sale.quantity,
      totalPrice: sale.totalPrice,
      purchasePrice: sale.purchasePrice,
      createdAt: sale.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des ventes:", error);
    return [];
  }
}

export async function getInvoiceHistory() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        sales: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      totalAmount: invoice.totalAmount,
      purchaseTotal: invoice.purchaseTotal,
      createdAt: invoice.createdAt.toISOString(),
      sales: invoice.sales.map((sale) => ({
        productName: sale.product?.name ?? "Produit inconnu",
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
      })),
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error);
    return [];
  }
}


export async function returnSale(saleId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find the sale and its invoice/client
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { 
          invoice: { 
            include: { 
              client: true,
              debt: true
            } 
          },
          product: true 
        }
      });
      if (!sale) throw new Error("Vente non trouvée");

      // 2. Update stock
      await tx.product.update({
        where: { id: sale.productId },
        data: { stock: { increment: sale.quantity } }
      });

      // 3. Update client solde (if client exists)
      if (sale.invoice.clientId) {
        await tx.client.update({
          where: { id: sale.invoice.clientId },
          data: { solde: { increment: sale.totalPrice } }
        });
        
        // 4. Update debt if linked
        if (sale.invoice.debtId && sale.invoice.debt) {
           const debt = sale.invoice.debt;
           const toRefund = Math.min(debt.remaining, sale.totalPrice);
           await tx.debt.update({
              where: { id: debt.id },
              data: {
                 totalAmount: { decrement: sale.totalPrice },
                 remaining: { decrement: toRefund },
              }
           });
        }
      }

      // 5. Update invoice total
      await tx.invoice.update({
        where: { id: sale.invoiceId },
        data: { 
          totalAmount: { decrement: sale.totalPrice },
          purchaseTotal: { decrement: sale.purchasePrice }
        }
      });

      // 6. Delete the sale
      await tx.sale.delete({ where: { id: saleId } });

      return { success: true };
    });
  } catch (error: any) {
    console.error("Erreur retour:", error);
    return { error: error.message || "خطأ أثناء إرجاع المنتج" };
  }
}


export async function getDebts() {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        client: true,
        invoices: {
          include: {
            sales: {
              include: { product: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return debts.map(debt => ({
      ...debt,
      // For compatibility with UI that expects debt.invoice.sales
      invoice: debt.invoices[0] || null, 
      // Add all invoices for the modal
      allInvoices: debt.invoices.map(inv => ({
        ...inv,
        sales: inv.sales.map(sale => ({
          ...sale,
          productName: sale.product?.name ?? "Produit inconnu"
        }))
      }))
    }));
  } catch (error) {
    console.error("Erreur dettes:", error);
    return [];
  }
}

export async function addDebtPayment(debtId: string, amount: number) {
  try {
    const debt = await prisma.debt.findUnique({ 
      where: { id: debtId },
      include: { invoices: true }
    });
    if (!debt) throw new Error("Dette non trouvée");

    const newAmountPaid = debt.amountPaid + amount;
    const newRemaining = debt.totalAmount - newAmountPaid;
    const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

    await prisma.$transaction(async (prisma) => {
      await prisma.debt.update({
        where: { id: debtId },
        data: {
          amountPaid: newAmountPaid,
          remaining: Math.max(0, newRemaining),
          status: newStatus,
        }
      });

      await prisma.client.update({
        where: { id: debt.clientId },
        data: { solde: { increment: amount } }
      });
    });

    if (newStatus === "PAID") {
      for (const invoice of debt.invoices) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { type: "CASH" }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur paiement dette:", error);
    return { success: false };
  }
}

export async function getMonthlySales() {
  try {
    const sales = await prisma.sale.groupBy({
      by: ["createdAt"],
      _sum: { totalPrice: true },
      orderBy: { createdAt: "asc" },
    });

    const formattedSales = sales.map((sale) => ({
      month: new Date(sale.createdAt).toLocaleString("fr-FR", { month: "long" }),
      totalSales: sale._sum.totalPrice || 0,
    }));

    return formattedSales;
  } catch (error) {
    console.error("Erreur lors de la récupération des ventes mensuelles:", error);
    return [];
  }
}




export async function addVersement(clientId: string, amount: number) {
  if (!clientId || isNaN(amount) || amount <= 0) {
    return { error: "بيانات غير صالحة" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Update client solde
      await tx.client.update({
        where: { id: clientId },
        data: { solde: { increment: amount } }
      });

      // 2. Find unpaid/partial debts for this client
      const debts = await tx.debt.findMany({
        where: { 
          clientId,
          status: { not: "PAID" }
        },
        orderBy: { createdAt: "asc" }
      });

      let remainingVersement = amount;
      for (const debt of debts) {
        if (remainingVersement <= 0) break;
        
        const toPay = Math.min(debt.remaining, remainingVersement);
        const newAmountPaid = debt.amountPaid + toPay;
        const newRemaining = debt.totalAmount - newAmountPaid;
        const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

        await tx.debt.update({
          where: { id: debt.id },
          data: {
            amountPaid: newAmountPaid,
            remaining: Math.max(0, newRemaining),
            status: newStatus
          }
        });
        
        if (newStatus === "PAID") {
           const invoices = await tx.invoice.findMany({ 
             where: { debtId: debt.id } 
           });
           for (const inv of invoices) {
              await tx.invoice.update({ 
                where: { id: inv.id }, 
                data: { type: "CASH" } 
              });
           }
        }

        remainingVersement -= toPay;
      }

      return { success: true };
    });
  } catch (error: any) {
    console.error("Erreur versement:", error);
    return { error: `خطأ: ${error.message || "حدث خطأ غير متوقع"}` };
  }
}


export async function addClient(nom: string, tel: string, nif: string | null) {
  try {
    const newClient = await prisma.client.create({
      data: {
        nom,
        tel,
        nif,
      },
    });

    return { success: true, client: newClient };
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du client:", error);
    if (error.code === 'P2002') {
      return { error: "هذا الرقم مسجل لعميل آخر بالفعل!" };
    }
    return { error: "خطأ أثناء إضافة العميل" };
  }
}

export async function updateClient(id: string, nom?: string, tel?: string, nif?: string) {
  try {
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        nom,
        tel,
        nif,
      },
    });

    return { success: true, client: updatedClient };
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du client:", error);
    if (error.code === 'P2002') {
      return { error: "هذا الرقم مسجل لعميل آخر بالفعل!" };
    }
    return { error: "خطأ أثناء تعديل العميل" };
  }
}

export async function deleteClient(id: string) {
  try {
    // 1. Vérifier le solde du client
    const client = await prisma.client.findUnique({
      where: { id },
      include: { debts: true }
    });

    if (!client) {
      return { error: "العميل غير موجود." };
    }

    if (client.solde !== 0) {
      return { error: "لا يمكن حذف العميل لأن حسابه غير مصفر (يوجد دين أو رصيد متبقي)." };
    }

    // 2. Si la dette existe et est à 0, on la supprime d'abord
    const debt = client.debts[0];
    if (debt) {
      await prisma.debt.delete({
        where: { id: debt.id }
      });
    }

    // 3. Supprimer le client (les factures seront mises à NULL automatiquement via le schéma)
    await prisma.client.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la suppression du client:", error);
    return { error: "خطأ أثناء حذف العميل" };
  }
}

export async function getAllClients() {
  try {
    const clients = await prisma.client.findMany();
    return { success: true, clients };
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return { error: "Erreur lors de la récupération des clients" };
  }
}


export async function loginUser(nom: string, password: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { nom },
    });

    if (!user) {
      return { error: "المستخدم غير موجود." };
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return { error: "كلمة المرور غير صحيحة." };
    }

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    cookieStore.set("isAdmin", user.admin ? "1" : "0", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return { error: "Erreur lors de la connexion." };
  }
}

export async function getLastProductCode() {
  try {
    const lastProduct = await prisma.product.findFirst({
      where: { deleted: false },
      orderBy: { code: "desc" },
      select: { code: true },
    });

    return lastProduct ? lastProduct.code : null;
  } catch (error) {
    console.error("Erreur lors de la récupération du dernier code produit :", error);
    return null;
  }
}

export async function deleteAllProducts() {
  try {
    await prisma.transaction.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.invoice.deleteMany();
    
    await prisma.product.deleteMany();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression des produits:", error);
    return { error: "Erreur lors de la suppression des produits" };
  }
}

export async function deleteAllSales() {
  try {
    await prisma.sale.deleteMany();
    await prisma.invoice.deleteMany();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression des ventes:", error);
    return { error: "Erreur lors de la suppression des ventes" };
  }
}


export async function updateQuantitePrice(
  id: string,
  newQuantity: number,
  price_v: number,
  price_a: number,
  userId?: string,
  quantityAdded?: number
) {
  try {
    if (price_v <= price_a) {
      return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    }
    await prisma.product.update({
      where: { id },
      data: {
        quantity: newQuantity,
        price_v,
        price_a,
      },
    });
    if (typeof quantityAdded === 'number' && quantityAdded !== 0) {
      await createTransaction(id, quantityAdded, "ajout", userId);
    }
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    return { error: "Erreur lors de la mise à jour du produit" };
  }
}


export async function deleteInvoice(invoiceId: string) {
  try {
    const sales = await prisma.sale.findMany({
      where: { invoiceId },
      include: { product: true },
    });

    for (const sale of sales) {
      if (sale.productId) {
        await prisma.product.update({
          where: { id: sale.productId },
          data: {
            quantity: {
              increment: sale.quantity,
            },
          },
        });
      }
    }

    await prisma.sale.deleteMany({
      where: { invoiceId },
    });

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return { success: true, message: 'تم حذف الفاتورة بنجاح.' };

  } catch (error) {
    console.error('Erreur lors de la suppression de la facture :', error);
    return { success: false, message: 'خطأ أثناء حذف الفاتورة.' };
  }
}

export async function createTransaction(productId: string, quantity: number, type: string, userId?: string) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        productId,
        quantity,
        type,
        userId,
      },
    });
    return { success: true, transaction };
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la transaction:", error);
    return { error: "Erreur lors de l'enregistrement de la transaction" };
  }
}

export async function getAllTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        product: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    return transactions;
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error);
    return [];
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la transaction:", error);
    return { error: "Erreur lors de la suppression de la transaction" };
  }
}

export async function getCompany() {
  try {
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: "1",
          name: "PHARMACIE EL MEIMOUN",
          address: "Caraffour Guerou-Geurou",
          contact: "+222 30 30 30 30 / +222 42 42 42 42",
          nif: null,
          currency: "MRU",
          logo: null,
        }
      });
    }
    return company;
  } catch {
    return { name: "PHARMACIE EL MEIMOUN", address: "Caraffour Guerou-Geurou", contact: "+222 30 30 30 30 / +222 42 42 42 42", nif: null, currency: "MRU", logo: null };
  }
}

export async function updateCompany(
  name: string,
  address: string,
  contact: string,
  nif?: string | null,
  currency?: string,
  logo?: string | null,
) {
  try {
    const data = { name, address, contact, nif: nif ?? null, currency: currency || "MRU", ...(logo !== undefined ? { logo } : {}) };
    await prisma.company.upsert({
      where: { id: "1" },
      update: data,
      create: { id: "1", ...data },
    });
    return { success: true };
  } catch (e) {
    console.error("[updateCompany]", e);
    return { error: "Erreur lors de la mise à jour de la compagnie" };
  }
}

export async function getAllCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return [];
  }
}

export async function addCategory(name: string) {
  try {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim() } }
    });

    if (existing) {
      return { error: "فئة بهذا الاسم موجودة بالفعل." };
    }

    const category = await prisma.category.create({
      data: { name: name.trim() }
    });

    return { success: true, category };
  } catch (error) {
    console.error("Erreur ajout catégorie:", error);
    return { error: "Erreur lors de l'ajout de la catégorie." };
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    const existing = await prisma.category.findFirst({
      where: { 
        name: { equals: name.trim() },
        id: { not: id }
      }
    });

    if (existing) {
      return { error: "هذا الاسم مستخدم بالفعل في فئة أخرى." };
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() }
    });

    return { success: true, category };
  } catch (error) {
    console.error("Erreur modification catégorie:", error);
    return { error: "Erreur lors de la modification." };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression catégorie:", error);
    return { error: "لا يمكن حذف الفئة. قد تكون مستخدمة في مكان آخر." };
  }
}

export async function syncAllClientBalances() {
  try {
    const clients = await prisma.client.findMany({
      include: { debts: true }
    });

    let fixedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const client of clients) {
        const debt = client.debts[0];
        let correctSolde = client.solde;

        if (debt && debt.remaining > 0) {
          // If there is a remaining debt, the solde must be -remaining
          correctSolde = -debt.remaining;
        } else if (client.solde < 0) {
          // If solde is negative but no debt record or remaining is 0, reset to 0
          correctSolde = 0;
        }
        // If solde is positive (deposit), we keep it as is (source of truth)

        if (client.solde !== correctSolde) {
          await tx.client.update({
            where: { id: client.id },
            data: { solde: correctSolde }
          });
          fixedCount++;
        }
      }
    });

    return { success: true, fixedCount };
  } catch (error) {
    console.error("Erreur synchronisation:", error);
    return { error: "خطأ أثناء المزامنة" };
  }
}

export async function addExpense(type: string, amount: number, description?: string) {
  try {
    if (amount <= 0) {
      return { error: "يجب أن يكون المبلغ أكبر من الصفر" };
    }
    
    await prisma.expense.create({
      data: {
        type,
        amount,
        description: description || null
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erreur ajout dépense:", error);
    return { error: "خطأ أثناء إضافة النفقة" };
  }
}

export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" }
    });
    
    return expenses.map(exp => ({
      id: exp.id,
      type: exp.type,
      amount: exp.amount,
      description: exp.description,
      createdAt: exp.createdAt.toISOString()
    }));
  } catch (error) {
    console.error("Erreur récupération dépenses:", error);
    return [];
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression dépense:", error);
    return { error: "خطأ أثناء حذف النفقة" };
  }
}

// 🔹 CRUD Fournisseurs
export async function addFournisseur(name: string, contact?: string) {
  try {
    const existing = await prisma.fournisseur.findUnique({ where: { name } });
    if (existing) return { error: "هذا المورد موجود بالفعل!" };
    
    await prisma.fournisseur.create({ data: { name, contact } });
    return { success: true };
  } catch (error) {
    console.error("Erreur ajout fournisseur:", error);
    return { error: "خطأ أثناء إضافة المورد" };
  }
}

export async function updateFournisseur(id: string, name: string, contact?: string) {
  try {
    await prisma.fournisseur.update({
      where: { id },
      data: { name, contact }
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur modification fournisseur:", error);
    return { error: "خطأ أثناء تعديل المورد" };
  }
}

export async function deleteFournisseur(id: string) {
  try {
    await prisma.fournisseur.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Erreur suppression fournisseur:", error);
    return { error: "خطأ أثناء حذف المورد" };
  }
}

export async function getAllFournisseurs() {
  try {
    return await prisma.fournisseur.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Erreur récupération fournisseurs:", error);
    return [];
  }
}

export async function searchProducts(query: string) {
  try {
    const isNum = !isNaN(parseInt(query)) && !isNaN(Number(query));
    return await prisma.product.findMany({
      where: {
        deleted: false,
        OR: [
          { name: { contains: query } },
          { codeBar: { contains: query } },
          isNum ? { code: parseInt(query) } : {},
        ].filter(obj => Object.keys(obj).length > 0)
      },
      take: 10,
      select: {
        id: true,
        name: true,
        codeBar: true,
        code: true,
        price_a: true,
        price_v: true,
        expirationDate: true,
        categoryId: true,
      }
    });
  } catch (error) {
    console.error("Search products error:", error);
    return [];
  }
}

export async function processPurchaseInvoice(
  fournisseurId: string | null,
  items: {
    id?: string;
    code?: number;
    name: string;
    quantity: number;
    price_v: number;
    price_a: number;
    expirationDate: string;
    codeBar?: string;
    categoryId?: string | null;
  }[]
) {
  try {
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.id) {
          // Existing product
          await tx.product.update({
            where: { id: item.id },
            data: {
              quantity: { increment: item.quantity },
              price_a: item.price_a,
              price_v: item.price_v,
              expirationDate: new Date(item.expirationDate),
              fournisseurId: fournisseurId || undefined,
              categoryId: item.categoryId || undefined,
            },
          });
          
          await tx.transaction.create({
            data: {
              productId: item.id,
              quantity: item.quantity,
              type: "ajout",
            }
          });
        } else {
          // New product
          // Find the next available code inside the transaction to avoid collisions
          const lastProduct = await tx.product.findFirst({ 
            where: { deleted: false },
            orderBy: { code: "desc" },
            select: { code: true }
          });
          
          let nextCode = lastProduct ? lastProduct.code + 1 : 1;
          
          // Double check to ensure we don't jump over deleted codes
          let isCodeTaken = true;
          while (isCodeTaken) {
            const existing = await tx.product.findUnique({ where: { code: nextCode } });
            if (existing) {
              if (existing.deleted) {
                // Si le produit est supprimé, on libère le code en le renommant
                await tx.product.update({
                  where: { id: existing.id },
                  data: { code: existing.code + 1000000 }
                });
                isCodeTaken = false; // Maintenant le code est libre
              } else {
                nextCode++; // Le code est pris par un produit actif, on passe au suivant
              }
            } else {
              isCodeTaken = false; // Le code est libre
            }
          }

          // Generate a barcode if not provided
          const finalBarcode = item.codeBar && item.codeBar.trim() !== "" 
            ? item.codeBar 
            : `BC-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

          // Check if barcode is already taken
          const existingByBar = await tx.product.findUnique({ where: { codeBar: finalBarcode } });
          if (existingByBar) throw new Error(`الرمز الشريطي ${finalBarcode} موجود بالفعل (${existingByBar.name})`);

          const newProduct = await tx.product.create({
            data: {
              code: nextCode,
              name: item.name,
              quantity: item.quantity,
              price_v: item.price_v,
              price_a: item.price_a,
              expirationDate: new Date(item.expirationDate),
              codeBar: finalBarcode,
              fournisseurId: fournisseurId || undefined,
              categoryId: item.categoryId || undefined,
            },
          });

          await tx.transaction.create({
            data: {
              productId: newProduct.id,
              quantity: item.quantity,
              type: "ajout",
            }
          });
        }
      }
      return { success: true };
    });
  } catch (error: any) {
    console.error("Purchase invoice error:", error);
    return { error: error.message || "خطأ أثناء معالجة الفاتورة" };
  }
}