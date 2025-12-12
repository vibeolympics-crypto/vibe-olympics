import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config";

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
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
