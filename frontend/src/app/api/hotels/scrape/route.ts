import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { importQueue } from "@/lib/queue";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = (searchParams.get("location") || "").trim();
    const normalizedLocation = location.toLowerCase();

    if (!location) {
      return NextResponse.json(
        { message: "Location is required." },
        { status: 400 }
      );
    }

    const existingHotels = await prisma.hotels.findMany({
      where: { location: normalizedLocation },
      orderBy: { scrappedOn: "desc" },
      take: 20,
    });

    if (existingHotels.length > 0) {
      return NextResponse.json(
        {
          msg: "Using cached hotels",
          status: true,
          cached: true,
          hotels: existingHotels,
        },
        { status: 200 }
      );
    }

    const url = `https://www.yatra.com/hotels?city.name=${encodeURIComponent(location)}`;
    const response = await prisma.jobs.create({
      data: { url, jobType: { type: "hotels", location, sourceSite: "yatra" } },
    });

    await importQueue.add("new location", {
      url,
      jobType: { type: "hotels", location, sourceSite: "yatra" },
      id: response.id,
      location,
    });

    return NextResponse.json(
      { msg: "Job Running", id: response.id, status: false, cached: false },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
