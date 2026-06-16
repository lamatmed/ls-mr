"use server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

interface SaleRecord {
  productId: string;
  quantity: number;
  totalPrice: number;
  purchasePrice: number;
}

async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, admin: true, isBlocked: true },
  });
}

async function auditLog(userId: string, action: string, details?: string) {
  try {
    await prisma.auditLog.create({ data: { userId, action, details } });
  } catch { /* non bloquant */ }
}

export async function addMultipleSales(
  salesData: { productId: string; quantity: number; unitPrice?: number }[],
  type = "CASH",
  clientId?: string
) {
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: salesData.map((s) => s.productId) } },
    });

    let totalAmount = 0;
    let purchaseTotal = 0;
    const salesRecords: SaleRecord[] = [];

    for (const sale of salesData) {
      const product = products.find((p) => p.id === sale.productId);
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
      salesRecords.push({ productId: sale.productId, quantity: sale.quantity, totalPrice, purchasePrice });
    }

    const invoiceId = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({ data: { totalAmount, purchaseTotal, type, clientId } });

      for (const record of salesRecords) {
        await tx.sale.create({ data: { ...record, invoiceId: invoice.id } });
        await tx.product.update({ where: { id: record.productId }, data: { quantity: { decrement: record.quantity } } });
      }

      if (type === "DEBT" && clientId) {
        const client = await tx.client.findUnique({ where: { id: clientId } });
        if (!client) throw new Error("العميل غير موجود");

        const depositUsed = Math.max(0, Math.min(client.solde, totalAmount));
        const effectiveDebt = totalAmount - depositUsed;

        await tx.client.update({ where: { id: clientId }, data: { solde: { decrement: totalAmount } } });

        const existingDebt = await tx.debt.findUnique({ where: { clientId } });
        if (existingDebt) {
          await tx.debt.update({
            where: { clientId },
            data: { totalAmount: { increment: effectiveDebt }, remaining: { increment: effectiveDebt }, status: "PARTIAL", invoices: { connect: { id: invoice.id } } },
          });
        } else {
          await tx.debt.create({
            data: { clientId, totalAmount: effectiveDebt, remaining: effectiveDebt, status: "UNPAID", invoices: { connect: { id: invoice.id } } },
          });
        }
      }

      return invoice.id;
    });

    return { success: true, invoiceId };
  } catch (error) {
    console.error("addMultipleSales:", error);
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
    console.error("getSalesHistory:", error);
    return [];
  }
}

export async function getInvoiceHistory() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { sales: { include: { product: true } } },
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
    console.error("getInvoiceHistory:", error);
    return [];
  }
}

export async function returnSale(saleId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { invoice: { include: { client: true, debt: true } }, product: true },
      });
      if (!sale) throw new Error("Vente non trouvée");

      if (sale.productId) {
        await tx.product.update({ where: { id: sale.productId }, data: { quantity: { increment: sale.quantity } } });
      }

      if (sale.invoice?.clientId) {
        await tx.client.update({ where: { id: sale.invoice.clientId }, data: { solde: { increment: sale.totalPrice } } });

        if (sale.invoice.debtId && sale.invoice.debt) {
          const debt = sale.invoice.debt;
          const toRefund = Math.min(debt.remaining, sale.totalPrice);
          await tx.debt.update({
            where: { id: debt.id },
            data: { totalAmount: { decrement: sale.totalPrice }, remaining: { decrement: toRefund } },
          });
        }
      }

      if (sale.invoiceId) {
        await tx.invoice.update({
          where: { id: sale.invoiceId },
          data: { totalAmount: { decrement: sale.totalPrice }, purchaseTotal: { decrement: sale.purchasePrice } },
        });
      }

      await tx.sale.delete({ where: { id: saleId } });
      return { success: true };
    });
  } catch (error: unknown) {
    console.error("returnSale:", error);
    return { error: error instanceof Error ? error.message : "خطأ أثناء إرجاع المنتج" };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const sales = await prisma.sale.findMany({ where: { invoiceId }, include: { product: true } });
    for (const sale of sales) {
      if (sale.productId) {
        await prisma.product.update({ where: { id: sale.productId }, data: { quantity: { increment: sale.quantity } } });
      }
    }
    await prisma.sale.deleteMany({ where: { invoiceId } });
    await prisma.invoice.delete({ where: { id: invoiceId } });
    return { success: true, message: "تم حذف الفاتورة بنجاح." };
  } catch (error) {
    console.error("deleteInvoice:", error);
    return { success: false, message: "خطأ أثناء حذف الفاتورة." };
  }
}

export async function deleteAllSales() {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const count = await prisma.sale.count();
    await prisma.sale.deleteMany();
    await prisma.invoice.deleteMany();
    await auditLog(session.id, "deleteAllSales", `${count} vente(s) supprimée(s)`);
    return { success: true };
  } catch (error) {
    console.error("deleteAllSales:", error);
    return { error: "Erreur lors de la suppression des ventes" };
  }
}

export async function getMonthlySales() {
  try {
    const sales = await prisma.sale.groupBy({
      by: ["createdAt"],
      _sum: { totalPrice: true },
      orderBy: { createdAt: "asc" },
    });
    return sales.map((sale) => ({
      month: new Date(sale.createdAt).toLocaleString("fr-FR", { month: "long" }),
      totalSales: sale._sum.totalPrice ?? 0,
    }));
  } catch (error) {
    console.error("getMonthlySales:", error);
    return [];
  }
}
