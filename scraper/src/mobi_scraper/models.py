"""Normalized output model for supplier catalog records."""

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class ScrapedProduct:
    supplier: str
    name: str
    price: float | None
    currency: str | None
    previous_price: float | None
    image_urls: list[str]
    sku: str | None
    category: str | None
    product_url: str | None
    scraped_at: str
    references: str | None = None
    colors: str | None = None
    availability: list[str] = field(default_factory=list)
    measurements: str | None = None
    description: str | None = None
    price_variations: list[dict[str, object]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
