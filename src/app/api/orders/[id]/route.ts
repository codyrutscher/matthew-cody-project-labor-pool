import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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

  const { data: order, error } = await supabase
    .schema("catering")
    .from("Order")
    .select(`
      *,
      Menu:menuId (*, CuisineType:cuisineTypeId (*)),
      OrderItem (*),
      RSVP (*, User:userId (name, email))
    `)
    .eq("id", id)
    .eq("officeId", session.user.officeId)
    .single();

  if (error || !order) {
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

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.rsvpDeadline) updateData.rsvpDeadline = data.rsvpDeadline;

    const { data: order, error } = await supabase
      .schema("catering")
      .from("Order")
      .update(updateData)
      .eq("id", id)
      .eq("officeId", session.user.officeId)
      .select()
      .single();

    if (error || !order) {
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
