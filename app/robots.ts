import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/portal/", "/doctor/", "/login", "/doctor-login"],
    },
    sitemap: "https://psicobienestarguatemala.com/sitemap.xml",
  };
}
