"use server";
import prisma from "@/lib/prisma";

export async function getAllCategories() {
  try {
    return await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getAllCategories:", error);
    return [];
  }
}

export async function addCategory(name: string) {
  try {
    const existing = await prisma.category.findFirst({ where: { name: { equals: name.trim() } } });
    if (existing) return { error: "فئة بهذا الاسم موجودة بالفعل." };
    const category = await prisma.category.create({ data: { name: name.trim() } });
    return { success: true, category };
  } catch (error) {
    console.error("addCategory:", error);
    return { error: "Erreur lors de l'ajout de la catégorie." };
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    const existing = await prisma.category.findFirst({ where: { name: { equals: name.trim() }, id: { not: id } } });
    if (existing) return { error: "هذا الاسم مستخدم بالفعل في فئة أخرى." };
    const category = await prisma.category.update({ where: { id }, data: { name: name.trim() } });
    return { success: true, category };
  } catch (error) {
    console.error("updateCategory:", error);
    return { error: "Erreur lors de la modification." };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("deleteCategory:", error);
    return { error: "لا يمكن حذف الفئة. قد تكون مستخدمة في مكان آخر." };
  }
}
