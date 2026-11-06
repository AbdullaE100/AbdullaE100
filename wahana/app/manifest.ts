import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}: vehicles in Sri Lanka`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#1f4fe0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
