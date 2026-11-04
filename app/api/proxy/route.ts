import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");
  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(
      /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`
    );
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") || "text/html; charset=utf-8";

    if (contentType.includes("text/html")) {
      let html = await upstream.text();
      const baseHref = new URL(".", parsedUrl.toString()).toString();
      const baseTag = `<base href="${baseHref}" />`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      return new NextResponse(html, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#070a0e;color:#f1f5f9;font-family:monospace;padding:24px;">
        <h3 style="color:#f43f5e;margin-top:0;">ОШИБКА СОЕДИНЕНИЯ С РЕСУРСОМ</h3>
        <p style="opacity:0.75;">Не удалось загрузить: ${parsedUrl.toString()}</p>
        <p style="opacity:0.5;font-size:12px;">${err?.message || "Unknown error"}</p>
      </body></html>`,
      {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
