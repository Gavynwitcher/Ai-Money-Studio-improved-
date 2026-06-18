import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "MarketPilot AI",
    default: "MarketPilot AI",
    template: "%s | MarketPilot AI"
  },
  description: "Your AI Marketing CEO for Small Businesses"
};

export default function MarketPilotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
