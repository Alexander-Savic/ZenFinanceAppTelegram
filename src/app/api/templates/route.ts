import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      include: { category: true, account: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { label, type, amount, currency, accountId, categoryId, iconKey } = body;

    if (!label || !amount) {
      return NextResponse.json({ error: 'Missing label or amount' }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        label,
        type: type || 'EXPENSE',
        amount: parseFloat(amount),
        currency: currency || 'USD',
        accountId: accountId || null,
        categoryId: categoryId || null,
        iconKey: iconKey || null,
      },
      include: { category: true, account: true },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}