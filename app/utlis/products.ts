"use server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

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

export async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      where: { deleted: false },
      select: {
        id: true, code: true, name: true, quantity: true,
        price_v: true, price_a: true, expirationDate: true, codeBar: true,
        categoryId: true, category: { select: { name: true } },
        fournisseurId: true, fournisseur: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getAllProducts:", error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true, code: true, name: true, quantity: true,
        price_v: true, price_a: true, expirationDate: true, createdAt: true, codeBar: true,
        categoryId: true, category: { select: { name: true } },
        fournisseurId: true, fournisseur: { select: { name: true } },
      },
    });
    if (!product) return { error: "المنتج غير موجود" };
    return {
      ...product,
      expirationDate: product.expirationDate.toISOString(),
      createdAt: product.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("getProductById:", error);
    return { error: "خطأ أثناء استرجاع المنتج" };
  }
}

export async function getLatestProducts() {
  try {
    return await prisma.product.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, code: true, name: true, quantity: true, price_v: true, price_a: true, expirationDate: true, codeBar: true },
    });
  } catch (error) {
    console.error("getLatestProducts:", error);
    return [];
  }
}

export async function addProduct(
  code: number, name: string, quantity: number, price_v: number, price_a: number,
  expirationDate: string, codeBar: string, categoryId?: string | null, fournisseurId?: string | null
) {
  try {
    if (price_v <= price_a) return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    if (quantity < 0) return { error: "لا يمكن أن تكون الكمية سالبة!" };

    const existingCode = await prisma.product.findUnique({ where: { code } });
    if (existingCode) {
      if (existingCode.deleted) {
        await prisma.product.update({ where: { id: existingCode.id }, data: { code: existingCode.code + 1000000 } });
      } else {
        return { error: "كود المنتج هذا موجود بالفعل!" };
      }
    }

    const existingBar = codeBar ? await prisma.product.findUnique({ where: { codeBar } }) : null;
    if (existingBar) {
      if (existingBar.deleted) {
        await prisma.product.update({ where: { id: existingBar.id }, data: { codeBar: existingBar.codeBar + "_old_" + Date.now() } });
      } else {
        return { error: "الرمز الشريطي لهذا المنتج موجود بالفعل!" };
      }
    }

    await prisma.product.create({
      data: { code, name, quantity, price_v, price_a, expirationDate: new Date(expirationDate), codeBar, categoryId, fournisseurId },
    });
    return { success: true };
  } catch (error) {
    console.error("addProduct:", error);
    return { error: "خطأ أثناء إضافة المنتج" };
  }
}

export async function updateProduct(
  id: string, code: number, name: string, quantity: number, price_v: number, price_a: number,
  expirationDate: string, codeBar: string, categoryId?: string | null, fournisseurId?: string | null
) {
  try {
    if (price_v <= price_a) return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    await prisma.product.update({
      where: { id },
      data: { code, name, quantity, price_v, price_a, expirationDate: new Date(expirationDate), codeBar, categoryId, fournisseurId },
    });
    return { success: true };
  } catch (error) {
    console.error("updateProduct:", error);
    return { error: "خطأ أثناء تعديل المنتج" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return { error: "المنتج غير موجود" };
    await prisma.product.update({
      where: { id },
      data: { deleted: true, code: product.code + 1000000 },
    });
    return { success: true };
  } catch (error) {
    console.error("deleteProduct:", error);
    return { error: "خطأ أثناء حذف المنتج" };
  }
}

export async function deleteAllProducts() {
  const session = await getSessionUser();
  if (!session?.admin) return { error: "Non autorisé." };
  try {
    const count = await prisma.product.count();
    await prisma.transaction.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.product.deleteMany();
    await auditLog(session.id, "deleteAllProducts", `${count} produit(s) supprimé(s)`);
    return { success: true };
  } catch (error) {
    console.error("deleteAllProducts:", error);
    return { error: "Erreur lors de la suppression des produits" };
  }
}

export async function getLastProductCode() {
  try {
    const last = await prisma.product.findFirst({
      where: { deleted: false }, orderBy: { code: "desc" }, select: { code: true },
    });
    return last ? last.code : null;
  } catch (error) {
    console.error("getLastProductCode:", error);
    return null;
  }
}

export async function updateQuantitePrice(
  id: string, newQuantity: number, price_v: number, price_a: number, userId?: string, quantityAdded?: number
) {
  try {
    if (price_v <= price_a) return { error: "يجب أن يكون سعر البيع أكبر من سعر الشراء!" };
    await prisma.product.update({ where: { id }, data: { quantity: newQuantity, price_v, price_a } });
    if (typeof quantityAdded === "number" && quantityAdded !== 0) {
      await prisma.transaction.create({ data: { productId: id, quantity: quantityAdded, type: "ajout", userId } });
    }
    return { success: true };
  } catch (error) {
    console.error("updateQuantitePrice:", error);
    return { error: "Erreur lors de la mise à jour du produit" };
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
          ...(isNum ? [{ code: parseInt(query) }] : []),
        ],
      },
      take: 10,
      select: { id: true, name: true, codeBar: true, code: true, price_a: true, price_v: true, expirationDate: true, categoryId: true },
    });
  } catch (error) {
    console.error("searchProducts:", error);
    return [];
  }
}

export async function processPurchaseInvoice(
  fournisseurId: string | null,
  items: {
    id?: string; code?: number; name: string; quantity: number;
    price_v: number; price_a: number; expirationDate: string;
    codeBar?: string; categoryId?: string | null;
  }[]
) {
  try {
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.id) {
          await tx.product.update({
            where: { id: item.id },
            data: {
              quantity: { increment: item.quantity },
              price_a: item.price_a, price_v: item.price_v,
              expirationDate: new Date(item.expirationDate),
              fournisseurId: fournisseurId || undefined,
              categoryId: item.categoryId || undefined,
            },
          });
          await tx.transaction.create({ data: { productId: item.id, quantity: item.quantity, type: "ajout" } });
        } else {
          const lastProduct = await tx.product.findFirst({ where: { deleted: false }, orderBy: { code: "desc" }, select: { code: true } });
          let nextCode = lastProduct ? lastProduct.code + 1 : 1;
          let codeAvailable = false;
          while (!codeAvailable) {
            const existing = await tx.product.findUnique({ where: { code: nextCode } });
            if (!existing) {
              codeAvailable = true;
            } else if (existing.deleted) {
              await tx.product.update({ where: { id: existing.id }, data: { code: existing.code + 1000000 } });
              codeAvailable = true;
            } else {
              nextCode++;
            }
          }

          const finalBarcode = item.codeBar?.trim()
            ? item.codeBar
            : `BC-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

          const existingByBar = await tx.product.findUnique({ where: { codeBar: finalBarcode } });
          if (existingByBar) throw new Error(`الرمز الشريطي ${finalBarcode} موجود بالفعل (${existingByBar.name})`);

          const newProduct = await tx.product.create({
            data: {
              code: nextCode, name: item.name, quantity: item.quantity,
              price_v: item.price_v, price_a: item.price_a,
              expirationDate: new Date(item.expirationDate),
              codeBar: finalBarcode,
              fournisseurId: fournisseurId || undefined,
              categoryId: item.categoryId || undefined,
            },
          });
          await tx.transaction.create({ data: { productId: newProduct.id, quantity: item.quantity, type: "ajout" } });
        }
      }
      return { success: true };
    });
  } catch (error: unknown) {
    console.error("processPurchaseInvoice:", error);
    return { error: error instanceof Error ? error.message : "خطأ أثناء معالجة الفاتورة" };
  }
}
