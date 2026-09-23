import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // All routes currently require authentication, so there are no public URLs
  // that belong in a crawler-facing sitemap.
  return [];
}
