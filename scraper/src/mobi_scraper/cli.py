"""Command line entry point for the supplier scraper."""

import argparse
import json
import os
from pathlib import Path

from mobi_scraper.tropical_moveis import scrape_catalog


def load_local_env(path: Path = Path(".env")) -> None:
    """Load simple KEY=value entries without overriding the process environment."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key:
            os.environ.setdefault(key, value)


def main() -> int:
    load_local_env()
    parser = argparse.ArgumentParser(description="Scrape a Tropical Móveis catalog page to JSONL.")
    parser.add_argument("--url", default=os.getenv("TROPICAL_MOVEIS_CATALOG_URL"))
    parser.add_argument("--output", default=os.getenv("SCRAPER_OUTPUT", "./data/tropical-moveis.jsonl"))
    parser.add_argument(
        "--details-limit",
        type=int,
        default=0,
        help="Open and enrich up to this many product detail pages (0 keeps it to list data).",
    )
    parser.add_argument(
        "--detail-name",
        action="append",
        default=[],
        help="Also enrich a product whose name contains this text. May be repeated.",
    )
    args = parser.parse_args()

    if not args.url:
        parser.error("provide --url or set TROPICAL_MOVEIS_CATALOG_URL")

    products = scrape_catalog(args.url, detail_limit=args.details_limit, detail_names=args.detail_name)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as stream:
        for product in products:
            stream.write(json.dumps(product.to_dict(), ensure_ascii=False) + "\n")

    print(f"Saved {len(products)} product(s) to {output}")
    return 0
