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
  return await page.evaluate(async (): Promise<Flight[]> => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const flights: Flight[] = [];

    const flightSelectors = document.querySelectorAll(".nrc6-wrapper");

    flightSelectors.forEach((flightElement) => {
      const airlineLogo = flightElement.querySelector("img")?.src || "";
      const [rawDepartureTime, rawArrivalTime] = (
        flightElement.querySelector(".vmXl")?.innerText || ""
      ).split(" – ");

      // Function to extract time and remove numeric values at the end
      const extractTime = (rawTime: string): string => {
        const timeWithoutNumbers = rawTime.replace(/[0-9+\s]+$/, "").trim();
        return timeWithoutNumbers;
      };

      const departureTime = extractTime(rawDepartureTime);
      const arrivalTime = extractTime(rawArrivalTime);
      const flightDuration = (
        flightElement.querySelector(".xdW8")?.children[0]?.innerText || ""
      ).trim();

      const airlineName = (
        flightElement.querySelector(".VY2U")?.children[1]?.innerText || ""
      ).trim();

      // Extract price — Kayak obfuscates class names, so try multiple approaches
      const priceSelectors = [
        ".f8F1-price-text",
        "[class*='price-text']",
        "[class*='Price']",
        "[class*='price']",
        ".oVHK",
        ".Iqt3",
      ];
      let rawPrice = "";
      for (const sel of priceSelectors) {
        const el = flightElement.querySelector(sel) as HTMLElement | null;
        if (el?.innerText) { rawPrice = el.innerText; break; }
      }
      // Fallback: find any element whose text looks like a price (e.g. "$1,234" or "1,234")
      if (!rawPrice) {
        const allEls = flightElement.querySelectorAll("*");
        for (const el of allEls) {
          const text = (el as HTMLElement).innerText?.trim() || "";
          // Match things like "$1,234" "₹12,345" "1,234" (3-5 digit numbers, possibly with commas)
          if (/^[\$₹€£¥,\d\s]+$/.test(text) && /\d{3,}/.test(text) && text.length < 12) {
            rawPrice = text;
            break;
          }
        }
      }
      const price = parseInt(rawPrice.replace(/[^\d]/g, "").trim(), 10) || 0;

      // Skip flights with no valid price or airline name
      if (!price || !airlineName) return;

      flights.push({
        airlineLogo,
        departureTime,
        arrivalTime,
        flightDuration,
        airlineName,
        price,
      });
    });

    return flights;
  });
};
