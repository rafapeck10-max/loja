import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Approved public copy lives in source. Builds validate it without editing files
// or depending on a historical product route's JSX and stylesheet hashes.
const protectedHashes = {
  "src/lib/payment.ts": "3cc4cc6b9ac311959c0ef10bfe56b2a963c32ee5",
  "src/lib/payment-config.ts": "78a5bbdcc7695c1c9d7975b4d2ad5581c2487e85",
  "src/lib/cart-payment.ts": "2d39b3b82192266e2580a801ec27608899b56489",
  "src/components/MobiliLogo.tsx": "0857216907b55d319d225e369e54a47e49942b1b",
  "public/mobi-logo-approved.png": "30d97f6e40d5c604b31f49abb18edc609976781d",
};
for (const [file, expected] of Object.entries(protectedHashes)) {
  const bytes = fs.readFileSync(file);
  const normalized = file.endsWith(".png")
    ? bytes
    : Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"));
  if (crypto.createHash("sha1").update(normalized).digest("hex") !== expected) {
    throw new Error("Protected payment/identity source changed: " + file);
  }
}
function validatePublicCopy(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) validatePublicCopy(file);
    else if (file.endsWith(".tsx") && /sem[ \t]+juros/i.test(fs.readFileSync(file, "utf8"))) {
      throw new Error("Copy differs from approved storefront: " + file);
    }
  }
}
validatePublicCopy("src");
const view = fs.readFileSync("src/components/ProductDetailView.tsx", "utf8");
const assemblyCopy =
  "O produto deve ser montado conforme o manual do fabricante por profissional qualificado. A Mobi não se responsabiliza por danos causados exclusivamente por montagem incorreta ou feita por pessoa não qualificada; esses danos podem não ser cobertos pela garantia do fabricante. Se desejar, podemos indicar um montador. Consulte disponibilidade e valores.";
if (
  !view.includes('aria-label="Atenção à montagem"') ||
  !view.replace(/\s+/g, " ").includes(assemblyCopy)
) {
  throw new Error("Approved assembly notice is missing from product source.");
}
console.log(
  "MOBI_PRODUCT_CHECK: payment, identity and approved public copy preserved; source files unchanged.",
);
