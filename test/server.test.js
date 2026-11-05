const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
let server;
let baseUrl;

async function reservePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const { port } = listener.address();
  await new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

before(async () => {
  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["sunucu.js"], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Sunucu ${server.exitCode} koduyla kapandı.`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Sunucu beş saniye içinde hazır olmadı.");
});

after(() => {
  if (server && server.exitCode === null) server.kill();
});

test("ana sayfayı ve statik dosyaları doğru tür ve güvenlik başlığıyla sunar", async () => {
  for (const [pathname, mimeType] of [
    ["/", /text\/html/],
    ["/stil.css", /text\/css/],
    ["/betik.js", /javascript/],
  ]) {
    const response = await fetch(`${baseUrl}${pathname}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), mimeType);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  }

  const html = await (await fetch(baseUrl)).text();
  assert.match(html, /lang="tr"/);
  assert.match(html, /<main id="icerik" class="page-content" tabindex="-1">/);
  assert.match(html, /id="etkinlik-formu"/);
});

test("tüm etkinlikleri ve desteklenen üç etkinlik türünü döndürür", async () => {
  const allResponse = await fetch(`${baseUrl}/api/etkinlikler`);
  assert.equal(allResponse.status, 200);
  assert.equal(
    allResponse.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.ok((await allResponse.json()).length >= 6);

  for (const type of ["atolye", "soylesi", "topluluk"]) {
    const response = await fetch(
      `${baseUrl}/api/etkinlikler?tur=${type}`,
    );
    assert.equal(response.status, 200);
    assert.ok((await response.json()).every((event) => event.tur === type));
  }
});

test("tek etkinliği ve bulunamayan etkinlik için JSON 404 yanıtını döndürür", async () => {
  const found = await fetch(`${baseUrl}/api/etkinlikler/3`);
  assert.equal(found.status, 200);
  assert.equal((await found.json()).id, 3);

  const missing = await fetch(`${baseUrl}/api/etkinlikler/999`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { hata: "Etkinlik bulunamadı" });
});

test("bilinmeyen yolları ve sunucu kaynak dosyalarını erişime kapatır", async () => {
  for (const pathname of [
    "/api/does-not-exist",
    "/sunucu.js",
    "/%2e%2e%2fsunucu.js",
  ]) {
    assert.equal(
      (await fetch(`${baseUrl}${pathname}`)).status,
      404,
      pathname,
    );
  }
});

test("GET dışındaki yöntemleri Allow başlığıyla reddeder", async () => {
  const response = await fetch(`${baseUrl}/api/etkinlikler/2`, {
    method: "DELETE",
  });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});

test("hatalı yüzde kodlaması içeren statik yolu reddeder", async () => {
  const response = await fetch(`${baseUrl}/%ZZ`);
  assert.equal(response.status, 400);
});
