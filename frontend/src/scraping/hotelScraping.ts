/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Page } from "puppeteer";

interface Hotel {
  title: string;
  price: number;
  photo: string;
}

export const startHotelScraping = async (
  page: Page,
  location: string
): Promise<Hotel[]> => {
  const hotelSearchUrl = `https://www.yatra.com/hotels?city.name=${encodeURIComponent(location)}`;
  await page.goto(hotelSearchUrl, {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector("body", { timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Try to type and submit location if Yatra redirects to base page.
  const inputSelectors = [
    "input[placeholder*='City']",
    "input[placeholder*='Location']",
    "input[placeholder*='Hotel Name']",
    "input[type='text']",
  ];

  for (const selector of inputSelectors) {
    const inputHandle = await page.$(selector);
    if (!inputHandle) continue;
    try {
      await page.click(selector, { clickCount: 3 });
      await page.type(selector, location, { delay: 60 });
      await page.keyboard.press("Enter");
      await new Promise((resolve) => setTimeout(resolve, 4000));
      break;
    } catch {
      // Continue trying with the next selector.
    }
  }

  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await new Promise((resolve) => setTimeout(resolve, 2500));

  return page.evaluate((): Hotel[] => {
    const seen = new Set<string>();
    const hotels: Hotel[] = [];
    const cardCandidates = Array.from(
      document.querySelectorAll("article, section, li, div")
    );
    const skipWords = [
      "offer",
      "offers",
      "view details",
      "recommended hotels",
      "special hotel offers",
      "login",
      "signup",
      "search",
      "support",
      "holiday",
      "bus",
      "trains",
      "flight",
    ];

    for (const card of cardCandidates) {
      const text = ((card as HTMLElement).innerText || "")
        .replace(/\s+/g, " ")
        .trim();

      if (!text || !/₹\s?[\d,]+/.test(text)) continue;
      if (text.length > 280) continue;
      if (skipWords.some((word) => text.toLowerCase().includes(word))) continue;
      if (!/\boff\b/i.test(text) && !/\bhotel\b/i.test(text) && !/\bresort\b/i.test(text)) {
        continue;
      }

      const title =
        (
          (card.querySelector("h1, h2, h3, h4, .hotel-name, [class*='hotel']") as HTMLElement | null)
            ?.innerText || ""
        )
          .replace(/\s+/g, " ")
          .trim() ||
        text.split("₹")[0]?.trim() ||
        "";
      if (!title || title.length > 90 || /\d+%\s*off/i.test(title)) continue;

      const rawPrice = text.match(/₹\s?[\d,]+/)?.[0] ?? "";
      const price = parseInt(rawPrice.replace(/[^\d]/g, ""), 10);
      const imageCandidates = Array.from(
        card.querySelectorAll("img")
      ) as HTMLImageElement[];
      let photo = "";
      for (const img of imageCandidates) {
        const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
        const parsedSrcset = srcset
          .split(",")
          .map((item) => item.trim().split(" ")[0])
          .filter(Boolean);
        const src =
          img.getAttribute("src") ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-original") ||
          parsedSrcset[parsedSrcset.length - 1] ||
          "";
        const candidate = src.trim();
        if (!candidate) continue;
        if (/logo|icon|sprite|placeholder/i.test(candidate)) continue;
        const width = Number(img.getAttribute("width") || "0");
        const height = Number(img.getAttribute("height") || "0");
        if ((width > 0 && width < 120) || (height > 0 && height < 90)) continue;
        photo = candidate;
        break;
      }

      if (!price || Number.isNaN(price) || price < 500) continue;
      if (!photo) continue;

      const key = `${title.toLowerCase()}-${price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      hotels.push({
        title,
        price,
        photo,
      });

      if (hotels.length >= 40) break;
    }

    return hotels;
  });
};
