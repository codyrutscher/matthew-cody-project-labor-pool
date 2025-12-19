import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { rsvpToken: token },
    include: {
      office: { select: { name: true } },
      menu: {
        include: {
          cuisineType: true,
          culturalCelebration: true,
          items: { where: { available: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Invalid RSVP link" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    rsvpDeadline: order.rsvpDeadline,
    menu: order.menu,
    office: order.office,
  });
}

const rsvpSchema = z.object({
  selectedItems: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().min(1),
    })
  ),
  dietaryNotes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  const { token } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to submit RSVP" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { rsvpToken: token },
  });

  if (!order) {
    return NextResponse.json({ error: "Invalid RSVP link" }, { status: 404 });
  }

  if (order.status !== "RSVP_OPEN") {
    return NextResponse.json({ error: "RSVP is not open" }, { status: 400 });
  }

  if (order.rsvpDeadline && new Date(order.rsvpDeadline) < new Date()) {
    return NextResponse.json({ error: "RSVP deadline has passed" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { selectedItems, dietaryNotes } = rsvpSchema.parse(body);

    const rsvp = await prisma.rSVP.upsert({
      where: {
        orderId_userId: {
          orderId: order.id,
          userId: session.user.id,
        },
      },
      update: {
        selectedItems,
        dietaryNotes,
        submittedAt: new Date(),
      },
      create: {
        orderId: order.id,
        userId: session.user.id,
        selectedItems,
        dietaryNotes,
      },
    });

    return NextResponse.json(rsvp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}
