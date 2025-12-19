import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await prisma.user.findMany({
    where: { officeId: session.user.officeId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email } = inviteSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Create user with temporary password (they'll need to reset)
    const tempPassword = randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "STAFF",
        officeId: session.user.officeId,
      },
    });

    // TODO: Send invite email with password reset link

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
