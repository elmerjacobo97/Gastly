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
          background: "linear-gradient(135deg, #07111f 0%, #102a6b 52%, #1d42d0 100%)",
          color: "white",
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
              borderRadius: "20px",
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: "40px",
              fontWeight: 800,
            }}
          >
            G
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.04em" }}>{SITE_NAME}</span>
            <span style={{ color: "#bfdbfe", fontSize: "24px" }}>Finanzas personales</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "76px",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              fontWeight: 850,
            }}
          >
            Controla tu dinero sin perderte en hojas de calculo.
          </h1>
          <p style={{ margin: 0, color: "#dbeafe", fontSize: "30px", lineHeight: 1.35 }}>{SITE_DESCRIPTION}</p>
        </div>
      </div>
    ),
    size
  )
}
