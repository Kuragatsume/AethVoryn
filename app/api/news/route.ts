import { NextResponse } from "next/server";

export type ExternalNewsItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: "Habr Новости" | "Habr Статьи" | "3DNews" | "Dev.to";
  category: string;
  tags: string[];
  url: string;
  date: string;
  timestamp: number;
};

function decodeEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&laquo;/gi, "«")
    .replace(/&raquo;/gi, "»")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function extractCategories(block: string): string[] {
  const matches = Array.from(
    block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)
  );
  return matches
    .map((m) => decodeEntities(m[1]))
    .filter((c) => c.length > 1 && c.length < 32)
    .slice(0, 4);
}

function formatRuDate(pubDateStr: string): { label: string; ts: number } {
  const d = new Date(pubDateStr);
  if (Number.isNaN(d.getTime())) {
    return { label: "Сегодня", ts: Date.now() };
  }
  const label = d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { label, ts: d.getTime() };
}

function parseRssItems(
  xml: string,
  source: ExternalNewsItem["source"],
  defaultCategory: string,
  limit = 10
): ExternalNewsItem[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)).slice(
    0,
    limit
  );
  return items
    .map((match, idx) => {
      const block = match[1];
      const title = decodeEntities(extractTag(block, "title"));
      const rawDesc = extractTag(block, "description");
      const cleanedDesc = decodeEntities(rawDesc).replace(/Читать далее\s*$/i, "").trim();
      const link = decodeEntities(extractTag(block, "link"));
      const guid = decodeEntities(extractTag(block, "guid")) || link || `${source}-${idx}`;
      const pubDate = extractTag(block, "pubDate");
      const { label, ts } = formatRuDate(pubDate);
      const cats = extractCategories(block);

      return {
        id: `${source}-${guid}`,
        title,
        summary:
          cleanedDesc.length > 220
            ? `${cleanedDesc.slice(0, 220)}…`
            : cleanedDesc || "Свежий материал из мира технологий.",
        content: cleanedDesc || title,
        source,
        category: cats[0] || defaultCategory,
        tags: cats.length ? cats : [defaultCategory, source],
        url: link,
        date: label,
        timestamp: ts,
      };
    })
    .filter((i) => i.title.length > 3);
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);

    const [habrNewsRes, habrTopRes, news3dRes, devToRes] = await Promise.allSettled([
      fetch("https://habr.com/ru/rss/news/?fl=ru", {
        signal: controller.signal,
        headers: { "User-Agent": "Aethvoryn-Ecosystem/1.0" },
        next: { revalidate: 300 },
      }).then((r) => r.text()),
      fetch("https://habr.com/ru/rss/articles/top/daily/?fl=ru", {
        signal: controller.signal,
        headers: { "User-Agent": "Aethvoryn-Ecosystem/1.0" },
        next: { revalidate: 300 },
      }).then((r) => r.text()),
      fetch("https://www.3dnews.ru/news/rss/", {
        signal: controller.signal,
        headers: { "User-Agent": "Aethvoryn-Ecosystem/1.0" },
        next: { revalidate: 300 },
      }).then((r) => r.text()),
      fetch("https://dev.to/api/articles?per_page=6&tag=technology", {
        signal: controller.signal,
        headers: { "User-Agent": "Aethvoryn-Ecosystem/1.0" },
        next: { revalidate: 300 },
      }).then((r) => r.json()),
    ]);

    clearTimeout(timer);

    const results: ExternalNewsItem[] = [];

    if (habrNewsRes.status === "fulfilled") {
      results.push(...parseRssItems(habrNewsRes.value, "Habr Новости", "IT и Технологии", 10));
    }
    if (news3dRes.status === "fulfilled") {
      results.push(...parseRssItems(news3dRes.value, "3DNews", "Железо и ИИ", 8));
    }
    if (habrTopRes.status === "fulfilled") {
      results.push(...parseRssItems(habrTopRes.value, "Habr Статьи", "Разработка", 6));
    }
    if (devToRes.status === "fulfilled" && Array.isArray(devToRes.value)) {
      for (const a of devToRes.value.slice(0, 6)) {
        const { label, ts } = formatRuDate(a.published_at);
        results.push({
          id: `devto-${a.id}`,
          title: String(a.title || ""),
          summary: String(a.description || ""),
          content: String(a.description || a.title || ""),
          source: "Dev.to",
          category: "Global Tech",
          tags: Array.isArray(a.tag_list) && a.tag_list.length ? a.tag_list.slice(0, 4) : ["tech"],
          url: String(a.url || "https://dev.to"),
          date: label,
          timestamp: ts,
        });
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      items: results,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ items: [], updatedAt: new Date().toISOString() });
  }
}
