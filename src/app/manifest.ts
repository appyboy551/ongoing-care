import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ongoing Care",
    short_name: "Ongoing Care",
    description:
      "David's support network portal. Care plan, action plan, and safe communication.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f8",
    theme_color: "#a82e7e",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
