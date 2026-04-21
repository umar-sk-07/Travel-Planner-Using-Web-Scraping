"use server";
import { NextResponse } from "next/server";
import { jwtVerify, decodeJwt } from "jose";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const secret = new TextEncoder().encode(process.env.JWT_KEY as string);

  try {
    // If it's not the login page
    if (!request.url.includes("/login")) {
      const token = request.cookies.get("access_token")?.value;
      
      // Log token for debugging
      console.log("Token:", token);

      if (token) {
        try {
          // Verify the token (await needed)
          const { payload } = await jwtVerify(token, secret);
          console.log("Verified token:", payload);

          // Decode the token and check if the user is admin
          const { isAdmin } = decodeJwt(token);
          if (isAdmin) {
            return NextResponse.next();
          } else {
            return NextResponse.redirect(new URL("/?msg='Not Admin'", request.url));
          }
        } catch (verifyError) {
          // Handle JWT verification errors
          console.error("JWT Verification Error:", verifyError);
          return NextResponse.redirect(new URL("/login?msg='Invalid or expired JWT'", request.url));
        }
      } else {
        // No token in cookies
        console.log("No access_token cookie found");
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    } else {
      // If it's the login page
      return NextResponse.next();
    }
  } catch (err) {
    console.error("Middleware Error:", err);

    if (err instanceof Error && err.name === "JWTExpired") {
      return NextResponse.redirect(new URL("/login?msg='JWT Expired'", request.url));
    }

    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
