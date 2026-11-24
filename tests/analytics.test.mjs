import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidClarityId,
  isValidGa4Id,
  isValidMetaPixelId,
  readAnalyticsConfig,
  sanitizeCepPrefix,
} from "../src/lib/analytics.ts";

test("validates GA4, Clarity, and Meta Pixel measurement IDs strictly", () => {
  assert.equal(isValidGa4Id("G-AB12CD34EF"), true);
  assert.equal(isValidGa4Id("G-123"), false);
  assert.equal(isValidGa4Id("<script>alert(1)</script>"), false);

  assert.equal(isValidClarityId("abc123def4"), true);
  assert.equal(isValidClarityId("bad id!"), false);

  assert.equal(isValidMetaPixelId("123456789012345"), true);
  assert.equal(isValidMetaPixelId("1234"), false);
});

test("readAnalyticsConfig trims valid IDs and ignores invalid or empty env values", () => {
  const empty = readAnalyticsConfig({});
  assert.deepEqual(empty, {});

  const mixed = readAnalyticsConfig({
    VITE_GA4_ID: " G-9XYZ1234AB ",
    VITE_CLARITY_ID: "invalid-clarity-id!",
    VITE_META_PIXEL_ID: "9876543210987",
  });
  assert.deepEqual(mixed, {
    ga4Id: "G-9XYZ1234AB",
    metaPixelId: "9876543210987",
  });
});

test("sanitizeCepPrefix strips formatting and exposes only 5-digit region prefix", () => {
  assert.equal(sanitizeCepPrefix("26210-000"), "26210");
  assert.equal(sanitizeCepPrefix("26113999"), "26113");
  assert.equal(sanitizeCepPrefix("abc"), "");
});
