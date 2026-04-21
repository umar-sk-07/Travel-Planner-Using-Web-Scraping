/**
 * Standalone BullMQ worker — runs independently from Next.js.
 * Build: npm run build
 * Run:   npm start  (or: node dist/worker.js)
 */

import { Worker, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { Browser } from "puppeteer";
import puppeteer from "puppeteer";

// ── Scraping imports (local to backend) ──────────────────────────────────────
import { startLocationScraping } from "./src/scraping/location-scraping";
import { startPackageScraping } from "./src/scraping/package-scraping";
import { startFlightScraping } from "./src/scraping/flightsScraping";
import { startHotelScraping } from "./src/scraping/hotelScraping";

// ── Config ────────────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const SBR_WS_ENDPOINT = process.env.SBR_WS_ENDPOINT!;

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();
const importQueue = new Queue("importQueue", { connection });

// ── Seed default admin if missing ─────────────────────────────────────────────
async function ensureAdmin() {
  const count = await prisma.admin.count();
  if (!count) {
    await prisma.admin.create({
      data: {
        email: "admin@hypedjourney.com",
        // SHA256 of "admin"
        password:
          "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
      },
    });
    console.log("[worker] Default admin created.");
  }
}

// ── Worker ────────────────────────────────────────────────────────────────────
async function startWorker() {
  await ensureAdmin();

  new Worker(
    "importQueue",
    async (job) => {
      let browser: Browser | undefined;
      try {
        browser = await puppeteer.connect({
          browserWSEndpoint: SBR_WS_ENDPOINT,
        });
        const page = await browser.newPage();

        // ── Location scraping ──────────────────────────────────────────────
        if (job.data.jobType.type === "location") {
          console.log("[worker] location → navigating to", job.data.url);
          await page.goto(job.data.url, { timeout: 60000 });
          console.log("[worker] Navigated! Scraping page content...");
          const packages = await startLocationScraping(page);

          await prisma.jobs.update({
            where: { id: job.data.id },
            data: { isComplete: true, status: "complete" },
          });

          for (const pkg of packages) {
            const existing = await prisma.jobs.findFirst({
              where: {
                url: `https://packages.yatra.com/holidays/intl/details.htm?packageId=${pkg?.id}`,
              },
            });
            if (!existing) {
              const created = await prisma.jobs.create({
                data: {
                  url: `https://packages.yatra.com/holidays/intl/details.htm?packageId=${pkg?.id}`,
                  jobType: { type: "package" },
                },
              });
              importQueue.add("package", { ...created, packageDetails: pkg });
            }
          }

          // ── Package scraping ─────────────────────────────────────────────
        } else if (job.data.jobType.type === "package") {
          const alreadyScraped = await prisma.trips.findUnique({
            where: { id: job.data.packageDetails.id },
          });
          if (!alreadyScraped) {
            console.log("[worker] package → navigating to", job.data.url);
            await page.goto(job.data.url, { timeout: 120000 });
            console.log("[worker] Navigated! Scraping page content...");
            const pkg = await startPackageScraping(page, job.data.packageDetails);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await prisma.trips.create({ data: pkg as any });
            await prisma.jobs.update({
              where: { id: job.data.id },
              data: { isComplete: true, status: "complete" },
            });
          }

          // ── Flight scraping ──────────────────────────────────────────────
        } else if (job.data.jobType.type === "flight") {
          console.log("[worker] flight → navigating to", job.data.url);
          await page.goto(job.data.url, {
            timeout: 120000,
            waitUntil: "domcontentloaded",
          });

          if (job.data.jobType.sourceSite === "google-flights") {
            const { source, destination, date } = job.data.jobType;
            const expectedRouteTokens = [
              source.toUpperCase(),
              destination.toUpperCase(),
            ];

            const routeReady = await page
              .waitForFunction(
                ({ tokens }: { tokens: string[] }) => {
                  const text = (
                    (document.body as HTMLElement)?.innerText || ""
                  ).toUpperCase();
                  return tokens.some((token: string) => text.includes(token));
                },
                { timeout: 20000 },
                { tokens: expectedRouteTokens }
              )
              .then(() => true)
              .catch(() => false);

            if (!routeReady) {
              const forcedUrl = `https://www.google.com/travel/flights?hl=en&gl=us&curr=USD&q=${encodeURIComponent(
                `Flights from ${source} to ${destination} on ${date} one way`
              )}`;
              console.log(
                "[worker] Google route state not ready, forcing URL:",
                forcedUrl
              );
              await page.goto(forcedUrl, {
                timeout: 120000,
                waitUntil: "domcontentloaded",
              });
              await new Promise((resolve) => setTimeout(resolve, 4000));
            }
          }

          console.log("[worker] Navigated! Scraping flights...");
          const flights = await startFlightScraping(page);
          console.log(`[worker] flights found: ${flights.length}`);

          if (!flights.length) {
            const title = await page.title();
            const bodySnippet = await page.evaluate(() =>
              ((document.body as HTMLElement)?.innerText || "")
                .replace(/\s+/g, " ")
                .slice(0, 220)
            );
            console.log("[worker] No flights. Page title:", title);
            console.log("[worker] Body snippet:", bodySnippet);
          }

          await prisma.jobs.update({
            where: { id: job.data.id },
            data: { isComplete: true, status: "complete" },
          });

          for (const flight of flights) {
            if (!flight.price || isNaN(flight.price)) continue;
            await prisma.flights.create({
              data: {
                name: flight.airlineName,
                logo: flight.airlineLogo,
                from: job.data.jobType.source,
                to: job.data.jobType.destination,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                duration: flight.flightDuration,
                price: flight.price,
                jobId: job.data.id,
              },
            });
          }

          // ── Hotel scraping ───────────────────────────────────────────────
        } else if (job.data.jobType.type === "hotels") {
          const location =
            job.data.jobType.location || job.data.location || "unknown";
          console.log("[worker] hotels → scraping for:", location);

          // Pass the already-connected page + location string
          const hotels = await startHotelScraping(page, String(location));
          console.log(`[worker] hotels found: ${hotels.length}`);

          await prisma.jobs.update({
            where: { id: job.data.id },
            data: { isComplete: true, status: "complete" },
          });

          for (const hotel of hotels) {
            try {
              await prisma.hotels.create({
                data: {
                  name: hotel.title,
                  image: hotel.photo,
                  price: hotel.price,
                  jobId: job.data.id,
                  location: String(location).toLowerCase(),
                },
              });
            } catch (err) {
              console.error(
                `[worker] failed to insert hotel ${hotel.title}:`,
                err
              );
            }
          }
        }
      } catch (error) {
        console.error("[worker] job error:", error);
        await prisma.jobs.update({
          where: { id: job.data.id },
          data: { isComplete: true, status: "failed" },
        });
      } finally {
        await browser?.close();
        console.log("[worker] browser closed.");
      }
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    }
  );

  console.log("[worker] BullMQ worker started, waiting for jobs...");
}

startWorker().catch((err) => {
  console.error("[worker] fatal startup error:", err);
  process.exit(1);
});
