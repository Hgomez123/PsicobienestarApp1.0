import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/doctor"],
    },
    sitemap: "https://psicobienestar.vercel.app/sitemap.xml",
  };
}
