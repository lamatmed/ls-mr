"use server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

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

export async function addUser(nom: string, password: string, admin = false) {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const existing = await prisma.user.findFirst({ where: { nom } });
    if (existing) return { error: "يوجد مستخدم بهذا الاسم بالفعل!" };
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { nom, password: hashedPassword, admin } });
    await auditLog(session.id, "addUser", `Nouvel utilisateur : ${nom}`);
    return { success: true };
  } catch (error) {
    console.error("addUser:", error);
    return { error: "خطأ أثناء إضافة المستخدم" };
  }
}

export async function updateUser(id: string, nom: string, password?: string, admin = false) {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const data: { nom: string; admin: boolean; password?: string } = { nom, admin };
    if (password) data.password = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data });
    return { success: true };
  } catch (error) {
    console.error("updateUser:", error);
    return { error: "خطأ أثناء تعديل المستخدم" };
  }
}

export async function deleteUser(id: string) {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { nom: true } });
    await prisma.user.delete({ where: { id } });
    await auditLog(session.id, "deleteUser", `Utilisateur supprimé : ${target?.nom ?? id}`);
    return { success: true };
  } catch (error) {
    console.error("deleteUser:", error);
    return { error: "خطأ أثناء حذف المستخدم" };
  }
}

export async function getAllUsers() {
  const session = await getSessionUser();
  if (!session?.admin) return [];
  try {
    return await prisma.user.findMany({
      select: { id: true, nom: true, admin: true, isBlocked: true },
    });
  } catch (error) {
    console.error("getAllUsers:", error);
    return [];
  }
}

export async function blockUser(id: string) {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "L'utilisateur n'existe pas." };
    if (user.isBlocked) return { error: "المستخدم محظور بالفعل." };
    const updated = await prisma.user.update({ where: { id }, data: { isBlocked: true } });
    await auditLog(session.id, "blockUser", `Utilisateur bloqué : ${user.nom}`);
    return { success: true, user: updated };
  } catch (error) {
    console.error("blockUser:", error);
    return { error: "خطأ أثناء حظر المستخدم" };
  }
}

export async function unblockUser(id: string) {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { error: "المستخدم غير موجود." };
    if (!user.isBlocked) return { error: "المستخدم غير محظور." };
    const updated = await prisma.user.update({ where: { id }, data: { isBlocked: false } });
    await auditLog(session.id, "unblockUser", `Utilisateur débloqué : ${user.nom}`);
    return { success: true, user: updated };
  } catch (error) {
    console.error("unblockUser:", error);
    return { error: "خطأ أثناء إلغاء حظر المستخدم" };
  }
}

export async function isUserBlocked(nom: string) {
  try {
    const user = await prisma.user.findUnique({ where: { nom }, select: { isBlocked: true } });
    if (!user) return { error: "المستخدم غير موجود." };
    return { success: true, isBlocked: user.isBlocked };
  } catch (error) {
    console.error("isUserBlocked:", error);
    return { error: "خطأ أثناء التحقق من حالة الحظر" };
  }
}
