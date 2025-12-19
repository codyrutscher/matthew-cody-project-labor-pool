import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: menu, error } = await supabase
    .schema("catering")
    .from("Menu")
    .select(`
      *,
      CuisineType:cuisineTypeId (*),
      CulturalCelebration:culturalCelebrationId (*),
      MenuItem (*)
    `)
    .eq("id", id)
    .single();

  if (error || !menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  // Filter available items
  const availableItems = menu.MenuItem?.filter((item: { available: boolean }) => item.available) || [];
  
  return NextResponse.json({
    ...menu,
    items: availableItems,
  });
}
