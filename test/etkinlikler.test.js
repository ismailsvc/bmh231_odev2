const { test } = require("node:test");
const assert = require("node:assert/strict");
const events = require("../etkinlikler.json");

const supportedTypes = new Set(["atolye", "soylesi", "topluluk"]);

test("en az altı farklı etkinlik içerir", () => {
  assert.ok(events.length >= 6);
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
});

test("her etkinliğin API şemasına ve geçerli bir takvim tarihine uyar", () => {
  for (const event of events) {
    assert.ok(Number.isInteger(event.id) && event.id > 0);
    assert.ok(event.baslik.trim().length > 0);
    assert.ok(supportedTypes.has(event.tur));
    assert.match(event.tarih, /^\d{4}-\d{2}-\d{2}$/);

    const date = new Date(`${event.tarih}T00:00:00.000Z`);
    assert.ok(!Number.isNaN(date.valueOf()));
    assert.equal(date.toISOString().slice(0, 10), event.tarih);

    assert.ok(event.yer.trim().length > 0);
    assert.ok(Number.isInteger(event.kontenjan) && event.kontenjan > 0);
  }
});
