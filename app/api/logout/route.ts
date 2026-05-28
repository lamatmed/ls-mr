import { NextResponse } from "next/server";

export const POST = async () => {
  const res = NextResponse.json({ message: "Déconnexion réussie" }, { status: 200 });
  res.cookies.set("userId", "", { path: "/", maxAge: 0, httpOnly: true });
  res.cookies.set("isAdmin", "", { path: "/", maxAge: 0, httpOnly: true });
  return res;
};
