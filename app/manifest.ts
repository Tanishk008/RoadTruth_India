import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Road Truth",
    description: site.description,
    start_url: "/report-issue",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#0f1b2d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Report an issue", url: "/report-issue" },
      { name: "Track a report", url: "/track" },
      { name: "Issues map", url: "/map" },
    ],
  }
}
