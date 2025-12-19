import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const office = await prisma.office.findUnique({
    where: { id: session.user.officeId },
    include: { subscription: true },
  });

  return NextResponse.json(office);
}

const updateOfficeSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  budgetLimit: z.number().nullable().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cateringMaterials: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateOfficeSchema.parse(body);

    const office = await prisma.office.update({
      where: { id: session.user.officeId },
      data,
    });

    return NextResponse.json(office);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Update office error:", error);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}
