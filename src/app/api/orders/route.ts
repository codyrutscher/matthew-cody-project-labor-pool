import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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

    // Create order
    const { data: order, error: orderError } = await supabase
      .schema("catering")
      .from("Order")
      .insert({
        officeId: session.user.officeId,
        menuId,
        totalCost,
        rsvpToken,
        status: "DRAFT",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Create order error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item) => ({
      orderId: order.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .schema("catering")
      .from("OrderItem")
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error("Create order items error:", itemsError);
      // Rollback order
      await supabase.schema("catering").from("Order").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    return NextResponse.json({ ...order, items: createdItems });
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

  const { data: orders, error } = await supabase
    .schema("catering")
    .from("Order")
    .select(`
      *,
      Menu:menuId (*, CuisineType:cuisineTypeId (*)),
      OrderItem (*),
      RSVP (*)
    `)
    .eq("officeId", session.user.officeId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to get orders" }, { status: 500 });
  }

  return NextResponse.json(orders);
}
