/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Page } from "puppeteer";

interface Flight {
  airlineLogo: string;
  departureTime: string;
  arrivalTime: string;
  flightDuration: string;
  airlineName: string;
  price: number;
}

export const startFlightScraping = async (page: Page): Promise<Flight[]> => {
  // Google Flights does client-side route transitions. Wait for a stable DOM and retry on navigation races.
  await page.waitForSelector("body", { timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await scrapeGoogleFlights(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Execution context was destroyed") || attempt === 2) {
        throw error;
      }
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return [];
};

const scrapeGoogleFlights = async (page: Page): Promise<Flight[]> => {
  return await page.evaluate(async (): Promise<Flight[]> => {
    await new Promise((resolve) => setTimeout(resolve, 7000));

    const flights: Flight[] = [];
    const seen = new Set<string>();
    const candidates = Array.from(
      document.querySelectorAll("li, div, section, article")
    ).filter((el) => {
      const text = ((el as HTMLElement).innerText || "").replace(/\s+/g, " ").trim();
      if (!text) return false;
      if (text.length < 40 || text.length > 650) return false;
      const timePattern = /\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi;
      const hasTimes = (text.match(timePattern) || []).length >= 2;
      const hasPrice = /(?:₹|€|£|\$|AED|INR)\s?[\d,]+/i.test(text);
      return hasTimes && hasPrice;
    });

    for (const node of candidates) {
      const text = ((node as HTMLElement).innerText || "").replace(/\s+/g, " ").trim();
      const times = text.match(/\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi) || [];
      const priceMatch = text.match(/(?:₹|€|£|\$|AED|INR)\s?[\d,]+/i);
      if (times.length < 2 || !priceMatch) continue;

      const price = parseInt(priceMatch[0].replace(/[^\d]/g, ""), 10);
      if (!price || Number.isNaN(price) || price < 20) continue;

      const airlineMatch = text.match(
        /\b([A-Za-z][A-Za-z\s&.-]{2,45}(?:Airlines?|Airways|Air|Express|Jet|Emirates|Qatar|Etihad|Lufthansa|British Airways|Turkish|IndiGo|SpiceJet|Vistara|Akasa))\b/i
      );
      const durationMatch =
        text.match(/\b\d+\s?hr(?:s)?\s?\d*\s?min?\b/i) ||
        text.match(/\b\d+h(?:\s?\d+m)?\b/i);
      const logo =
        (node.querySelector("img") as HTMLImageElement | null)?.src?.trim() || "";

      const key = `${times[0]}-${times[1]}-${price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      flights.push({
        airlineLogo: logo,
        departureTime: times[0] ?? "",
        arrivalTime: times[1] ?? "",
        flightDuration: durationMatch?.[0] ?? "",
        airlineName: airlineMatch?.[0] ?? "Google Flight",
        price,
      });

      if (flights.length >= 40) break;
    }

    return flights;
  });
};
