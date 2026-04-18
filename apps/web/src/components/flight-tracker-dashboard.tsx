"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";

type TripId =
  | "delta-08-11"
  | "united-08-11"
  | "alaska-08-12"
  | "american-08-12"
  | "delta-09-11"
  | "jetblue-09-11"
  | "united-09-12"
  | "american-09-12"
  | "delta-bos-08-11"
  | "alaska-bos-08-12"
  | "jetblue-bos-09-11"
  | "delta-bos-09-12";

type OutboundDate = "2026-10-08" | "2026-10-09";
type ReturnDate = "2026-10-11" | "2026-10-12";
type DestinationCode = "BTV" | "BOS";
type SortMode = "best" | "price" | "duration" | "recent";

type TrackedFlight = {
  id: TripId;
  airline: string;
  destinationCode: DestinationCode;
  destinationLabel: string;
  outboundDate: OutboundDate;
  returnDate: ReturnDate;
  outboundLabel: string;
  returnLabel: string;
  outboundTimes: string;
  returnTimes: string;
  route: string;
  stops: number;
  durationMinutes: number;
  price: number;
  change24h: number;
  history: number[];
  bags: string;
  seats: string;
  risk: "Low" | "Medium";
  note: string;
  lastSeen: string;
};

type LiveMarketQuote = {
  destinationCode: DestinationCode;
  outboundDate: OutboundDate;
  returnDate: ReturnDate;
  tripDays: number;
  googlePrice: number | null;
  status: "live" | "unavailable";
  note: string;
};

type LiveSnapshot = {
  source: "google-flights-date-grid";
  generatedAt: string;
  quotes: LiveMarketQuote[];
  note: string;
};

const storageKey = "sea-btv-flight-watch";

const initialFlights: TrackedFlight[] = [
  {
    id: "delta-08-11",
    airline: "Delta",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-11",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "6:10 AM -> 6:42 PM",
    returnTimes: "1:55 PM -> 9:34 PM",
    route: "SEA -> MSP -> BTV",
    stops: 1,
    durationMinutes: 692,
    price: 584,
    change24h: -16,
    history: [644, 631, 620, 600, 584],
    bags: "Carry-on included",
    seats: "5 seats left at this fare",
    risk: "Low",
    note: "Balanced timing with a clean Sunday return.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "united-08-11",
    airline: "United",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-11",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "7:45 AM -> 8:18 PM",
    returnTimes: "12:08 PM -> 9:51 PM",
    route: "SEA -> ORD -> BTV",
    stops: 1,
    durationMinutes: 723,
    price: 548,
    change24h: -31,
    history: [628, 612, 596, 571, 548],
    bags: "Personal item only",
    seats: "Price dropped twice this week",
    risk: "Medium",
    note: "Cheapest live candidate, but basic economy baggage is tighter.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "alaska-08-12",
    airline: "Alaska + JetBlue",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-12",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "8:05 AM -> 7:24 PM",
    returnTimes: "6:20 AM -> 2:44 PM",
    route: "SEA -> JFK -> BTV",
    stops: 1,
    durationMinutes: 679,
    price: 612,
    change24h: -22,
    history: [689, 676, 648, 629, 612],
    bags: "Carry-on included",
    seats: "Good Monday fare protection",
    risk: "Low",
    note: "Best Monday return if you want the full weekend in Vermont.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "american-08-12",
    airline: "American",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-12",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "9:15 AM -> 10:01 PM",
    returnTimes: "7:05 AM -> 3:59 PM",
    route: "SEA -> CLT -> BTV",
    stops: 1,
    durationMinutes: 766,
    price: 566,
    change24h: -14,
    history: [603, 595, 589, 579, 566],
    bags: "Personal item only",
    seats: "8 seats left",
    risk: "Medium",
    note: "Lower fare than Alaska, but the routing is the longest of the set.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "delta-09-11",
    airline: "Delta",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-11",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "5:55 AM -> 5:58 PM",
    returnTimes: "2:12 PM -> 10:19 PM",
    route: "SEA -> DTW -> BTV",
    stops: 1,
    durationMinutes: 663,
    price: 529,
    change24h: -26,
    history: [599, 581, 569, 548, 529],
    bags: "Carry-on included",
    seats: "Weekend demand still soft",
    risk: "Low",
    note: "Best Friday departure if you want the lowest price without Monday travel.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "jetblue-09-11",
    airline: "JetBlue",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-11",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "10:20 AM -> 10:48 PM",
    returnTimes: "11:02 AM -> 8:57 PM",
    route: "SEA -> BOS -> BTV",
    stops: 1,
    durationMinutes: 688,
    price: 557,
    change24h: 9,
    history: [541, 548, 545, 548, 557],
    bags: "Carry-on included",
    seats: "Fare is climbing",
    risk: "Medium",
    note: "Good onboard product, but this fare is drifting upward.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "united-09-12",
    airline: "United",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-12",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "6:35 AM -> 7:41 PM",
    returnTimes: "5:40 PM -> 11:59 PM",
    route: "SEA -> DEN -> ORD -> BTV",
    stops: 2,
    durationMinutes: 726,
    price: 511,
    change24h: -19,
    history: [563, 548, 539, 527, 511],
    bags: "Personal item only",
    seats: "Best pure price, but two stops",
    risk: "Medium",
    note: "Lowest Monday-return fare if extra connections are acceptable.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "american-09-12",
    airline: "American",
    destinationCode: "BTV",
    destinationLabel: "Burlington, VT",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-12",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "7:52 AM -> 7:18 PM",
    returnTimes: "6:58 AM -> 3:40 PM",
    route: "SEA -> DFW -> BTV",
    stops: 1,
    durationMinutes: 666,
    price: 598,
    change24h: 4,
    history: [576, 584, 590, 594, 598],
    bags: "Carry-on included",
    seats: "Stable inventory",
    risk: "Low",
    note: "Fast for a Monday return, but not currently discounted.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "delta-bos-08-11",
    airline: "Delta",
    destinationCode: "BOS",
    destinationLabel: "Boston, MA",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-11",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "7:10 AM -> 3:29 PM",
    returnTimes: "4:58 PM -> 8:41 PM",
    route: "SEA -> BOS",
    stops: 0,
    durationMinutes: 319,
    price: 324,
    change24h: -12,
    history: [369, 354, 346, 336, 324],
    bags: "Carry-on included",
    seats: "Strong nonstop inventory",
    risk: "Low",
    note: "Best direct Boston option for a compact long weekend.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "alaska-bos-08-12",
    airline: "Alaska",
    destinationCode: "BOS",
    destinationLabel: "Boston, MA",
    outboundDate: "2026-10-08",
    returnDate: "2026-10-12",
    outboundLabel: "Thu, Oct 8",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "8:45 AM -> 5:09 PM",
    returnTimes: "6:25 PM -> 10:18 PM",
    route: "SEA -> BOS",
    stops: 0,
    durationMinutes: 324,
    price: 358,
    change24h: -18,
    history: [398, 389, 378, 366, 358],
    bags: "Carry-on included",
    seats: "Holiday Monday return still open",
    risk: "Low",
    note: "Clean nonstop if you want Boston flexibility through Monday.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "jetblue-bos-09-11",
    airline: "JetBlue",
    destinationCode: "BOS",
    destinationLabel: "Boston, MA",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-11",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Sun, Oct 11",
    outboundTimes: "9:05 AM -> 5:36 PM",
    returnTimes: "5:55 PM -> 9:50 PM",
    route: "SEA -> BOS",
    stops: 0,
    durationMinutes: 331,
    price: 347,
    change24h: 6,
    history: [331, 335, 338, 341, 347],
    bags: "Carry-on included",
    seats: "Fare is nudging upward",
    risk: "Low",
    note: "Fast Friday-to-Sunday nonstop, but this one is tightening.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  },
  {
    id: "delta-bos-09-12",
    airline: "Delta",
    destinationCode: "BOS",
    destinationLabel: "Boston, MA",
    outboundDate: "2026-10-09",
    returnDate: "2026-10-12",
    outboundLabel: "Fri, Oct 9",
    returnLabel: "Mon, Oct 12",
    outboundTimes: "6:50 AM -> 3:12 PM",
    returnTimes: "5:20 PM -> 9:14 PM",
    route: "SEA -> BOS",
    stops: 0,
    durationMinutes: 322,
    price: 372,
    change24h: -9,
    history: [396, 390, 384, 381, 372],
    bags: "Carry-on included",
    seats: "Nonstop Monday return",
    risk: "Low",
    note: "Best direct Monday-return option if Boston works for the trip.",
    lastSeen: "Mar 19, 2026 8:10 AM PT"
  }
];

const outboundOptions: Array<"ALL" | OutboundDate> = ["ALL", "2026-10-08", "2026-10-09"];
const returnOptions: Array<"ALL" | ReturnDate> = ["ALL", "2026-10-11", "2026-10-12"];
const destinationOptions: Array<"ALL" | DestinationCode> = ["ALL", "BTV", "BOS"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatMinutes(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function labelForDate(date: "ALL" | OutboundDate | ReturnDate) {
  if (date === "ALL") {
    return "All dates";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function quoteKey(destinationCode: DestinationCode, outboundDate: OutboundDate, returnDate: ReturnDate) {
  return `${destinationCode}:${outboundDate}:${returnDate}`;
}

function formatObservedAt(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

function tripScore(trip: TrackedFlight) {
  const stopPenalty = trip.stops * 28;
  const durationPenalty = Math.round((trip.durationMinutes - 600) / 8);
  const trendBonus = trip.change24h < 0 ? Math.abs(trip.change24h) : -trip.change24h * 2;
  const riskPenalty = trip.risk === "Medium" ? 18 : 0;

  return 1000 - trip.price - stopPenalty - durationPenalty + trendBonus - riskPenalty;
}

function mutateTrips(trips: TrackedFlight[]) {
  return trips.map((trip, index) => {
    const movement = ((index % 3) - 1) * 7 + (trip.change24h > 0 ? -3 : 4);
    const nextPrice = Math.max(429, trip.price + movement);
    const nextHistory = [...trip.history.slice(1), nextPrice];

    return {
      ...trip,
      price: nextPrice,
      change24h: nextPrice - trip.history[trip.history.length - 2],
      history: nextHistory,
      lastSeen: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      })
    };
  });
}

function historyHeight(history: number[], value: number) {
  const min = Math.min(...history);
  const max = Math.max(...history);

  if (min === max) {
    return 56;
  }

  return 28 + ((value - min) / (max - min)) * 52;
}

export default function FlightTrackerDashboard() {
  const [trips, setTrips] = useState(initialFlights);
  const [watchedIds, setWatchedIds] = useState<TripId[]>([]);
  const [destinationFilter, setDestinationFilter] = useState<"ALL" | DestinationCode>("ALL");
  const [outboundFilter, setOutboundFilter] = useState<"ALL" | OutboundDate>("ALL");
  const [returnFilter, setReturnFilter] = useState<"ALL" | ReturnDate>("ALL");
  const [maxPrice, setMaxPrice] = useState(700);
  const [maxStops, setMaxStops] = useState(2);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [airlineQuery, setAirlineQuery] = useState("");
  const [targetPrice, setTargetPrice] = useState(400);
  const [lastRefreshAt, setLastRefreshAt] = useState("Mar 19, 2026 8:10 AM PT");
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isFetchingGoogle, setIsFetchingGoogle] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredAirlineQuery = useDeferredValue(airlineQuery);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { watchedIds?: TripId[]; targetPrice?: number };

      if (parsed.watchedIds) {
        setWatchedIds(parsed.watchedIds);
      }

      if (typeof parsed.targetPrice === "number") {
        setTargetPrice(parsed.targetPrice);
      }
    } catch {
      // Ignore malformed local state and continue with defaults.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ watchedIds, targetPrice }));
  }, [targetPrice, watchedIds]);

  const destinationScopedTrips = trips.filter((trip) =>
    destinationFilter === "ALL" ? true : trip.destinationCode === destinationFilter
  );

  const visibleTrips = destinationScopedTrips
    .filter((trip) => (outboundFilter === "ALL" ? true : trip.outboundDate === outboundFilter))
    .filter((trip) => (returnFilter === "ALL" ? true : trip.returnDate === returnFilter))
    .filter((trip) => trip.price <= maxPrice)
    .filter((trip) => trip.stops <= maxStops)
    .filter((trip) =>
      deferredAirlineQuery.trim()
        ? `${trip.airline} ${trip.route}`.toLowerCase().includes(deferredAirlineQuery.toLowerCase())
        : true
    )
    .sort((left, right) => {
      if (sortMode === "price") {
        return left.price - right.price;
      }

      if (sortMode === "duration") {
        return left.durationMinutes - right.durationMinutes;
      }

      if (sortMode === "recent") {
        return left.change24h - right.change24h;
      }

      return tripScore(right) - tripScore(left);
    });

  const summaryTrips = destinationScopedTrips.length > 0 ? destinationScopedTrips : trips;
  const cheapestTrip = [...summaryTrips].sort((left, right) => left.price - right.price)[0];
  const fastestTrip = [...summaryTrips].sort((left, right) => left.durationMinutes - right.durationMinutes)[0];
  const watchedTrips = trips.filter((trip) => watchedIds.includes(trip.id));
  const alertTrips = watchedTrips.filter((trip) => trip.price <= targetPrice);
  const liveQuotes = (liveSnapshot?.quotes ?? []).filter((quote) =>
    destinationFilter === "ALL" ? true : quote.destinationCode === destinationFilter
  );
  const liveQuoteMap = new Map(
    (liveSnapshot?.quotes ?? []).map((quote) => [
      quoteKey(quote.destinationCode, quote.outboundDate, quote.returnDate),
      quote
    ])
  );
  const liveQuoteCount = liveQuotes.filter((quote) => quote.status === "live").length;

  const pairSummaries = [
    { outboundDate: "2026-10-08" as OutboundDate, returnDate: "2026-10-11" as ReturnDate },
    { outboundDate: "2026-10-08" as OutboundDate, returnDate: "2026-10-12" as ReturnDate },
    { outboundDate: "2026-10-09" as OutboundDate, returnDate: "2026-10-11" as ReturnDate },
    { outboundDate: "2026-10-09" as OutboundDate, returnDate: "2026-10-12" as ReturnDate }
  ].map((pair) => {
    const candidates = summaryTrips.filter(
      (trip) => trip.outboundDate === pair.outboundDate && trip.returnDate === pair.returnDate
    );
    const cheapest = [...candidates].sort((left, right) => left.price - right.price)[0];
    const average = Math.round(
      candidates.reduce((total, candidate) => total + candidate.price, 0) / candidates.length
    );
    const trend = candidates.reduce((total, candidate) => total + candidate.change24h, 0);

    return {
      ...pair,
      cheapest,
      average,
      trend
    };
  });

  function toggleWatch(id: TripId) {
    setWatchedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }

  function refreshTrips() {
    startTransition(() => {
      setTrips((current) => mutateTrips(current));
      setLastRefreshAt(
        new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short"
        })
      );
    });
  }

  async function fetchGoogleSnapshot() {
    setIsFetchingGoogle(true);
    setLiveError(null);

    try {
      const response = await fetch("/api/flights/google", { method: "POST" });
      const payload = (await response.json()) as LiveSnapshot | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "Google fetch failed");
      }

      setLiveSnapshot(payload as LiveSnapshot);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Google fetch failed");
    } finally {
      setIsFetchingGoogle(false);
    }
  }

  return (
    <section className="space-y-8 text-slate-900">
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
        <div className="overflow-hidden rounded-[32px] border border-sky-950/10 bg-slate-950 px-7 py-8 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.7)]">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-cyan-200/80">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Seattle, WA</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Burlington, VT</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Boston, MA</span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              Tracking Oct 8-12, 2026
            </span>
          </div>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Watch the best SEA to Burlington or Boston weekend fare windows before the market tightens.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            This tracker is preloaded for departures on Thursday, October 8 or Friday, October 9,
            with returns on Sunday, October 11 or Monday, October 12, 2026. Use it to compare Boston
            and Burlington fare pressure, save the trips you care about, and set your own buy threshold.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cheapest now</p>
              <p className="mt-3 text-3xl font-semibold">{formatMoney(cheapestTrip.price)}</p>
              <p className="mt-2 text-sm text-slate-300">
                {cheapestTrip.airline} · {cheapestTrip.destinationCode} · {cheapestTrip.outboundLabel} to {cheapestTrip.returnLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Fastest routing</p>
              <p className="mt-3 text-3xl font-semibold">{formatMinutes(fastestTrip.durationMinutes)}</p>
              <p className="mt-2 text-sm text-slate-300">
                {fastestTrip.airline} · {fastestTrip.destinationCode} · {fastestTrip.route}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Google live grid</p>
              <p className="mt-3 text-3xl font-semibold">{liveQuoteCount}</p>
              <p className="mt-2 text-sm text-slate-300">
                {liveSnapshot
                  ? `${liveQuoteCount} live quote${liveQuoteCount === 1 ? "" : "s"} returned from the latest scrape`
                  : "Run Google snapshot to compare live date-grid prices"}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[32px] border border-sky-950/10 bg-white/85 p-6 shadow-[0_24px_70px_-38px_rgba(14,116,144,0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Snapshot</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Live watch controls</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshTrips}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {isPending ? "Refreshing..." : "Refresh fares"}
              </button>
              <button
                type="button"
                onClick={fetchGoogleSnapshot}
                className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800"
              >
                {isFetchingGoogle ? "Fetching Google..." : "Fetch Google snapshot"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Last refresh: <span className="font-medium text-slate-900">{lastRefreshAt}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Google snapshot:{" "}
            <span className="font-medium text-slate-900">
              {liveSnapshot ? formatObservedAt(liveSnapshot.generatedAt) : "not fetched yet"}
            </span>
          </p>
          {liveError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {liveError}
            </div>
          ) : null}
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-900">Filter by airline or route</span>
              <input
                value={airlineQuery}
                onChange={(event) => setAirlineQuery(event.target.value)}
                placeholder="Delta, United, BOS, BTV, JFK..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
              />
            </label>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">Max fare</span>
                <span className="text-slate-600">{formatMoney(maxPrice)}</span>
              </div>
              <input
                type="range"
                min={300}
                max={700}
                step={10}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="mt-3 w-full accent-cyan-700"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">Price alert</span>
                <span className="text-slate-600">{formatMoney(targetPrice)}</span>
              </div>
              <input
                type="range"
                min={300}
                max={640}
                step={5}
                value={targetPrice}
                onChange={(event) => setTargetPrice(Number(event.target.value))}
                className="mt-3 w-full accent-emerald-600"
              />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-900">Destination</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {destinationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDestinationFilter(option)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      destinationFilter === option
                        ? "bg-cyan-700 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {option === "ALL" ? "Boston + Burlington" : option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-900">Outbound</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {outboundOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setOutboundFilter(option)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      outboundFilter === option
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {labelForDate(option)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-900">Return</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {returnOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReturnFilter(option)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      returnFilter === option
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {labelForDate(option)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-900">Max stops</span>
              <div className="mt-2 flex gap-2">
                {[0, 1, 2].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMaxStops(option)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      maxStops === option
                        ? "bg-cyan-700 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {option === 0 ? "Nonstop" : `${option} stop${option === 1 ? "" : "s"}`}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-900">Sort trips</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
              >
                <option value="best">Best overall</option>
                <option value="price">Lowest price</option>
                <option value="duration">Fastest travel time</option>
                <option value="recent">Biggest recent drop</option>
              </select>
            </label>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
              Google fetches are on-demand local browser scrapes. They do not run continuously, and
              some far-out dates can return no visible grid price.
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-900/10 bg-white/80 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Visible trips</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{visibleTrips.length}</p>
          <p className="mt-2 text-sm text-slate-600">Filtered itinerary combinations in your current destination and date window.</p>
        </div>
        <div className="rounded-3xl border border-cyan-900/10 bg-white/80 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Watched</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{watchedTrips.length}</p>
          <p className="mt-2 text-sm text-slate-600">Trips saved locally in this browser session.</p>
        </div>
        <div className="rounded-3xl border border-cyan-900/10 bg-white/80 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">At target</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{alertTrips.length}</p>
          <p className="mt-2 text-sm text-slate-600">Watched fares already at or below your threshold.</p>
        </div>
        <div className="rounded-3xl border border-cyan-900/10 bg-white/80 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Target price</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{formatMoney(targetPrice)}</p>
          <p className="mt-2 text-sm text-slate-600">Your buy threshold for watchlist and live snapshot comparisons.</p>
        </div>
      </div>

      <section className="rounded-[32px] border border-sky-950/10 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Google Live</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-950">On-demand Google Flights market snapshot</h3>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            This uses a local Playwright scrape against Google Flights date-grid pricing. It is
            useful as a live market check, but Google may omit exact prices for some October 2026
            combinations.
          </p>
        </div>
        {!liveSnapshot ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            Run <span className="font-medium text-slate-950">Fetch Google snapshot</span> to pull live
            date-grid prices for Boston and Burlington.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {liveQuotes.map((quote) => (
              <div
                key={quoteKey(quote.destinationCode, quote.outboundDate, quote.returnDate)}
                className="rounded-3xl bg-slate-950 p-5 text-white"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                  {quote.destinationCode} · {labelForDate(quote.outboundDate)}
                  {" -> "}
                  {labelForDate(quote.returnDate)}
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {quote.googlePrice === null ? "No fare" : formatMoney(quote.googlePrice)}
                </p>
                <p className="mt-2 text-sm text-slate-300">{quote.note}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {visibleTrips.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/75 p-8 text-sm leading-6 text-slate-600">
          No trips match the current filters. Try raising the max fare, changing the destination,
          allowing more stops, or resetting the date filters.
        </div>
      ) : (
        <div className="grid gap-5">
          {visibleTrips.map((trip) => {
            const watched = watchedIds.includes(trip.id);
            const atTarget = trip.price <= targetPrice;
            const liveQuote = liveQuoteMap.get(
              quoteKey(trip.destinationCode, trip.outboundDate, trip.returnDate)
            );

            return (
              <article
                key={trip.id}
                className="grid gap-5 rounded-[28px] border border-sky-950/10 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:grid-cols-[1.3fr_0.9fr_0.7fr]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white">
                      {trip.airline}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {trip.destinationCode}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {trip.outboundLabel}
                      {" -> "}
                      {trip.returnLabel}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        trip.risk === "Low"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {trip.risk} connection risk
                    </span>
                    {atTarget ? (
                      <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700">
                        Alert ready
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-950">{trip.route}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Outbound</p>
                      <p className="mt-2 text-lg font-medium text-slate-950">{trip.outboundTimes}</p>
                      <p className="mt-1 text-sm text-slate-600">{trip.outboundLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Return</p>
                      <p className="mt-2 text-lg font-medium text-slate-950">{trip.returnTimes}</p>
                      <p className="mt-1 text-sm text-slate-600">{trip.returnLabel}</p>
                    </div>
                  </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>{trip.destinationLabel}</span>
                  <span>{trip.stops} stop{trip.stops === 1 ? "" : "s"}</span>
                  <span>{formatMinutes(trip.durationMinutes)}</span>
                  <span>{trip.bags}</span>
                    <span>{trip.seats}</span>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{trip.note}</p>
                </div>

                <div className="rounded-[24px] bg-slate-950 p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current fare</p>
                      <p className="mt-3 text-4xl font-semibold">{formatMoney(trip.price)}</p>
                    </div>
                    <p
                      className={`rounded-full px-3 py-1 text-sm ${
                        trip.change24h <= 0
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-rose-400/15 text-rose-200"
                      }`}
                    >
                      {trip.change24h <= 0 ? "" : "+"}
                      {formatMoney(trip.change24h)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">Last seen {trip.lastSeen}</p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Google live snapshot</p>
                    {!liveQuote ? (
                      <p className="mt-3 text-sm text-slate-300">Run the Google snapshot to compare this date pair.</p>
                    ) : liveQuote.googlePrice === null ? (
                      <p className="mt-3 text-sm text-slate-300">{liveQuote.note}</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <p className="text-2xl font-semibold">{formatMoney(liveQuote.googlePrice)}</p>
                        <p className="text-sm text-slate-300">
                          {trip.price <= liveQuote.googlePrice
                            ? `${formatMoney(liveQuote.googlePrice - trip.price)} below the seeded itinerary`
                            : `${formatMoney(trip.price - liveQuote.googlePrice)} above the Google grid price`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      {trip.history.map((value, index) => (
                        <div
                          key={`${trip.id}-${value}-${index}`}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <div
                            className={`w-full rounded-t-xl ${
                              index === trip.history.length - 1 ? "bg-cyan-400" : "bg-white/35"
                            }`}
                            style={{ height: `${historyHeight(trip.history, value)}px` }}
                          />
                          <span className="text-[10px] text-slate-400">{formatMoney(value)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                      5-snapshot fare trend
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-700">Watch action</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Save the itinerary to your watchlist and keep checking against your alert
                      threshold.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleWatch(trip.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        watched
                          ? "bg-slate-950 text-white hover:bg-slate-800"
                          : "bg-white text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {watched ? "Remove from watchlist" : "Add to watchlist"}
                    </button>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                      Buy zone:{" "}
                      <span className={`font-semibold ${atTarget ? "text-emerald-700" : "text-slate-900"}`}>
                        {atTarget ? "ready now" : `${formatMoney(trip.price - targetPrice)} above target`}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section id="date-matrix" className="rounded-[32px] border border-sky-950/10 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Date Matrix</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-950">Which travel window is strongest right now?</h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Each card rolls up the best fare and average pricing for one outbound and return pairing
            within the current destination filter.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pairSummaries.map((summary) => (
            <div key={`${summary.outboundDate}-${summary.returnDate}`} className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                {labelForDate(summary.outboundDate)}
                {" -> "}
                {labelForDate(summary.returnDate)}
              </p>
              <p className="mt-4 text-3xl font-semibold">{formatMoney(summary.cheapest.price)}</p>
              <p className="mt-2 text-sm text-slate-300">
                {summary.cheapest.airline} to {summary.cheapest.destinationCode} is the lead option.
              </p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Average fare</span>
                  <span>{formatMoney(summary.average)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Best route</span>
                  <span>{summary.cheapest.route}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>24h trend</span>
                  <span className={summary.trend <= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {summary.trend <= 0 ? "" : "+"}
                    {formatMoney(summary.trend)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section id="watchlist" className="rounded-[32px] border border-sky-950/10 bg-white/85 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Watchlist</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-950">Saved trips</h3>
          {watchedTrips.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
              Add any itinerary to the watchlist and it will stay pinned here in local storage.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {watchedTrips.map((trip) => (
                <div key={`watch-${trip.id}`} className="rounded-3xl bg-slate-950 p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{trip.airline}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {trip.destinationCode} · {trip.outboundLabel}
                        {" -> "}
                        {trip.returnLabel} · {trip.route}
                      </p>
                    </div>
                    <p className="text-3xl font-semibold">{formatMoney(trip.price)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span>{formatMinutes(trip.durationMinutes)}</span>
                    <span>{trip.stops} stop{trip.stops === 1 ? "" : "s"}</span>
                    <span>{trip.seats}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="alerts" className="rounded-[32px] border border-sky-950/10 bg-gradient-to-br from-cyan-50 to-emerald-50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700">Alerts</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-950">Threshold monitor</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            The alert slider is set to {formatMoney(targetPrice)}. Watched Boston or Burlington trips
            at or below that number are highlighted above and summarized here.
          </p>
          <div className="mt-6 space-y-4">
            {alertTrips.length === 0 ? (
              <div className="rounded-3xl bg-white/80 p-5 text-sm leading-6 text-slate-600">
                No watched trips have crossed the threshold yet. The closest current fare is{" "}
                <span className="font-semibold text-slate-950">{formatMoney(cheapestTrip.price)}</span>.
              </div>
            ) : (
              alertTrips.map((trip) => (
                <div key={`alert-${trip.id}`} className="rounded-3xl bg-white/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{trip.airline}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {trip.outboundLabel}
                        {" -> "}
                        {trip.returnLabel}
                      </p>
                    </div>
                    <p className="text-3xl font-semibold text-emerald-700">{formatMoney(trip.price)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{trip.note}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
