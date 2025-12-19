import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  officeName: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, officeName } = registerSchema.parse(body);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const officeId = randomUUID();
    const userId = randomUUID();
    const now = new Date().toISOString();

    // Create office
    const { data: office, error: officeError } = await supabase
      .from("Office")
      .insert({
        id: officeId,
        name: officeName,
        timezone: "America/New_York",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (officeError) {
      console.error("Office creation error:", officeError);
      return NextResponse.json({ error: "Failed to create office" }, { status: 500 });
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        id: userId,
        name,
        email,
        password: hashedPassword,
        role: "MANAGER",
        officeId: office.id,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (userError) {
      console.error("User creation error:", userError);
      // Rollback office creation
      await supabase.from("Office").delete().eq("id", office.id);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Registration successful",
      officeId: office.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
