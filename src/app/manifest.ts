import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Checkmate & Twist Academy",
    short_name: "Checkmate & Twist",
    description: "Learn chess and the Rubik's Cube. Lessons, opening kits, the timer, the 3D cube and the engine work offline.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cube timer", url: "/cube/timer" },
      { name: "Play the computer", url: "/chess/play" },
      { name: "Opening kits", url: "/openings" },
      { name: "Daily puzzle", url: "/daily" },
    ],
  };
}
