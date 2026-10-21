import assert from "node:assert/strict";
import test from "node:test";
import { firstAvailableImageSource } from "../src/lib/image-fallback.ts";

test("uses the primary image when it has not failed", () => {
  assert.equal(
    firstAvailableImageSource(["https://img.example/main.jpg", "https://img.example/alt.jpg"]),
    "https://img.example/main.jpg",
  );
});

test("uses the first unfailed alternate after the primary image fails", () => {
  assert.equal(
    firstAvailableImageSource(
      [
        "https://img.example/main.jpg",
        "https://img.example/alt.jpg",
        "https://img.example/alt-2.jpg",
      ],
      ["https://img.example/main.jpg"],
    ),
    "https://img.example/alt.jpg",
  );
});

test("returns null when all unique image sources have failed", () => {
  assert.equal(
    firstAvailableImageSource(
      [
        "https://img.example/main.jpg",
        "https://img.example/main.jpg",
        "https://img.example/alt.jpg",
      ],
      ["https://img.example/main.jpg", "https://img.example/alt.jpg"],
    ),
    null,
  );
});
