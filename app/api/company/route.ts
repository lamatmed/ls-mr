import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, address, contact, nif, currency, logo } = body;

    const base = {
      name: (name || '') as string,
      address: (address || '') as string,
      contact: (contact || '') as string,
      nif: (nif || null) as string | null,
      currency: (currency || 'MRU') as string,
      ...(logo !== undefined ? { logo: logo as string | null } : {}),
    };

    await prisma.company.upsert({
      where: { id: '1' },
      update: base,
      create: { id: '1', ...base },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[PUT /api/company]', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
