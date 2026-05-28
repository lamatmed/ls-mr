import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ message: "Non connecté" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nom: true, admin: true },
    });

    if (!user) {
      // Cookie obsolète (ancienne DB) — on efface la session
      const res = NextResponse.json({ message: "Session expirée" }, { status: 401 });
      res.cookies.set("userId", "", { path: "/", maxAge: 0, httpOnly: true });
      res.cookies.set("isAdmin", "", { path: "/", maxAge: 0, httpOnly: true });
      return res;
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
