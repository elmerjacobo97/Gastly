import type { Metadata } from "next"

export const SITE_URL = "https://gastly.elmerjacobo.dev"
export const SITE_NAME = "Gastly"
export const SITE_TITLE = "Gastly | Finanzas personales sin friccion"
export const SITE_DESCRIPTION =
  "Organiza ingresos, gastos, presupuestos, cuotas y metas de ahorro desde un panel privado hecho para tus finanzas personales."

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Gastly, panel privado para organizar finanzas personales",
}

export const sharedMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Gastly",
    "finanzas personales",
    "control de gastos",
    "presupuesto personal",
    "metas de ahorro",
    "gastos recurrentes",
  ],
  authors: [{ name: "Elmer Jacobo", url: "https://elmerjacobo.dev" }],
  creator: "Elmer Jacobo",
  publisher: "Elmer Jacobo",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const privateMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
