"use server";
import prisma from "@/lib/prisma";

export async function addExpense(type: string, amount: number, description?: string) {
  try {
    if (amount <= 0) return { error: "يجب أن يكون المبلغ أكبر من الصفر" };
    await prisma.expense.create({ data: { type, amount, description: description ?? null } });
    return { success: true };
  } catch (error) {
    console.error("addExpense:", error);
    return { error: "خطأ أثناء إضافة النفقة" };
  }
}

export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
    return expenses.map((exp) => ({
      id: exp.id,
      type: exp.type,
      amount: exp.amount,
      description: exp.description,
      createdAt: exp.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("getExpenses:", error);
    return [];
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteExpense:", error);
    return { error: "خطأ أثناء حذف النفقة" };
  }
}
