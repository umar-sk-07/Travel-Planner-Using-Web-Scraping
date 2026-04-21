import { NextResponse } from "next/server";
import { SHA256 as sha256 } from "crypto-js";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const secret = new TextEncoder().encode(process.env.JWT_KEY as string);
const alg = "HS256";

const createToken = async (email: string, userId: number) => {
  return await new SignJWT({ email, userId, isAdmin: false })
    .setProtectedHeader({ alg })
    .setExpirationTime("48h")
    .sign(secret);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email, password: sha256(password).toString() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createToken(user.email, user.id);

    const response = NextResponse.json(
      {
        userInfo: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 200 }
    );

    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 48, // 48 hours
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
