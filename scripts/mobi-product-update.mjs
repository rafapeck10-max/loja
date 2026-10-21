import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const protectedHashes={"src/lib/constants.ts":"8d120f35887786aebb99cec54b60118d29940ad4","src/lib/payment.ts":"3cc4cc6b9ac311959c0ef10bfe56b2a963c32ee5","src/lib/payment-config.ts":"78a5bbdcc7695c1c9d7975b4d2ad5581c2487e85","src/lib/cart-payment.ts":"2d39b3b82192266e2580a801ec27608899b56489","src/components/MobiliLogo.tsx":"0857216907b55d319d225e369e54a47e49942b1b","src/components/StoreCatalog.tsx":"32e11b622bc74d12268b24e627362fe4c5483024","src/lib/home-curation.ts":"4ea5d454fce04a9ae22ba1765704082f585c1d0c","src/storefront.css":"e97e0e939e563a4e9289880f1702ea419bffd97a","public/mobi-logo-approved.png":"30d97f6e40d5c604b31f49abb18edc609976781d"};
const sha=p=>{const bytes=fs.readFileSync(p);const normalized=p.endsWith(".png")?bytes:Buffer.from(bytes.toString("utf8").replace(/\r\n/g,"\n"));return crypto.createHash("sha1").update(normalized).digest("hex");};
for(const [p,h] of Object.entries(protectedHashes))if(sha(p)!==h)throw new Error("Unexpected baseline: "+p);
const productPath="src/routes/produto.$id.tsx";
if(sha(productPath)!=="ecbb7d727c35a0e50cc97db77a812e4746b92aa1")throw new Error("Unexpected product-page baseline");
const changed=[];
const phrase=/(?:[ \t]*[·•][ \t]*)?sem[ \t]+juros/gi;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".tsx")){const before=fs.readFileSync(p,"utf8");const count=[...before.matchAll(phrase)].length;if(count){fs.writeFileSync(p,before.replace(phrase,""));changed.push({path:p,phrasesRemoved:count});}}}}
walk("src");
let product=fs.readFileSync(productPath,"utf8");
const anchor=/<div className="mt-6 grid gap-3 sm:grid-cols-2">(?=\r?\n[ \t]*<button\r?\n[ \t]*onClick=\{handleBuyNow\})/g;
if([...product.matchAll(anchor)].length!==1)throw new Error("Expected one purchase-button section");
if(product.includes('aria-label="Atenção à montagem"'))throw new Error("Assembly notice already exists");
const eol=product.includes("\r\n")?"\r\n":"\n";
product=product.replace(anchor,"<aside aria-label=\"Atenção à montagem\" className=\"mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-cacau\"><p className=\"font-semibold text-deep-green\">Atenção à montagem</p><p className=\"mt-2\">O produto deve ser montado conforme o manual do fabricante por profissional qualificado. A Mobi não se responsabiliza por danos causados exclusivamente por montagem incorreta ou feita por pessoa não qualificada; esses danos podem não ser cobertos pela garantia do fabricante. Se desejar, podemos indicar um montador. Consulte disponibilidade e valores.</p></aside>"+eol+eol+"          "+'<div className="mt-6 grid gap-3 sm:grid-cols-2">');
fs.writeFileSync(productPath,product);
for(const [p,h] of Object.entries(protectedHashes))if(sha(p)!==h)throw new Error("Protected file changed: "+p);
console.log("MOBI_PRODUCT_UPDATE "+JSON.stringify({phrasesRemoved:changed,assemblyInsertedBeforePurchase:true,protectedFilesUnchanged:Object.keys(protectedHashes).length,productSha:sha(productPath)}));

