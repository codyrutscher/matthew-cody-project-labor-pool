import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum(["DRAFT", "RSVP_OPEN", "RSVP_CLOSED", "CONFIRMED", "DELIVERED"]).optional(),
  rsvpDeadline: z.string().datetime().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findFirst({
    where: { id, officeId: session.user.officeId },
    include: {
      menu: { include: { cuisineType: true } },
      items: true,
      rsvps: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateOrderSchema.parse(body);

    const order = await prisma.order.updateMany({
      where: { id, officeId: session.user.officeId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.rsvpDeadline && { rsvpDeadline: new Date(data.rsvpDeadline) }),
      },
    });

    if (order.count === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
