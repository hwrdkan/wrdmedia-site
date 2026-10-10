// Run: npm run test:pergola  (node --test lib/pergola/rules.test.js)
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("./rules.js");
const catalog = require("./catalog.json");

test("defaults produce a valid operable pergola", () => {
  const c = R.normalize(catalog, {});
  assert.equal(c.line, "operable-pergola");
  assert.equal(c.widthIn, 144);
  assert.equal(c.depthIn, 144);
  assert.ok(["classic", "contemporary"].includes(c.style));
});

test("sizes snap to step and clamp to limits", () => {
  const c = R.normalize(catalog, { widthIn: 1000, depthIn: 10 });
  assert.equal(c.widthIn, 360);
  assert.equal(c.depthIn, 96);
  assert.equal(R.normalize(catalog, { widthIn: 147 }).widthIn, 150);
  assert.equal(R.normalize(catalog, { widthIn: "garbage" }).widthIn, 96);
});

test("unsupported choices fall back to the line's first valid choice", () => {
  const c = R.normalize(catalog, { line: "patio-cover", finish: "two-tone" });
  assert.equal(c.finish, "white");
  const bad = R.normalize(catalog, { line: "nope" });
  assert.equal(bad.line, "operable-pergola");
});

test("attached structures never get a screen on the house side", () => {
  const c = R.normalize(catalog, { mount: "attached", options: { screen: ["back", "left", "left", "bogus"] } });
  assert.deepEqual(c.options.screen, ["left"]);
  const f = R.normalize(catalog, { mount: "freestanding", options: { screen: ["back"] } });
  assert.deepEqual(f.options.screen, ["back"]);
});

test("options not offered on a line are dropped", () => {
  const c = R.normalize(catalog, { line: "fixed-pergola", options: { rainSensor: true, tuscany: true } });
  assert.equal(c.options.rainSensor, undefined);
  assert.equal(c.options.tuscany, undefined);
});

test("fixed pergola louver angle is locked", () => {
  const c = R.normalize(catalog, { line: "fixed-pergola", louverAngleDeg: 10 });
  assert.equal(c.louverAngleDeg, 55);
});

test("framing: small freestanding is one bay with 4 posts", () => {
  const f = R.frame(catalog, R.normalize(catalog, { mount: "freestanding", widthIn: 144, depthIn: 144 }));
  assert.equal(f.baysW, 1);
  assert.equal(f.posts, 4);
  assert.equal(f.areaSqft, 144);
});

test("framing: attached drops the back post row", () => {
  const f = R.frame(catalog, R.normalize(catalog, { mount: "attached", widthIn: 144, depthIn: 144 }));
  assert.equal(f.posts, 2);
});

test("framing: wide louvered roof splits into bays", () => {
  const f = R.frame(catalog, R.normalize(catalog, { mount: "freestanding", widthIn: 360, depthIn: 240 }));
  assert.equal(f.baysW, 3); // 360 / 156 blade limit
  assert.equal(f.baysD, 2); // 240 / 192 span limit
  assert.equal(f.posts, 12); // (3+1) posts across x (2+1) rows
});

test("price: range is ordered, rounded and grows with add-ons", () => {
  const base = R.price(catalog, R.normalize(catalog, { mount: "attached" }));
  assert.ok(base.low < base.high);
  assert.equal(base.low % 500, 0);
  const loaded = R.price(catalog, R.normalize(catalog, { mount: "attached", options: { led: true, screen: ["left", "right"], heater: 2 } }));
  assert.ok(loaded.low > base.low && loaded.high > base.high);
  assert.ok(loaded.items.some((i) => i.label.startsWith("Retractable screen × 2")));
});

test("price: operable roof always carries electrical, fixed without power does not", () => {
  const op = R.price(catalog, R.normalize(catalog, { line: "operable-pergola" }));
  assert.ok(op.items.some((i) => i.label === "Electrical allowance"));
  const fx = R.price(catalog, R.normalize(catalog, { line: "fixed-pergola" }));
  assert.ok(!fx.items.some((i) => i.label === "Electrical allowance"));
});

test("price: 12x12 attached operable lands in the published $7,900 to $36,000 band", () => {
  const q = R.price(catalog, R.normalize(catalog, { line: "operable-pergola", mount: "attached" }));
  assert.ok(q.low >= 7900 && q.high <= 36000, `${q.low}-${q.high}`);
});

test("teaser range brackets the exact range", () => {
  const c = R.normalize(catalog, {});
  const t = R.teaser(catalog, c);
  const q = R.price(catalog, c);
  assert.ok(t.low <= q.low && t.high >= q.high);
});

test("dealer pricing overrides the defaults", () => {
  const c = R.normalize(catalog, {});
  const p = JSON.parse(JSON.stringify(catalog.pricing_DEMO_DEFAULTS));
  p.perSqft.motorized = [200, 210];
  assert.ok(R.price(catalog, c, p).low > R.price(catalog, c).high);
});

test("share link round-trips and rejects garbage", () => {
  const c = R.normalize(catalog, { line: "patio-cover", mount: "freestanding", widthIn: 240, options: { fan: 1 } });
  assert.deepEqual(R.decode(catalog, R.encode(c)), c);
  assert.equal(R.decode(catalog, "%%%not-base64"), null);
});

test("summary reads like a sentence", () => {
  const s = R.summary(catalog, R.normalize(catalog, { style: "contemporary", mount: "freestanding", finish: "black", options: { led: true } }));
  assert.match(s, /^Contemporary Operable Pergola, freestanding, 12' × 12' \(144 sq ft\), Black, 4 posts\. Add-ons: LED lighting/);
});

test("patio covers use TEMO model styles; Santa Fe is attached only", () => {
  const c = R.normalize(catalog, { line: "patio-cover", style: "classic" });
  assert.equal(c.style, "studio");
  const sf = R.normalize(catalog, { line: "patio-cover", style: "santa-fe", mount: "freestanding" });
  assert.equal(sf.mount, "attached");
  const cat = R.normalize(catalog, { line: "patio-cover", style: "cathedral", mount: "freestanding" });
  assert.equal(cat.mount, "freestanding");
});

test("skylights only on flat-roof covers, never on cathedral", () => {
  const flat = R.normalize(catalog, { line: "patio-cover", style: "studio", options: { skylights: 2 } });
  assert.equal(flat.options.skylights, 2);
  const gable = R.normalize(catalog, { line: "patio-cover", style: "cathedral", options: { skylights: 2 } });
  assert.equal(gable.options.skylights, undefined);
  assert.ok(!R.price(catalog, gable).items.some((i) => /Skylight/.test(i.label)));
});
