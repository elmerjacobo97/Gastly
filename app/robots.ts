import type { MetadataRoute } from "next";

import { PRIVATE_ROUTES } from "@/lib/private-routes";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...PRIVATE_ROUTES.filter((route) => route !== "/")],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
