import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      cuisineType: true,
      culturalCelebration: true,
      items: { where: { available: true }, orderBy: { name: "asc" } },
    },
  });

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  return NextResponse.json(menu);
}
