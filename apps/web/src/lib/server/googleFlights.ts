import { chromium, type Page } from "playwright";

export type GoogleFlightsDestinationCode = "BOS" | "BTV";
export type GoogleFlightsOutboundDate = "2026-10-08" | "2026-10-09";
export type GoogleFlightsReturnDate = "2026-10-11" | "2026-10-12";

export type GoogleFlightsQuote = {
  destinationCode: GoogleFlightsDestinationCode;
  outboundDate: GoogleFlightsOutboundDate;
  returnDate: GoogleFlightsReturnDate;
  tripDays: number;
  googlePrice: number | null;
  status: "live" | "unavailable";
  note: string;
};

export type GoogleFlightsSnapshot = {
  source: "google-flights-date-grid";
  generatedAt: string;
  quotes: GoogleFlightsQuote[];
  note: string;
};

const searchConfig: Record<
  GoogleFlightsDestinationCode,
  { destinationQuery: string; destinationDisplay: string }
> = {
  BOS: {
    destinationQuery: "Boston",
    destinationDisplay: "Boston"
  },
  BTV: {
    destinationQuery: "Burlington Vermont",
    destinationDisplay: "Burlington"
  }
};

const tripPairs: Array<{
  outboundDate: GoogleFlightsOutboundDate;
  returnDate: GoogleFlightsReturnDate;
}> = [
  { outboundDate: "2026-10-08", returnDate: "2026-10-11" },
  { outboundDate: "2026-10-08", returnDate: "2026-10-12" },
  { outboundDate: "2026-10-09", returnDate: "2026-10-11" },
  { outboundDate: "2026-10-09", returnDate: "2026-10-12" }
];

function tripDays(outboundDate: string, returnDate: string) {
  const outbound = new Date(`${outboundDate}T12:00:00Z`);
  const inbound = new Date(`${returnDate}T12:00:00Z`);

  return Math.round((inbound.getTime() - outbound.getTime()) / (24 * 60 * 60 * 1000));
}

function parsePrice(text: string) {
  const match = text.match(/\$([0-9,]+)/);
  return match ? Number.parseInt(match[1].split(",").join(""), 10) : null;
}

async function selectDestination(page: Page, destinationQuery: string) {
  const destinationInput = page.getByRole("combobox", { name: "Where to?" });
  await destinationInput.click();
  await destinationInput.fill(destinationQuery);
  await page.waitForTimeout(1200);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
}

async function waitForDateGrid(page: Page) {
  await page.getByRole("button", { name: "Search" }).click();
  await page.waitForTimeout(1500);
  await page.locator('div[jsname="IfZY0b"]').waitFor({ timeout: 15000 });
  await page.locator('[data-iso="2026-10-08"]').waitFor({ timeout: 15000 });
}

async function getCurrentTripLength(page: Page) {
  const label = await page.locator('div[jsname="IfZY0b"] span.Rx4ADb').textContent();
  const match = label?.match(/(\d+)\s+day/);

  return match ? Number.parseInt(match[1], 10) : null;
}

async function setTripLength(page: Page, targetDays: number) {
  const previousButton = page.locator('div[jsname="IfZY0b"] button[data-delta="-1"]');
  const nextButton = page.locator('div[jsname="IfZY0b"] button[data-delta="1"]');

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const currentDays = await getCurrentTripLength(page);

    if (currentDays === targetDays) {
      return true;
    }

    if (currentDays === null) {
      return false;
    }

    if (currentDays > targetDays) {
      if ((await previousButton.count()) === 0) {
        return false;
      }

      await previousButton.click();
    } else {
      if ((await nextButton.count()) === 0) {
        return false;
      }

      await nextButton.click();
    }

    await page.waitForTimeout(350);
  }

  return false;
}

async function getGridPrice(page: Page, outboundDate: GoogleFlightsOutboundDate) {
  const locator = page.locator(`[data-iso="${outboundDate}"]`);

  if ((await locator.count()) === 0) {
    return null;
  }

  return parsePrice(await locator.first().innerText());
}

export async function scrapeGoogleFlightsSnapshot() {
  const browser = await chromium.launch({ headless: true });

  try {
    const quotes: GoogleFlightsQuote[] = [];

    for (const destinationCode of Object.keys(searchConfig) as GoogleFlightsDestinationCode[]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

      try {
        await page.goto("https://www.google.com/travel/flights?hl=en", {
          waitUntil: "domcontentloaded"
        });
        await selectDestination(page, searchConfig[destinationCode].destinationQuery);
        await waitForDateGrid(page);

        for (const pair of tripPairs) {
          const days = tripDays(pair.outboundDate, pair.returnDate);
          const tripLengthReady = await setTripLength(page, days);
          const googlePrice = tripLengthReady ? await getGridPrice(page, pair.outboundDate) : null;

          quotes.push({
            destinationCode,
            outboundDate: pair.outboundDate,
            returnDate: pair.returnDate,
            tripDays: days,
            googlePrice,
            status: googlePrice === null ? "unavailable" : "live",
            note:
              googlePrice === null
                ? `Google did not expose a visible ${days}-day date-grid fare for ${searchConfig[destinationCode].destinationDisplay} on ${pair.outboundDate} during this scrape.`
                : `Google date-grid fare for a ${days}-day trip from Seattle to ${searchConfig[destinationCode].destinationDisplay}.`
          });
        }
      } finally {
        await page.close();
      }
    }

    return {
      source: "google-flights-date-grid" as const,
      generatedAt: new Date().toISOString(),
      quotes,
      note: "On-demand local browser scrape of Google Flights date-grid pricing. This is not background monitoring and Google may omit some far-out dates."
    };
  } finally {
    await browser.close();
  }
}
