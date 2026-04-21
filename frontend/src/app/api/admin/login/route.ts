import { NextResponse } from "next/server";
import { prisma } from "@/lib";
import { SignJWT } from "jose";
import { SHA256 as sha256 } from "crypto-js";

const alg = "HS256";
const secret = new TextEncoder().encode(process.env.JWT_KEY as string);

// Create JWT token function
const createToken = async (email: string, userId: number) => {
  return await new SignJWT({ email, userId, isAdmin: true })
    .setProtectedHeader({ alg })
    .setExpirationTime("48h")
    .sign(secret);
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and Password are required." },
        { status: 400 }
      );
    }

    // Find user in the database with hashed password
    const user = await prisma.admin.findUnique({
      where: { email, password: sha256(password).toString() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid Email or Password." },
        { status: 404 }
      );
    } else {
      // Create JWT token
      const token = await createToken(user.email, user.id);

      // Create a response and set the token as a cookie
      const response = NextResponse.json({
        userInfo: {
          id: user.id,
          email: user.email,
        },
      });

      // Set the access token cookie using the NextResponse `cookies.set()` method
      response.cookies.set("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Set this to true in production
        sameSite: "lax", // Adjust sameSite attribute based on your needs
        maxAge: 60 * 60 * 48, // 48 hours in seconds
        path: "/", // Path where cookie is valid
      });

      return response;
    }
  } catch (error) {
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
