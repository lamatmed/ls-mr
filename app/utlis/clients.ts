"use server";
import prisma from "@/lib/prisma";

export async function addClient(nom: string, tel: string, nif: string | null) {
  try {
    const newClient = await prisma.client.create({ data: { nom, tel, nif } });
    return { success: true, client: newClient };
  } catch (error: unknown) {
    console.error("addClient:", error);
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { error: "هذا الرقم مسجل لعميل آخر بالفعل!" };
    }
    return { error: "خطأ أثناء إضافة العميل" };
  }
}

export async function updateClient(id: string, nom?: string, tel?: string, nif?: string) {
  try {
    const updated = await prisma.client.update({ where: { id }, data: { nom, tel, nif } });
    return { success: true, client: updated };
  } catch (error: unknown) {
    console.error("updateClient:", error);
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return { error: "هذا الرقم مسجل لعميل آخر بالفعل!" };
    }
    return { error: "خطأ أثناء تعديل العميل" };
  }
}

export async function deleteClient(id: string) {
  try {
    const client = await prisma.client.findUnique({ where: { id }, include: { debts: true } });
    if (!client) return { error: "العميل غير موجود." };
    if (client.solde !== 0) return { error: "لا يمكن حذف العميل لأن حسابه غير مصفر." };

    const debt = client.debts[0];
    if (debt) await prisma.debt.delete({ where: { id: debt.id } });
    await prisma.client.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteClient:", error);
    return { error: "خطأ أثناء حذف العميل" };
  }
}

export async function getAllClients() {
  try {
    const clients = await prisma.client.findMany();
    return { success: true, clients };
  } catch (error) {
    console.error("getAllClients:", error);
    return { error: "Erreur lors de la récupération des clients" };
  }
}

export async function addVersement(clientId: string, amount: number) {
  if (!clientId || isNaN(amount) || amount <= 0) return { error: "بيانات غير صالحة" };

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.client.update({ where: { id: clientId }, data: { solde: { increment: amount } } });

      const debts = await tx.debt.findMany({
        where: { clientId, status: { not: "PAID" } },
        orderBy: { createdAt: "asc" },
      });

      let remaining = amount;
      for (const debt of debts) {
        if (remaining <= 0) break;
        const toPay = Math.min(debt.remaining, remaining);
        const newPaid = debt.amountPaid + toPay;
        const newRemaining = debt.totalAmount - newPaid;
        const newStatus = newRemaining <= 0 ? "PAID" : "PARTIAL";

        await tx.debt.update({
          where: { id: debt.id },
          data: { amountPaid: newPaid, remaining: Math.max(0, newRemaining), status: newStatus },
        });

        if (newStatus === "PAID") {
          const invoices = await tx.invoice.findMany({ where: { debtId: debt.id } });
          for (const inv of invoices) {
            await tx.invoice.update({ where: { id: inv.id }, data: { type: "CASH" } });
          }
        }

        remaining -= toPay;
      }

      return { success: true };
    });
  } catch (error: unknown) {
    console.error("addVersement:", error);
    return { error: error instanceof Error ? `خطأ: ${error.message}` : "حدث خطأ غير متوقع" };
  }
}

export async function syncAllClientBalances() {
  try {
    const clients = await prisma.client.findMany({ include: { debts: true } });
    let fixedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const client of clients) {
        const debt = client.debts[0];
        let correctSolde = client.solde;

        if (debt && debt.remaining > 0) {
          correctSolde = -debt.remaining;
        } else if (client.solde < 0) {
          correctSolde = 0;
        }

        if (client.solde !== correctSolde) {
          await tx.client.update({ where: { id: client.id }, data: { solde: correctSolde } });
          fixedCount++;
        }
      }
    });

    return { success: true, fixedCount };
  } catch (error) {
    console.error("syncAllClientBalances:", error);
    return { error: "خطأ أثناء المزامنة" };
  }
}
