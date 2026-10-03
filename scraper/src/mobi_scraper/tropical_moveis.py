"""Initial Tropical Móveis adapter based on Schema.org JSON-LD."""

import json
import os
import re
from collections.abc import Iterator
from dataclasses import replace
from urllib.parse import urljoin

from scrapling.fetchers import DynamicFetcher

from mobi_scraper.models import ScrapedProduct, utc_timestamp

SUPPLIER_NAME = "Tropical Móveis"


def _walk_products(value: object) -> Iterator[dict[str, object]]:
    """Yield Product objects from common JSON-LD containers and graphs."""
    if isinstance(value, list):
        for item in value:
            yield from _walk_products(item)
        return

    if not isinstance(value, dict):
        return

    type_value = value.get("@type", "")
    types = type_value if isinstance(type_value, list) else [type_value]
    if any(str(item).rsplit("/", 1)[-1] in {"Product", "ProductGroup"} for item in types):
        yield value

    for key in ("@graph", "itemListElement", "mainEntity", "hasVariant"):
        if key in value:
            nested = value[key]
            if key == "itemListElement" and isinstance(nested, list):
                for entry in nested:
                    if isinstance(entry, dict) and "item" in entry:
                        yield from _walk_products(entry["item"])
                    else:
                        yield from _walk_products(entry)
            else:
                yield from _walk_products(nested)


def _number(value: object) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        return float(str(value).replace(",", ".").strip())
    except ValueError:
        return None


def _images(value: object) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    if isinstance(value, dict):
        url = value.get("url") or value.get("contentUrl")
        return [url] if isinstance(url, str) else []
    return []


def _first_text(value: object) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, list):
        for item in value:
            found = _first_text(item)
            if found:
                return found
    if isinstance(value, dict):
        for key in ("name", "value", "@id"):
            found = _first_text(value.get(key))
            if found:
                return found
    return None


def _offers(product: dict[str, object]) -> tuple[float | None, float | None, str | None]:
    offers = product.get("offers")
    offer = offers[0] if isinstance(offers, list) and offers else offers
    if not isinstance(offer, dict):
        return None, None, None

    price = _number(offer.get("price") or offer.get("lowPrice"))
    currency = _first_text(offer.get("priceCurrency"))
    # AggregateOffer.highPrice is a range maximum, not a reliable list price.
    return price, None, currency


def _price_in_reference(reference: str | None) -> float | None:
    if not reference:
        return None
    # Tropical encodes the selling price in the primary TROP reference:
    # TROP 00423 means R$ 423. Use only the first code (the product code),
    # since later codes may describe individual pieces of a furniture set.
    match = re.search(r"\bTROP\s*(\d+)\b", reference, re.IGNORECASE)
    if not match:
        return None
    return float(int(match.group(1)))


def _price_variations(reference: str | None, fallback_name: str) -> list[dict[str, object]]:
    """Extract each priced item from Tropical's multiline TROP references."""
    if not reference:
        return []
    variations: list[dict[str, object]] = []
    seen: set[str] = set()
    for line in reference.splitlines():
        match = re.search(r"\bTROP\s*(\d+)\b", line, re.IGNORECASE)
        if not match:
            continue
        sku = f"TROP {match.group(1)}"
        if sku.casefold() in seen:
            continue
        seen.add(sku.casefold())
        label = line[: match.start()].strip(" \t:-") or fallback_name
        variations.append(
            {"name": label, "sku": sku, "supplier_price": float(int(match.group(1)))}
        )
    return variations


def _split_measurements(measurements: str | None) -> tuple[str | None, str | None]:
    if not measurements:
        return None, None
    paragraphs = re.split(r"\n\s*\n", measurements.strip())
    dimension_pattern = re.compile(
        r"\b(?:Larg(?:ura)?|Alt(?:ura)?|Prof(?:undidade)?)\s*:|\d+(?:[,.]\d+)?\s*m\b",
        re.IGNORECASE,
    )
    dimension_paragraphs = [
        index for index, paragraph in enumerate(paragraphs) if dimension_pattern.search(paragraph)
    ]
    if not dimension_paragraphs:
        return None, measurements.strip() or None
    last_dimension = dimension_paragraphs[-1]
    if last_dimension < len(paragraphs) - 1:
        description = "\n\n".join(paragraphs[last_dimension + 1 :]).strip() or None
        measured = "\n\n".join(paragraphs[: last_dimension + 1]).strip() or None
        return measured, description
    return measurements.strip(), None


def _extract_detail(detail: dict[str, object], product: ScrapedProduct) -> ScrapedProduct:
    blocks = detail.get("blocks")
    if not isinstance(blocks, list):
        return product

    section_values: dict[str, str] = {}
    for index, block in enumerate(blocks[:-1]):
        if isinstance(block, str) and block.strip() in {"Cores", "Referência", "Medidas"}:
            next_block = blocks[index + 1]
            if isinstance(next_block, str):
                section_values[block.strip()] = next_block.strip()

    color_block = section_values.get("Cores", "")
    colors = next((line.strip() for line in color_block.splitlines() if line.strip()), None)
    availability = [
        line.strip()
        for line in color_block.splitlines()
        if re.search(r"\b(?:DISPON[IÍ]VEL|INDISPON[IÍ]VEL)\b", line, re.IGNORECASE)
    ]

    references = section_values.get("Referência")
    measurements = section_values.get("Medidas")
    measurements, description = _split_measurements(measurements)

    images = detail.get("images")
    image_urls = (
        [
            image
            for image in images
            if isinstance(image, str) and "anonymous-" not in image and image.startswith("http")
        ]
        if isinstance(images, list)
        else []
    )
    sku_match = re.search(r"\bTROP\s*\d+\b", references or "", re.IGNORECASE)
    product_url = detail.get("url")
    reference_price = _price_in_reference(references)

    return replace(
        product,
        price=reference_price if reference_price is not None else product.price,
        currency="BRL" if reference_price is not None else product.currency,
        sku=sku_match.group(0) if sku_match else product.sku,
        image_urls=image_urls or product.image_urls,
        product_url=product_url if isinstance(product_url, str) else product.product_url,
        references=references,
        colors=colors,
        availability=availability,
        measurements=measurements,
        description=description,
        price_variations=_price_variations(references, product.name),
    )


def parse_catalog_page(response: object, page_url: str) -> list[ScrapedProduct]:
    """Parse Schema.org products or the rendered Tropical Móveis Glide catalog."""
    products: list[ScrapedProduct] = []
    seen: set[str] = set()

    for raw_script in response.css('script[type="application/ld+json"]::text').getall():
        try:
            payload = json.loads(raw_script)
        except (TypeError, json.JSONDecodeError):
            continue

        for item in _walk_products(payload):
            name = _first_text(item.get("name"))
            if not name:
                continue

            product_url = _first_text(item.get("url"))
            if product_url:
                product_url = urljoin(page_url, product_url)
            dedupe_key = product_url or _first_text(item.get("sku")) or name
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            price, previous_price, currency = _offers(item)
            images = [urljoin(page_url, image) for image in _images(item.get("image"))]
            products.append(
                ScrapedProduct(
                    supplier=SUPPLIER_NAME,
                    name=name,
                    price=price,
                    currency=currency,
                    previous_price=previous_price,
                    image_urls=images,
                    sku=_first_text(item.get("sku") or item.get("mpn")),
                    category=_first_text(item.get("category")),
                    product_url=product_url,
                    scraped_at=utc_timestamp(),
                )
            )

    if products:
        return products

    # Glide renders this catalog as grouped collection cards rather than JSON-LD.
    cards = response.css('div[data-testid^="collection-item-"]')
    for card in cards:
        name = " ".join(part.strip() for part in card.css("p::text").getall() if part.strip())
        if not name:
            continue

        category = card.xpath("ancestor::div[.//h3][1]//h3[1]/text()").get()
        category = category.strip() if isinstance(category, str) and category.strip() else None
        dedupe_key = f"{category or ''}\0{name}".casefold()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        image_urls: list[str] = []
        for selector in ("img::attr(src)", "img::attr(data-src)", "img::attr(srcset)"):
            for source in card.css(selector).getall():
                candidate = source.split(",", 1)[0].strip().split()[0] if source.strip() else ""
                if candidate.startswith("http") and "anonymous-" not in candidate:
                    absolute = urljoin(page_url, candidate)
                    if absolute not in image_urls:
                        image_urls.append(absolute)
        products.append(
            ScrapedProduct(
                supplier=SUPPLIER_NAME,
                name=name,
                price=None,
                currency=None,
                previous_price=None,
                image_urls=image_urls,
                sku=None,
                category=category,
                product_url=None,
                scraped_at=utc_timestamp(),
            )
        )

    return products


def scrape_catalog(
    url: str, detail_limit: int = 0, detail_names: list[str] | None = None
) -> list[ScrapedProduct]:
    """Render the supplier page with Scrapling and parse available catalog rows."""
    detail_pages: list[tuple[int, dict[str, object]]] = []

    def wait_for_catalog(page):
        page.wait_for_function(
            "document.querySelectorAll('[data-testid^=collection-item-]').length > 0",
            timeout=45000,
        )

        cards = page.locator('[data-testid^="collection-item-"]')
        count = cards.count()
        selected = set(range(min(max(detail_limit, 0), count)))
        requested_names = {name.strip().casefold() for name in (detail_names or []) if name.strip()}
        for index in range(count):
            if requested_names and any(
                name in cards.nth(index).inner_text(timeout=5000).casefold()
                for name in requested_names
            ):
                selected.add(index)

        for index in sorted(selected):
            cards.nth(index).click(timeout=15000)
            page.wait_for_function("location.pathname.includes('/r/')", timeout=30000)
            page.wait_for_timeout(1000)
            detail_pages.append((index, page.evaluate(
                    r"""() => ({
                        url: location.href,
                        blocks: [...document.querySelectorAll('[data-testid="wire-container"]')]
                            .map((element) => element.innerText.trim()).filter(Boolean),
                        images: (() => {
                            const sources = new Set();
                            for (const image of document.images) {
                                for (const source of [image.currentSrc, image.src, image.getAttribute('data-src')]) {
                                    if (source && source.startsWith('http')) sources.add(source);
                                }
                                for (const sourceSet of [image.getAttribute('srcset'), image.getAttribute('data-srcset')]) {
                                    if (sourceSet) {
                                        for (const candidate of sourceSet.split(',')) {
                                            const source = candidate.trim().split(/\s+/)[0];
                                            if (source && source.startsWith('http')) sources.add(source);
                                        }
                                    }
                                }
                            }
                            for (const element of document.querySelectorAll('*')) {
                                const background = getComputedStyle(element).backgroundImage;
                                for (const match of background.matchAll(/url\([\"']?(https?:[^\"')]+)[\"']?\)/g)) {
                                    sources.add(match[1]);
                                }
                            }
                            return [...sources];
                        })(),
                    })"""
                )))
            page.go_back(wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function(
                "document.querySelectorAll('[data-testid^=collection-item-]').length > 0",
                timeout=45000,
            )

    response = DynamicFetcher.fetch(
        url,
        headless=True,
        real_chrome=os.getenv("SCRAPER_USE_REAL_CHROME", "").lower() in {"1", "true", "yes"},
        timeout=60000,
        wait=1000,
        page_action=wait_for_catalog,
    )
    products = parse_catalog_page(response, url)
    if not products:
        raise RuntimeError("The Tropical Móveis page rendered without any readable catalog products.")
    for index, detail in detail_pages:
        if index < len(products):
            products[index] = _extract_detail(detail, products[index])
    return products
