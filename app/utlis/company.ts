"use server";
import prisma from "@/lib/prisma";

const DEFAULT_COMPANY = {
  name: "PHARMACIE EL MEIMOUN",
  address: "Caraffour Guerou-Geurou",
  contact: "+222 30 30 30 30 / +222 42 42 42 42",
  nif: null,
  currency: "MRU",
  logo: null,
};

export async function getCompany() {
  try {
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({ data: { id: "1", ...DEFAULT_COMPANY } });
    }
    return company;
  } catch {
    return { id: "1", updatedAt: new Date(), ...DEFAULT_COMPANY };
  }
}

export async function updateCompany(
  name: string, address: string, contact: string,
  nif?: string | null, currency?: string, logo?: string | null
) {
  try {
    const data = {
      name, address, contact,
      nif: nif ?? null,
      currency: currency ?? "MRU",
      ...(logo !== undefined ? { logo } : {}),
    };
    await prisma.company.upsert({ where: { id: "1" }, update: data, create: { id: "1", ...data } });
    return { success: true };
  } catch (error) {
    console.error("updateCompany:", error);
    return { error: "Erreur lors de la mise à jour de la compagnie" };
  }
}
