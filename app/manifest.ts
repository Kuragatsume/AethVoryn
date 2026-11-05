import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AETHVORYN [OS] — Цифровое рабочее пространство",
    short_name: "AETHVORYN",
    description:
      "Кибернетическое рабочее пространство: агрегатор новостей, блокнот со схемами Paint, ИИ-ассистент, терминал и системная телеметрия.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#05070A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
