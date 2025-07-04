import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed

const prisma = new PrismaClient();

// GET /api/loans -貸借記録一覧取得
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const loans = await prisma.loan.findMany({
      where: {
        OR: [
          { lenderId: userId },
          { borrowerId: userId },
        ],
      },
      include: {
        lender: {
          select: { id: true, name: true, image: true, displayName: true, username: true },
        },
        borrower: {
          select: { id: true, name: true, image: true, displayName: true, username: true },
        },
        repayments: true,
        evidence: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Error fetching loans' }, { status: 500 });
  }
}

// POST /api/loans - 新規貸借記録作成
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;

  try {
    const body = await request.json();
    const {
      lenderId, // This should be the ID of the user who is lending the money
      borrowerId, // This should be the ID of the user who is borrowing the money
      amount,
      currency = 'JPY',
      loanDate,
      dueDate,
      description,
    } = body;

    // Basic validation
    if (!lenderId || !borrowerId || !amount || !loanDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (lenderId !== currentUserId && borrowerId !== currentUserId) {
        return NextResponse.json({ error: 'Current user must be either the lender or the borrower.' }, { status: 403 });
    }

    // Ensure amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const newLoan = await prisma.loan.create({
      data: {
        lenderId,
        borrowerId,
        amount: numericAmount,
        currency,
        loanDate: new Date(loanDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        status: 'ACTIVE', // Default status
      },
      include: {
        lender: { select: { id: true, name: true, image: true, displayName: true, username: true } },
        borrower: { select: { id: true, name: true, image: true, displayName: true, username: true } },
      }
    });

    return NextResponse.json(newLoan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    // Consider more specific error messages based on prisma errors if necessary
    return NextResponse.json({ error: 'Error creating loan' }, { status: 500 });
  }
}
