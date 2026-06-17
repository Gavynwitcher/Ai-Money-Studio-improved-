import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: {
    absolute: "3% Marketing OS"
  },
  description:
    "A marketing operating system mockup that helps businesses plan, launch, and measure growth with a 3% revenue budget."
};

export default function MarketingOSPage() {
  redirect("/");
}
