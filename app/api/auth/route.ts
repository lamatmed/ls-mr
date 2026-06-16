import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nom: true, admin: true },
    });

    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 401 });
      res.cookies.set("userId", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "strict" });
      res.cookies.set("isAdmin", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "strict" });
      return res;
    }

    return NextResponse.json(
      { user: { ...user, role: user.admin ? "admin" : "user" } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
