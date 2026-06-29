"use client";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function ComingSoonPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#060e06",
        color: "#e8d5a3",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ambient glows */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, rgba(45,90,39,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "10%",
          width: 360,
          height: 360,
          background:
            "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* nav */}
      <Navbar />

      {/* main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px 80px",
          position: "relative",
          zIndex: 2,
          textAlign: "center",
        }}
      >
        {/* manga panel motif — empty/loading panel */}
        <div
          style={{
            width: 300,
            height: 154,
            border: "1.5px solid rgba(201,168,76,0.5)",
            borderRadius: 6,
            marginBottom: 40,
            position: "relative",
            overflow: "hidden",
            background: "rgba(10,26,10,0.5)",
          }}
        >
          <svg
            viewBox="0 0 220 154"
            style={{ position: "absolute", inset: 0, opacity: 0.4 }}
          >
            <g stroke="#c9a84c" strokeWidth="0.6">
              <line x1="110" y1="77" x2="0" y2="0" />
              <line x1="110" y1="77" x2="73" y2="0" />
              <line x1="110" y1="77" x2="147" y2="0" />
              <line x1="110" y1="77" x2="220" y2="0" />
              <line x1="110" y1="77" x2="220" y2="77" />
              <line x1="110" y1="77" x2="220" y2="154" />
              <line x1="110" y1="77" x2="147" y2="154" />
              <line x1="110" y1="77" x2="73" y2="154" />
              <line x1="110" y1="77" x2="0" y2="154" />
              <line x1="110" y1="77" x2="0" y2="77" />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1.5px dashed rgba(201,168,76,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#c9a84c">
                <path d="M3 2.5l11 5.5-11 5.5z" />
              </svg>
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "#6b9e62",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          Next chapter
        </p>

        <h1
          style={{
            fontSize: "clamp(34px,5.5vw,58px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 18px",
            color: "#e8d5a3",
            maxWidth: 680,
          }}
        >
          Something new is panel by panel coming together
        </h1>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#2d5a27",
            color: "#e8d5a3",
            fontSize: 15,
            fontWeight: 600,
            padding: "14px 28px",
            borderRadius: 12,
            textDecoration: "none",
            border: "1px solid rgba(74,138,66,0.5)",
          }}
        >
          Go to Home
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" />
          </svg>
        </Link>
      </div>

      {/* footer */}
      <Footer />
    </main>
  );
}
