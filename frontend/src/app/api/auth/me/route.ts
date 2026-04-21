import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_KEY as string);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ userInfo: null }, { status: 200 });
    }

    let payload: { userId?: number; isAdmin?: boolean };
    try {
      const result = await jwtVerify(token, secret);
      payload = result.payload as { userId?: number; isAdmin?: boolean };
    } catch {
      // Token invalid or expired — clear the cookie
      const response = NextResponse.json({ userInfo: null }, { status: 200 });
      response.cookies.delete("access_token");
      return response;
    }

    const { userId, isAdmin } = payload;

    // Admin tokens don't have a user record
    if (isAdmin) {
      return NextResponse.json({ userInfo: null }, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ userInfo: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      const response = NextResponse.json({ userInfo: null }, { status: 200 });
      response.cookies.delete("access_token");
      return response;
    }

    return NextResponse.json({ userInfo: user }, { status: 200 });
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
