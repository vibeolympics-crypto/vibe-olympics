import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vibe Olympics - Create your idea",
    short_name: "VibeOlympics",
    description: "VIBE 코딩 기반 지적 상품 판도라 샵. 아이디어를 현실로, 지식을 가치로 만들어보세요.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0f",
    theme_color: "#7c3aed",
    scope: "/",
    lang: "ko",
    dir: "ltr",
    categories: ["education", "shopping", "productivity", "business"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-expect-error - form_factor is valid but not in types
        form_factor: "wide",
        label: "홈 화면",
      },
      {
        src: "/screenshots/marketplace.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-expect-error - form_factor is valid but not in types
        form_factor: "wide",
        label: "판도라 샵",
      },
    ],
    shortcuts: [
      {
        name: "판도라 샵",
        short_name: "샵",
        description: "디지털 상품 둘러보기",
        url: "/marketplace",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "커뮤니티",
        short_name: "커뮤니티",
        description: "개발자 커뮤니티",
        url: "/community",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "교육",
        short_name: "교육",
        description: "VIBE 코딩 교육",
        url: "/education",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
