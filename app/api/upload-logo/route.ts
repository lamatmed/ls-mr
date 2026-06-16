import { UTApi } from "uploadthing/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN!,
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

async function getAdminSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { admin: true },
  });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!session.admin) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Formats acceptés : PNG, JPG, WEBP, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (maximum 5 Mo)." },
        { status: 400 }
      );
    }

    const uploaded = await utapi.uploadFiles(file);

    if (uploaded.error) {
      return NextResponse.json({ error: "Échec de l'upload." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploaded.data?.ufsUrl,
      key: uploaded.data?.key,
    });
  } catch (error) {
    console.error("[upload-logo]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
