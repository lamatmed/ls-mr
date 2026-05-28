import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, address, contact, nif, currency, logo } = body;

    const data: Record<string, string | null> = {
      name: name || '',
      address: address || '',
      contact: contact || '',
      nif: nif || null,
      currency: currency || 'MRU',
    };
    if (logo !== undefined) data.logo = logo;

    await prisma.company.upsert({
      where: { id: '1' },
      update: data,
      create: { id: '1', ...data },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[PUT /api/company]', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
