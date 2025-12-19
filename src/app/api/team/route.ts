import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: members, error } = await supabase
    
    .from("User")
    .select("id, name, email, role")
    .eq("officeId", session.user.officeId)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Failed to get team" }, { status: 500 });
  }

  return NextResponse.json(members);
}

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email } = inviteSchema.parse(body);

    // Check if user exists
    const { data: existing } = await supabase
      
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Create user with temporary password (they'll need to reset)
    const tempPassword = randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const now = new Date().toISOString();
    const { data: user, error } = await supabase
      .from("User")
      .insert({
        id: randomUUID(),
        email,
        password: hashedPassword,
        role: "STAFF",
        officeId: session.user.officeId,
        createdAt: now,
        updatedAt: now,
      })
      .select("id, email")
      .single();

    if (error) {
      console.error("Invite error:", error);
      return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
    }

    // TODO: Send invite email with password reset link

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
