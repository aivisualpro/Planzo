import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import VidaUser from "@/lib/models/VidaUser";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    await connectToDatabase();
    
    // In a real app, you would hash and compare passwords.
    // For now, we find the user by email.
    const user = await VidaUser.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Assuming password check passes for now since user didn't specify password hashing logic yet
    // and the original code just checked email.
    
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.AppRole || "Manager",
      avatar: user.profilePicture || "/logo.png",
    };

    await login(userData);

    return NextResponse.json({ success: true, user: userData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
