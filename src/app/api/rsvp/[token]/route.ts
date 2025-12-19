import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: order, error } = await supabase
    
    .from("Order")
    .select(`
      id, status, rsvpDeadline,
      Office:officeId (name),
      Menu:menuId (
        *,
        CuisineType:cuisineTypeId (*),
        CulturalCelebration:culturalCelebrationId (*),
        MenuItem (*)
      )
    `)
    .eq("rsvpToken", token)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Invalid RSVP link" }, { status: 404 });
  }

  // Filter available menu items
  const menu = order.Menu as { MenuItem?: { available: boolean }[]; items?: { available: boolean }[] } | null;
  if (menu && menu.MenuItem) {
    menu.items = menu.MenuItem.filter((item: { available: boolean }) => item.available);
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    rsvpDeadline: order.rsvpDeadline,
    menu: order.Menu,
    office: order.Office,
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

  const { data: order, error: orderError } = await supabase
    
    .from("Order")
    .select("id, status, rsvpDeadline")
    .eq("rsvpToken", token)
    .single();

  if (orderError || !order) {
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

    // Check if RSVP exists
    const { data: existingRsvp } = await supabase
      
      .from("RSVP")
      .select("id")
      .eq("orderId", order.id)
      .eq("userId", session.user.id)
      .single();

    let rsvp;
    if (existingRsvp) {
      // Update existing RSVP
      const { data, error } = await supabase
        
        .from("RSVP")
        .update({
          selectedItems,
          dietaryNotes,
          submittedAt: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id)
        .select()
        .single();

      if (error) throw error;
      rsvp = data;
    } else {
      // Create new RSVP
      const { data, error } = await supabase
        .from("RSVP")
        .insert({
          id: randomUUID(),
          orderId: order.id,
          userId: session.user.id,
          selectedItems,
          dietaryNotes,
        })
        .select()
        .single();

      if (error) throw error;
      rsvp = data;
    }

    return NextResponse.json(rsvp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}
