import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.officeId || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent deleting yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Get user to check role
  const { data: user, error: findError } = await supabase
    .schema("catering")
    .from("User")
    .select("id, role")
    .eq("id", id)
    .eq("officeId", session.user.officeId)
    .single();

  if (findError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent deleting managers
  if (user.role === "MANAGER") {
    return NextResponse.json({ error: "Cannot remove managers" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .schema("catering")
    .from("User")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Delete user error:", deleteError);
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
