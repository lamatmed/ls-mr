"use server";
import prisma from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    const [totalProducts, sales, expenses, products, debts, totalOrders] = await Promise.all([
      prisma.product.count(),
      prisma.sale.findMany({ select: { totalPrice: true, purchasePrice: true } }),
      prisma.expense.findMany({ select: { amount: true } }),
      prisma.product.findMany({ select: { quantity: true, price_a: true } }),
      prisma.debt.findMany({ select: { remaining: true } }),
      prisma.sale.count(),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSales = sales.reduce((s, e) => s + e.totalPrice, 0);
    const totalPurchaseCost = sales.reduce((s, e) => s + e.purchasePrice, 0);
    const totalProfit = totalSales - totalPurchaseCost - totalExpenses;
    const totalStockValue = products.reduce((s, p) => s + p.quantity * p.price_a, 0);
    const totalDebts = debts.reduce((s, d) => s + d.remaining, 0);

    return { totalProducts, totalSales, totalProfit, totalOrders, totalStockValue, totalDebts, totalExpenses };
  } catch (error) {
    console.error("getDashboardStats:", error);
    return { totalProducts: 0, totalSales: 0, totalProfit: 0, totalOrders: 0, totalStockValue: 0, totalDebts: 0, totalExpenses: 0 };
  }
}

export async function getAllTransactions() {
  try {
    return await prisma.transaction.findMany({
      include: { product: { select: { name: true, code: true } } },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("getAllTransactions:", error);
    return [];
  }
}

export async function createTransaction(productId: string, quantity: number, type: string, userId?: string) {
  try {
    const transaction = await prisma.transaction.create({ data: { productId, quantity, type, userId } });
    return { success: true, transaction };
  } catch (error) {
    console.error("createTransaction:", error);
    return { error: "Erreur lors de l'enregistrement de la transaction" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteTransaction:", error);
    return { error: "Erreur lors de la suppression de la transaction" };
  }
}
