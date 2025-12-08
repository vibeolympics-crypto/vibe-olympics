import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://vibeolympics.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/auth/error",
          "/auth/reset-password",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
