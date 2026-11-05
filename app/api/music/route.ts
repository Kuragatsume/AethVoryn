import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_MUSIC_DIR = "C:\\Users\\dakos\\Downloads\\MediaHuman\\Music";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".m4a",
  ".flac",
  ".wav",
  ".ogg",
  ".aac",
  ".opus",
  ".webm",
]);

const MIME_MAP: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
  ".opus": "audio/opus",
  ".webm": "audio/webm",
};

export type LocalTrack = {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  relPath: string;
  size: number;
};

function scanMusicDir(rootDir: string, currentDir = rootDir, results: LocalTrack[] = []): LocalTrack[] {
  if (!fs.existsSync(currentDir)) return results;
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      scanMusicDir(rootDir, fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!AUDIO_EXTENSIONS.has(ext)) continue;

      let size = 0;
      try {
        size = fs.statSync(fullPath).size;
      } catch {
        continue;
      }

      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      const baseName = path.basename(entry.name, ext);

      // Parse "Artist - Title" if present
      let artist = "MediaHuman Music";
      let title = baseName;
      const dashIdx = baseName.indexOf(" - ");
      if (dashIdx > 0) {
        artist = baseName.slice(0, dashIdx).trim();
        title = baseName.slice(dashIdx + 3).trim();
      } else {
        const subFolder = path.dirname(relPath);
        if (subFolder && subFolder !== ".") {
          artist = subFolder;
        }
      }

      results.push({
        id: relPath,
        title,
        artist,
        fileName: entry.name,
        relPath,
        size,
      });
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customDir = searchParams.get("dir")?.trim();
  const rootDir = customDir || DEFAULT_MUSIC_DIR;
  const fileParam = searchParams.get("file");

  // 1. Stream a specific audio file with HTTP Range support
  if (fileParam) {
    const resolvedRoot = path.resolve(rootDir);
    const resolvedFile = path.resolve(resolvedRoot, fileParam);

    // Prevent directory traversal outside the music root
    if (!resolvedFile.toLowerCase().startsWith(resolvedRoot.toLowerCase())) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!fs.existsSync(resolvedFile)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(resolvedFile);
    const fileSize = stat.size;
    const ext = path.extname(resolvedFile).toLowerCase();
    const contentType = MIME_MAP[ext] || "audio/mpeg";
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkStart = Math.max(0, Math.min(start, fileSize - 1));
      const chunkEnd = Math.max(chunkStart, Math.min(end, fileSize - 1));
      const chunkSize = chunkEnd - chunkStart + 1;

      const nodeStream = fs.createReadStream(resolvedFile, {
        start: chunkStart,
        end: chunkEnd,
      });

      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${chunkStart}-${chunkEnd}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const nodeStream = fs.createReadStream(resolvedFile);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // 2. Otherwise list all audio tracks in the directory
  const tracks = scanMusicDir(rootDir);
  return NextResponse.json({
    folder: rootDir,
    count: tracks.length,
    tracks,
  });
}
