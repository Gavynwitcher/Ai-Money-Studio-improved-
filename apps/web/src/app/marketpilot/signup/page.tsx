import { MarketPilotAuthForm } from "@/components/marketpilot/auth-form";
import { MarketPilotLogo } from "@/components/marketpilot/brand";

export default function MarketPilotSignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8f3] px-5 py-10 text-[#10231c]">
      <section className="w-full max-w-md rounded-3xl border border-[#dfe7dd] bg-white p-6 shadow-sm">
        <MarketPilotLogo />
        <h1 className="mt-8 text-4xl font-black tracking-[-0.04em]">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-[#647067]">Start free, build your profile, and generate your first 30-day plan.</p>
        <MarketPilotAuthForm mode="signup" />
      </section>
    </main>
  );
}
