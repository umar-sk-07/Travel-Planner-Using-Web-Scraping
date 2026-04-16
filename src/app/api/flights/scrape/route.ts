import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { importQueue } from "@/lib/queue";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = (searchParams.get("source") || "").trim();
    const destination = (searchParams.get("destination") || "").trim();
    const date = searchParams.get("date");
    if (!source || !destination) {
      return NextResponse.json(
        { message: "Source and destination are required." },
        { status: 400 }
      );
    }

    const normalizedSource = normalizeToPrimaryAirport(source);
    const normalizedDestination = normalizeToPrimaryAirport(destination);

    const existingFlights = await prisma.flights.findMany({
      where: {
        from: normalizedSource,
        to: normalizedDestination,
      },
      orderBy: { scrappedOn: "desc" },
      take: 25,
    });

    if (existingFlights.length > 0) {
      return NextResponse.json(
        {
          msg: "Using cached flights",
          status: true,
          cached: true,
          flights: existingFlights,
        },
        { status: 200 }
      );
    }

    const googleFlightsUrl = `https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&q=${encodeURIComponent(
      `Flights from ${normalizedSource} to ${normalizedDestination} on ${date ?? ""} one way`
    )}`;
    const response = await prisma.jobs.create({
      data: {
        url: googleFlightsUrl,
        jobType: {
          type: "flight",
          source: normalizedSource,
          destination: normalizedDestination,
          date,
          sourceSite: "google-flights",
        },
      },
    });
    await importQueue.add("new location", {
      url: googleFlightsUrl,
      jobType: {
        type: "flight",
        source: normalizedSource,
        destination: normalizedDestination,
        date,
        sourceSite: "google-flights",
      },
      id: response.id,
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
  }
  return NextResponse.json(
    { message: "An unexpected error occurred." },
    { status: 500 }
  );
}

function normalizeToPrimaryAirport(code: string): string {
  const value = code.toUpperCase();
  const metroToAirport: Record<string, string> = {
    PAR: "CDG",
    LON: "LHR",
    NYC: "JFK",
    TYO: "HND",
    SEL: "ICN",
    ROM: "FCO",
  };
  return metroToAirport[value] ?? value;
}
