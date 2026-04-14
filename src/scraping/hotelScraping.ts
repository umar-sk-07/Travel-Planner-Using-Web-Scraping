import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Bright Data Booking Hotel Listings scraper
// dataset_id: gd_m5mbdl081229ln6t4a
// Docs: https://docs.brightdata.com/api-reference/rest-api/scraper

const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY!;
const DATASET_ID = "gd_m5mbdl081229ln6t4a";
const BASE_URL = "https://api.brightdata.com/datasets/v3";

interface BrightDataHotel {
  url?: string;
  hotel_id?: string;
  title?: string;
  location?: string;
  country?: string;
  city?: string;
  images?: string[];
  price?: number;
  review_score?: number;
  reviews_count?: number;
}

// Step 1: Trigger a scrape job for a Booking.com search URL
async function triggerScrape(location: string): Promise<string> {
  // Build a Booking.com search URL for the given location
  const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location)}&lang=en-us`;

  const res = await fetch(
    `${BASE_URL}/trigger?dataset_id=${DATASET_ID}&format=json&uncompressed_webhook=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url: searchUrl }]),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bright Data trigger failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const snapshotId: string = data.snapshot_id;
  console.log(`Bright Data snapshot triggered: ${snapshotId}`);
  return snapshotId;
}

// Step 2: Poll until the snapshot is ready (status: "ready" | "failed")
async function waitForSnapshot(
  snapshotId: string,
  maxWaitMs = 600_000,
  intervalMs = 10_000
): Promise<void> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/progress/${snapshotId}`, {
      headers: { Authorization: `Bearer ${BRIGHT_DATA_API_KEY}` },
    });

    if (!res.ok) {
      throw new Error(`Bright Data progress check failed: ${res.status}`);
    }

    const data = await res.json();
    console.log(`Snapshot ${snapshotId} status: ${data.status}`);

    if (data.status === "ready") return;
    if (data.status === "failed") throw new Error(`Snapshot ${snapshotId} failed`);

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Snapshot ${snapshotId} timed out after ${maxWaitMs}ms`);
}

// Step 3: Download the snapshot results
async function fetchSnapshot(snapshotId: string): Promise<BrightDataHotel[]> {
  const res = await fetch(`${BASE_URL}/snapshot/${snapshotId}?format=json`, {
    headers: { Authorization: `Bearer ${BRIGHT_DATA_API_KEY}` },
  });

  if (!res.ok) {
    throw new Error(`Bright Data snapshot fetch failed: ${res.status}`);
  }

  return res.json();
}

// Main export — replaces the old Puppeteer-based scraper
export const startHotelScraping = async (location: string) => {
  console.log(`Starting Bright Data hotel scrape for: ${location}`);

  const snapshotId = await triggerScrape(location);
  await waitForSnapshot(snapshotId);
  const raw = await fetchSnapshot(snapshotId);

  console.log(`Bright Data returned ${raw.length} hotels`);

  // Normalize to the shape the rest of the app expects
  const hotels = raw
    .filter((h) => h.title && h.price)
    .map((h) => ({
      title: h.title!,
      price: h.price!,
      photo: h.images?.[0] ?? "",
    }));

  return hotels;
};

// GET /api/hotels — returns stored hotels from DB
export async function GET() {
  try {
    const hotels = await prisma.hotels.findMany({
      orderBy: { scrappedOn: "desc" },
    });
    if (hotels.length > 0) {
      return NextResponse.json({ hotels }, { status: 200 });
    }
    return NextResponse.json({ msg: "No hotels found." }, { status: 404 });
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
