import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #0b1f33 0%, #16324d 55%, #214c6b 100%)",
          color: "white",
          fontFamily: "Avenir Next, Arial, sans-serif",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}
        >
          <div
            style={{
              width: "86px",
              height: "86px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700
            }}
          >
            NL
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "22px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#8ec9cf" }}>
              Northline
            </div>
            <div style={{ fontSize: "24px", color: "#d7e7ef" }}>Multi-bank visibility for consumers and small businesses</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px" }}>
          <div style={{ fontSize: "72px", lineHeight: 1.02, fontWeight: 700 }}>
            Connect bank accounts, track balances, and monitor transactions in one place.
          </div>
          <div style={{ fontSize: "28px", lineHeight: 1.4, color: "#d7e7ef" }}>
            Plaid-powered account aggregation, categorized transaction views, and cash-flow visibility.
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px" }}>
          {["Multi-bank dashboard", "Plaid integration", "Transaction categorization"].map((pill) => (
            <div
              key={pill}
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                padding: "14px 22px",
                fontSize: "22px",
                color: "#f2f7fb"
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
