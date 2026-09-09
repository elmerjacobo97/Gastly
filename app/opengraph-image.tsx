import { ImageResponse } from "next/og"

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          color: "#f7f7f2",
          padding: "72px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "18px",
              background: "#d4ff3f",
              fontSize: "40px",
              fontWeight: 800,
              color: "#050505",
            }}
          >
            G
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.04em", color: "#f7f7f2" }}>{SITE_NAME}</span>
            <span style={{ color: "#d4ff3f", fontSize: "24px" }}>Finanzas personales</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "76px",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              fontWeight: 900,
              color: "#f7f7f2",
            }}
          >
            Controla tu dinero sin perderte en hojas de calculo.
          </h1>
          <p style={{ margin: 0, color: "#c9c9c2", fontSize: "28px", lineHeight: 1.4 }}>{SITE_DESCRIPTION}</p>
        </div>
      </div>
    ),
    size
  )
}
