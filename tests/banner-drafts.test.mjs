import assert from "node:assert/strict";
import test from "node:test";
import {
  initialBannerData,
  validateBannerData,
  isSafeBannerDestination,
  validateBannerFile,
  validateBannerImage,
  isBannerVisible,
  removeBanner,
  moveBanner,
  toBannerSlide,
} from "../src/lib/banner-drafts.ts";

// Real 2×3 RGB images encoded by Pillow; validators inspect structure, not pixel decoding.
const rasterFixtures = {
  png: "iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR42mPUCKhgYGBgYmBgQFAAEdQA9mEkEVcAAAAASUVORK5CYII=",
  jpeg: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AIgAwLf/2Q==",
  webp: "UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoCAAMAAUAmJZACdLoAA5gA/vSIh/VcnYnxw/ubHOLZDAAA",
};

test("defaults remain editable copies of the current hero and adapt responsive media", () => {
  const data = initialBannerData();
  assert.deepEqual(validateBannerData(data), []);
  assert.equal(data.banners[0].id, "hero-1");
  data.banners[0].title = "Outra chamada";
  assert.equal(initialBannerData().banners[0].title, "Ambientes que fazem sentido.");
  data.banners[0].mobile_image_url = "https://cdn.example.com/mobile.webp";
  data.banners[0].show_text = false;
  assert.equal(
    toBannerSlide(data.banners[0]).responsiveMedia.mobile,
    "https://cdn.example.com/mobile.webp",
  );
  assert.equal(toBannerSlide(data.banners[0]).responsiveMedia.showText, false);
});

test("destinations accept public Mobi routes and official WhatsApp only", () => {
  for (const url of [
    "/?all=true#catalogo",
    "/categoria/sofas",
    "/produto/abc-123",
    "/links",
    "https://mobimb.com.br/",
    "https://wa.me/5521984324338?text=Oi",
  ])
    assert.equal(isSafeBannerDestination(url), true, url);
  for (const url of [
    "javascript:alert(1)",
    "//evil.com",
    "/admin",
    "/inexistente",
    "/categoria/inexistente",
    "https://mobimb.com.br.evil.com",
    "https://u@mobimb.com.br",
    "http://mobimb.com.br",
    "https://wa.me/000",
    "/%2f%2fevil.com",
    "/\\evil.com",
    "https://mobimb.com.br:444/",
  ])
    assert.equal(isSafeBannerDestination(url), false, url);
});

test("file validation checks MIME, file size and actual raster signature", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  assert.equal(validateBannerFile({ type: "image/png", size: 9 }, png), null);
  assert.match(validateBannerFile({ type: "image/png", size: 1048577 }, png), /1 MB/);
  assert.match(validateBannerFile({ type: "image/svg+xml", size: 9 }, png), /PNG/);
  assert.match(validateBannerFile({ type: "image/jpeg", size: 9 }, png), /conteúdo/);
  assert.match(validateBannerFile({ type: "image/png", size: 0 }, png), /vazio/);
});

test("image references reject SVG and oversized or forged data URLs", () => {
  assert.equal(validateBannerImage("https://images.unsplash.com/photo-123?w=1400"), null);
  assert.equal(validateBannerImage(`data:image/png;base64,${rasterFixtures.png}`), null);
  for (const value of [
    "https://cdn.example.com/a.svg",
    "http://cdn.example.com/a.png",
    "data:image/svg+xml;base64,AAAA",
    "data:image/png;base64,AAAA",
    "//cdn.example.com/a.png",
  ])
    assert.ok(validateBannerImage(value), value);
  assert.ok(validateBannerImage(`data:image/png;base64,${"A".repeat(1500000)}`));
});

test("restored raster data URLs require complete PNG/JPEG/WebP structures", () => {
  for (const [format, base64] of Object.entries(rasterFixtures)) {
    const bytes = Buffer.from(base64, "base64");
    const url = (value) => `data:image/${format};base64,${value.toString("base64")}`;
    assert.equal(validateBannerImage(url(bytes)), null, `${format} valid fixture`);
    for (const size of [8, 16, bytes.length - 1, bytes.length - 5]) {
      assert.ok(
        validateBannerImage(url(bytes.subarray(0, size))),
        `${format} truncated at ${size}`,
      );
    }
    const data = initialBannerData();
    data.banners[0].image_url = url(bytes.subarray(0, 8));
    assert.ok(validateBannerData(data).length, `${format} rejected at restore boundary`);
  }
});

test("PNG chunk bounds and dimensions cannot be forged", () => {
  const original = Buffer.from(rasterFixtures.png, "base64");
  for (const mutate of [
    (bytes) => bytes.writeUInt32BE(0, 16),
    (bytes) => bytes.writeUInt32BE(0xffffffff, 8),
    (bytes) => bytes.write("NOPE", 37),
    (bytes) => bytes.write("NOPE", bytes.length - 8),
  ]) {
    const bytes = Buffer.from(original);
    mutate(bytes);
    assert.ok(validateBannerImage(`data:image/png;base64,${bytes.toString("base64")}`));
  }
});

test("WebP lossless and animated fixtures retain valid frame structures", () => {
  for (const base64 of [
    "UklGRh4AAABXRUJQVlA4TBEAAAAvAYAAEAdQqKIUr4CBiOh/AAA=",
    "UklGRs4AAABXRUJQVlA4WAoAAAASAAAAAQAAAgAAQU5JTQYAAAAAAAAAAABBTk1GUgAAAAAAAAAAAAEAAAIAAGQAAAJBTFBIBwAAAACAgICAgIAAVlA4ICoAAABQAQCdASoCAAMAAUAmJZAABGGAAP70iIf/q787fqe9j//Fv2j+9tiAAABBTk1GSAAAAAAAAAAAAAEAAAIAAGQAAABWUDggMAAAADQBAJ0BKgIAAwAAACYloAADcAD+pNf//ppH/9NI//ppHzFv//nEv/oF/4C8wAAAAA==",
  ])
    assert.equal(validateBannerImage(`data:image/webp;base64,${base64}`), null);
  const bytes = Buffer.from(rasterFixtures.webp, "base64");
  bytes.writeUInt32LE(0xffffffff, 16);
  assert.ok(validateBannerImage(`data:image/webp;base64,${bytes.toString("base64")}`));
});

test("JPEG frames must declare dimensions before complete scan data", () => {
  const original = Buffer.from(rasterFixtures.jpeg, "base64");
  const frame = original.indexOf(Buffer.from([255, 192]));
  const bytes = Buffer.from(original);
  bytes.writeUInt16BE(0, frame + 7);
  assert.ok(validateBannerImage(`data:image/jpeg;base64,${bytes.toString("base64")}`));
});

test("optional Brasília schedule controls visibility and rejects reversed or impossible dates", () => {
  const data = initialBannerData();
  const banner = data.banners[0];
  banner.starts_at = "2026-11-09T10:00";
  banner.ends_at = "2026-11-09T11:00";
  assert.deepEqual(validateBannerData(data), []);
  assert.equal(isBannerVisible(banner, new Date("2026-11-09T12:59:59Z").getTime()), false);
  assert.equal(isBannerVisible(banner, new Date("2026-11-09T13:00:00Z").getTime()), true);
  assert.equal(isBannerVisible(banner, new Date("2026-11-09T14:00:00Z").getTime()), false);
  banner.ends_at = "2026-11-09T09:00";
  assert.ok(validateBannerData(data).some((e) => /fim/i.test(e)));
  banner.starts_at = "2026-02-31T10:00";
  assert.ok(validateBannerData(data).some((e) => /data/i.test(e)));
});

test("removing active media is blocked and order moves keep stable IDs", () => {
  const data = initialBannerData();
  assert.throws(() => removeBanner(data, "hero-1"), /Desative/);
  const moved = moveBanner(data, "hero-1", 1);
  assert.equal(moved.banners[1].id, "hero-1");
  assert.deepEqual(
    moved.banners.map((b) => b.position),
    [1, 2, 3],
  );
  data.banners[0].active = false;
  assert.equal(removeBanner(data, "hero-1").banners.length, 2);
});

test("malformed stored data is reported without throwing", () => {
  for (const data of [null, {}, { banners: [null] }, { banners: [{}] }, { banners: "bad" }])
    assert.ok(validateBannerData(data).length);
  const data = initialBannerData();
  data.banners[0].alt = "";
  assert.ok(validateBannerData(data).some((e) => /alternativo/i.test(e)));
  data.banners[1].id = data.banners[0].id;
  assert.ok(validateBannerData(data).some((e) => /duplicado/i.test(e)));
  const malformed = initialBannerData();
  Object.assign(malformed.banners[0], { name: 1, alt: {}, cta_href: 123, title: 42 });
  assert.ok(validateBannerData(malformed).length);
});

test("aggregate local files cannot exceed the revision storage allowance", () => {
  const data = initialBannerData();
  const bytes = Buffer.alloc(900000);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  data.banners[0].image_url = `data:image/png;base64,${bytes.toString("base64")}`;
  data.banners[0].mobile_image_url = data.banners[0].image_url;
  assert.ok(validateBannerData(data).some((e) => /2 MB/.test(e)));
});
