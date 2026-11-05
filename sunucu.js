const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const PUBLIC_DIRECTORY = path.join(__dirname, "public");
const EVENTS_FILE = path.join(__dirname, "etkinlikler.json");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function loadEvents() {
  const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
  if (!Array.isArray(events)) {
    throw new TypeError("etkinlikler.json bir etkinlik dizisi içermelidir.");
  }
  return events;
}

const events = loadEvents();

function sendText(response, statusCode, message, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(message);
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(data));
}

function isOutsideDirectory(directory, candidate) {
  const relativePath = path.relative(directory, candidate);
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

async function serveStaticFile(response, requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    sendText(response, 400, "Geçersiz dosya yolu.");
    return;
  }

  const relativePath =
    decodedPath === "/" ? "index.html" : decodedPath.replace(/^[/\\]+/, "");
  const filePath = path.resolve(PUBLIC_DIRECTORY, relativePath);
  if (isOutsideDirectory(PUBLIC_DIRECTORY, filePath)) {
    sendText(response, 404, "Sayfa bulunamadı.");
    return;
  }

  try {
    const publicDirectory = await fs.promises.realpath(PUBLIC_DIRECTORY);
    const realFilePath = await fs.promises.realpath(filePath);
    if (isOutsideDirectory(publicDirectory, realFilePath)) {
      sendText(response, 404, "Sayfa bulunamadı.");
      return;
    }

    const file = await fs.promises.readFile(realFilePath);
    const contentType =
      MIME_TYPES[path.extname(realFilePath).toLowerCase()] ||
      "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendText(response, 404, "Sayfa bulunamadı.");
      return;
    }

    console.error("Statik dosya okunamadı:", error);
    sendText(response, 500, "Sunucu hatası.");
  }
}

async function handleRequest(request, response) {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, "http://localhost");
  } catch {
    sendText(response, 400, "Geçersiz istek.");
    return;
  }

  if (request.method !== "GET") {
    sendText(response, 405, "Yalnızca GET istekleri desteklenir.", {
      Allow: "GET",
    });
    return;
  }

  const pathname = requestUrl.pathname;
  if (pathname === "/api/etkinlikler") {
    const type = requestUrl.searchParams.get("tur");
    const matchingEvents = type
      ? events.filter((event) => event.tur === type)
      : events;
    sendJson(response, 200, matchingEvents);
    return;
  }

  const eventMatch = pathname.match(/^\/api\/etkinlikler\/(\d+)$/);
  if (eventMatch) {
    const event = events.find((item) => item.id === Number(eventMatch[1]));
    if (!event) {
      sendJson(response, 404, { hata: "Etkinlik bulunamadı" });
      return;
    }
    sendJson(response, 200, event);
    return;
  }

  if (pathname.startsWith("/api/")) {
    sendText(response, 404, "API yolu bulunamadı.");
    return;
  }

  await serveStaticFile(response, pathname);
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("PORT, 1 ile 65535 arasında bir tam sayı olmalıdır.");
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error("İstek işlenemedi:", error);
    if (!response.headersSent) {
      sendText(response, 500, "Sunucu hatası.");
    } else {
      response.destroy(error);
    }
  });
});

server.on("error", (error) => {
  console.error("Sunucu başlatılamadı:", error);
  process.exitCode = 1;
});

server.listen(port, () => {
  console.log(`Kampüs Etkinlik Panosu http://localhost:${port} adresinde hazır.`);
});