import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const POST = async () => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Déjà déconnecté." }, { status: 200 });
  }

  const res = NextResponse.json({ message: "Déconnexion réussie." }, { status: 200 });
  res.cookies.set("userId", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "strict" });
  res.cookies.set("isAdmin", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "strict" });
  return res;
};
