import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://psicobienestar.vercel.app",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://psicobienestar.vercel.app/login",
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://psicobienestar.vercel.app/portal",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
