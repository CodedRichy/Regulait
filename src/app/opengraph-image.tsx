import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Regulait -- EU AI Act Compliance Checker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Hardcoded hex approximations of the dark-mode OKLCH design tokens in
// globals.css. Satori (used by ImageResponse) does not resolve CSS custom
// properties or oklch(), so the palette is inlined here rather than shared.
const COLORS = {
  canvas: "#14171d",
  surface: "#1b1f27",
  border: "#33394a",
  ink: "#eceef2",
  inkMuted: "#9aa3b8",
  accent: "#7fb2d9",
  danger: "#e0705a",
  warning: "#e0a95a",
  success: "#7fc79a",
};

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.canvas,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row: eyebrow + risk-tier dots */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.inkMuted,
            }}
          >
            EU AI Act &middot; Article 5 / Annex III
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[COLORS.danger, COLORS.warning, COLORS.accent, COLORS.success].map(
              (color) => (
                <div
                  key={color}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: color,
                    display: "flex",
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* Middle: title block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 700,
              letterSpacing: -3,
              color: COLORS.ink,
              lineHeight: 1,
            }}
          >
            Regulait
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 40,
              fontWeight: 600,
              color: COLORS.accent,
            }}
          >
            EU AI Act Compliance Checker
          </div>
        </div>

        {/* Bottom: tagline + border rule */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: `2px solid ${COLORS.border}`,
            paddingTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34,
              color: COLORS.ink,
            }}
          >
            Is your AI system compliant?
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 20,
              color: COLORS.inkMuted,
            }}
          >
            Risk classification, required actions, and a compliance report
            in minutes.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
