import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId  } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireUserId ();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(debts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserId ();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactName, direction, principal, currency, dueDate, note } = body;

    if (!contactName || !principal || !direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ищем существующий контакт пользователя или создаем новый
    let contact = await prisma.contact.findFirst({
      where: { userId: user.id, name: contactName },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: user.id,
          name: contactName,
        },
      });
    }

    const amountDecimal = parseFloat(principal);

    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        direction, // 'I_OWE' | 'OWED_TO_ME'
        principal: amountDecimal,
        remaining: amountDecimal,
        currency: currency || 'USD',
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note || null,
      },
      include: { contact: true },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
  }
}