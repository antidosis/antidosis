import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const alt = "antidosis — exchange anything, build trust.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0806",
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(0,229,255,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(245,166,35,0.06) 0%, transparent 50%)",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(232,213,163,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,213,163,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Terminal bracket decoration */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 60,
            height: 60,
            borderLeft: "2px solid rgba(0,229,255,0.3)",
            borderTop: "2px solid rgba(0,229,255,0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 60,
            height: 60,
            borderRight: "2px solid rgba(245,166,35,0.3)",
            borderBottom: "2px solid rgba(245,166,35,0.3)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 12,
            background: "rgba(0,229,255,0.1)",
            border: "1px solid rgba(0,229,255,0.25)",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontFamily: "monospace",
              color: "#00e5ff",
              fontWeight: 700,
            }}
          >
            α
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#e8d5a3",
            fontFamily: "monospace",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          antidosis
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: "#b8a078",
            fontFamily: "monospace",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: 800,
          }}
        >
          exchange anything, build trust.
        </p>

        {/* Location badge */}
        <div
          style={{
            marginTop: 40,
            padding: "12px 28px",
            borderRadius: 8,
            background: "rgba(0,229,255,0.08)",
            border: "1px solid rgba(0,229,255,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#00e676",
            }}
          />
          <span
            style={{
              fontSize: 18,
              color: "#00e5ff",
              fontFamily: "monospace",
            }}
          >
            Central Coast, NSW — Trial Active
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
