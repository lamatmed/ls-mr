"use server";
import prisma from "@/lib/prisma";

export async function getDebts() {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        client: true,
        invoices: {
          include: { sales: { include: { product: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return debts.map((debt) => ({
      ...debt,
      invoice: debt.invoices[0] ?? null,
      allInvoices: debt.invoices.map((inv) => ({
        ...inv,
        sales: inv.sales.map((sale) => ({
          ...sale,
          productName: sale.product?.name ?? "Produit inconnu",
        })),
      })),
    }));
  } catch (error) {
    console.error("getDebts:", error);
    return [];
  }
}

export async function addDebtPayment(debtId: string, amount: number) {
  try {
    const debt = await prisma.debt.findUnique({ where: { id: debtId }, include: { invoices: true } });
    if (!debt) throw new Error("Dette non trouvée");

    const newAmountPaid = debt.amountPaid + amount;
    const newRemaining = debt.totalAmount - newAmountPaid;
    const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

    await prisma.$transaction(async (tx) => {
      await tx.debt.update({
        where: { id: debtId },
        data: { amountPaid: newAmountPaid, remaining: Math.max(0, newRemaining), status: newStatus },
      });
      await tx.client.update({ where: { id: debt.clientId }, data: { solde: { increment: amount } } });
    });

    if (newStatus === "PAID") {
      for (const invoice of debt.invoices) {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { type: "CASH" } });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("addDebtPayment:", error);
    return { success: false };
  }
}
