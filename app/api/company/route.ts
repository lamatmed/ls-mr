import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getAdminSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { admin: true },
  });
}

function isValidLogoValue(val: unknown): val is string | null {
  if (val === null || val === '') return true;
  if (typeof val !== 'string') return false;
  try {
    const url = new URL(val);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session?.admin) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, address, contact, nif, currency, logo } = body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 });
    }

    if (logo !== undefined && !isValidLogoValue(logo)) {
      return NextResponse.json({ error: 'URL du logo invalide.' }, { status: 400 });
    }

    const base = {
      name: name.trim(),
      address: typeof address === 'string' ? address.trim() : '',
      contact: typeof contact === 'string' ? contact.trim() : '',
      nif: typeof nif === 'string' ? nif.trim() : null,
      currency: typeof currency === 'string' ? currency.trim() : 'MRU',
      ...(logo !== undefined ? { logo: (logo as string | null) || null } : {}),
    };

    await prisma.company.upsert({
      where: { id: '1' },
      update: base,
      create: { id: '1', ...base },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[PUT /api/company]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
