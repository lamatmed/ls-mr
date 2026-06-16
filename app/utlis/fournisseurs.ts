"use server";
import prisma from "@/lib/prisma";

export async function getAllFournisseurs() {
  try {
    return await prisma.fournisseur.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.error("getAllFournisseurs:", error);
    return [];
  }
}

export async function addFournisseur(name: string, contact?: string) {
  try {
    const existing = await prisma.fournisseur.findUnique({ where: { name } });
    if (existing) return { error: "هذا المورد موجود بالفعل!" };
    await prisma.fournisseur.create({ data: { name, contact } });
    return { success: true };
  } catch (error) {
    console.error("addFournisseur:", error);
    return { error: "خطأ أثناء إضافة المورد" };
  }
}

export async function updateFournisseur(id: string, name: string, contact?: string) {
  try {
    await prisma.fournisseur.update({ where: { id }, data: { name, contact } });
    return { success: true };
  } catch (error) {
    console.error("updateFournisseur:", error);
    return { error: "خطأ أثناء تعديل المورد" };
  }
}

export async function deleteFournisseur(id: string) {
  try {
    await prisma.fournisseur.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteFournisseur:", error);
    return { error: "خطأ أثناء حذف المورد" };
  }
}
