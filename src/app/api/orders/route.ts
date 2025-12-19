import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const createOrderSchema = z.object({
  menuId: z.string(),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().min(1),
    })
  ),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { menuId, items } = createOrderSchema.parse(body);

    const totalCost = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const rsvpToken = randomBytes(32).toString("hex");

    const order = await prisma.order.create({
      data: {
        officeId: session.user.officeId,
        menuId,
        totalCost,
        rsvpToken,
        status: "DRAFT",
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { officeId: session.user.officeId },
    include: {
      menu: { include: { cuisineType: true } },
      items: true,
      rsvps: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
