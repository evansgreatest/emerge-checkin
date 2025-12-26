import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emerge",
    short_name: "Emerge",
    description: "Emerge Event Check-In System",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
