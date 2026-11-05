const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const page = fs.readFileSync(
  path.join(__dirname, "..", "public", "index.html"),
  "utf8",
);
const styles = fs.readFileSync(
  path.join(__dirname, "..", "public", "stil.css"),
  "utf8",
);

test("sayfada tek bir ana başlık ve klavyeyle kullanılabilir atlama bağlantısı bulunur", () => {
  assert.equal((page.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.match(page, /<a class="skip-link" href="#icerik">/);
  assert.match(page, /<main id="icerik" class="page-content" tabindex="-1">/);
});

test("form kontrollerinin tümü kimlikleriyle eşleşen görünür etiketlere sahiptir", () => {
  const controlIds = [
    ...page.matchAll(/<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g),
  ].map((match) => match[1]);
  const labelIds = [
    ...page.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.ok(controlIds.length > 0);
  assert.equal(new Set(controlIds).size, controlIds.length);
  for (const id of controlIds) {
    assert.ok(labelIds.includes(id), `Etiket bulunamadı: ${id}`);
  }
});

test("filtre, arama ve sonuç mesajları yardımcı teknolojilere duyurulur", () => {
  assert.match(page, /role="group" aria-label="Etkinlik türüne göre filtrele"/);
  assert.match(page, /id="etkinlik-durumu" class="status-message" role="status"/);
  assert.match(page, /id="etkinlik-listesi"[\s\S]*aria-live="polite"/);
  assert.match(page, /id="form-mesaji" class="form-message" role="status"/);
});

test("mobil kırılım ve görünür klavye odağı stilleri bulunur", () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
