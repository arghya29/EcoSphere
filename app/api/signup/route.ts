import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password, organizationName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with that email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user, their organization, and the owner membership atomically.
    // These were previously separate writes: if the membership insert failed
    // after the user + organization were created, the account was left with no
    // membership, so requireOrg() would 404 and the user could neither use the
    // app nor re-register (their email already exists). A transaction rolls the
    // whole thing back on any failure.
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          organizations: {
            create: { name: organizationName },
          },
        },
        include: { organizations: true },
      });

      const org = createdUser.organizations[0];
      await tx.membership.create({
        data: { userId: createdUser.id, organizationId: org.id, role: 'OWNER' },
      });

      return createdUser;
    });

    await logAudit({
      actor: user.id,
      action: 'SIGNUP',
      entity: 'User',
      entityId: user.id,
      orgId: user.organizations[0]?.id || '',
      metadata: { name: user.name, email: user.email },
    });

    return NextResponse.json(
      { success: true, data: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (err) {
    // A concurrent signup with the same email can pass the findUnique check
    // above and then lose the race on the unique email constraint. Map that to
    // the same 409 as the pre-check rather than a generic 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'An account with that email already exists.' },
        { status: 409 }
      );
    }
    console.error('Signup error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
