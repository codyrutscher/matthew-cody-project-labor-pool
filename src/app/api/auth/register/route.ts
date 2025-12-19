import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  officeName: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, officeName } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const office = await prisma.office.create({
      data: {
        name: officeName,
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: "MANAGER",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({
      message: "Registration successful",
      officeId: office.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
