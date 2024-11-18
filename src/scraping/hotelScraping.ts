/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Browser, Page } from "puppeteer";

export const startHotelScraping = async (
  page: Page,
  browser: Browser,
  location: string
) => {
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("Page Viewport set.");

  await page.waitForSelector(".NhpT-mod-radius-base");
  console.log("Wait for selector complete.");
  
  await page.type(".NhpT-mod-radius-base:nth-child(2)", location);
  console.log("Page location typing complete.");
  
  const liSelector = "ul.EMAt li:first-child";
  await page.waitForSelector(liSelector);
  console.log("Page li selector complete.");
  
  await page.click(liSelector);
  console.log("Page li click complete.");

  // Select the start date
  const startDateSelector = ".vn3g.vn3g-t-selected-start";
  await page.waitForSelector(startDateSelector);
  await page.click(startDateSelector);
  console.log("Start date selected.");

  // Select the end date
  const endDateSelector = ".vn3g.vn3g-t-selected-end";
  await page.waitForSelector(endDateSelector);
  await page.click(endDateSelector);
  console.log("End date selected.");

  const buttonSelector = "#main-search-form button[type='submit']";
  await page.waitForSelector(buttonSelector);
  console.log("Page button selector complete.");

  // Wait for the new page to open after clicking the submit button
  const [target] = await Promise.all([
    new Promise((resolve) => browser.once("targetcreated", resolve)),
    await page.click(buttonSelector),
  ]);

  const newPage = await target.page();
  await newPage.bringToFront();
  console.log("New Page Opened.");

  // Wait for the hotels section to be visible
  await newPage.waitForSelector(".yuAt");
  console.log("Waiting for hotel listings to load...");

  // Optionally, you can scroll to ensure all hotels are loaded
  await newPage.evaluate(async () => {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        window.scrollBy(0, window.innerHeight);
        if (document.querySelectorAll(".yuAt").length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 2000); // Scroll every 2 seconds
    });
  });
  console.log("Scrolled down to load additional hotels.");

  console.log("Starting scraping evaluation.");

  // Attempt to scrape hotels, retrying if necessary
  for (let attempt = 0; attempt < 3; attempt++) {
    const hotels = await newPage.evaluate(() => {
      const hotels = [];
      const selectors = document.querySelectorAll(".yuAt");
      selectors.forEach((selector) => {
        const title =
          selector.querySelector(".FLpo-hotel-name")?.innerText ||
          selector.querySelector(".FLpo-big-name")?.innerText ||
          "";

        const price = parseInt(
          (selector.querySelector(".c1XBO")?.innerText || "").replace(/[^\d]/g, "").trim(),
          10
        );

        const photo = selector.querySelector(".e9fk-photo img")?.src || "";
        if (title && price && photo) hotels.push({ title, price, photo });
      });
      return hotels;
    });

    if (hotels.length > 0) {
      return hotels; // Return the scraped hotels if found
    } else {
      console.log("No hotels found, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before retrying
    }
  }

  console.log("No hotels found after multiple attempts.");
  return []; // Return an empty array if no hotels are found
};

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const hotels = await prisma.hotels.findMany({
      orderBy: { scrappedOn: "desc" },
    });
    if (hotels.length > 0) {
      return NextResponse.json(
        {
          hotels,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ msg: "No hotels found." }, { status: 404 });
    }
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
