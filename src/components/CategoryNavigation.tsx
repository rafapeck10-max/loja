import { Armchair, BedDouble, CookingPot, Sofa, Table2, Tv } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/constants";

const CATEGORY_ICONS = {
  armchair: Armchair,
  sofa: Sofa,
  tv: Tv,
  bed: BedDouble,
  "cooking-pot": CookingPot,
  table: Table2,
  mattress: BedDouble,
} as const;

interface CategoryNavigationProps {
  categories: readonly Category[];
  activeSlug?: string;
  label?: string;
  variant?: "cards" | "tabs";
}

export function CategoryNavigation({
  categories,
  activeSlug,
  label = "Categorias de móveis",
  variant = "cards",
}: CategoryNavigationProps) {
  const isTabs = variant === "tabs";

  return (
    <nav aria-label={label} className="min-w-0">
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div
          className={
            isTabs
              ? "flex w-max snap-x snap-mandatory gap-2"
              : "flex w-max snap-x snap-mandatory gap-2.5 lg:grid lg:w-full lg:grid-cols-9"
          }
        >
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.icon];
            const active = activeSlug === category.slug;
            return (
              <Link
                key={category.slug}
                to="/categoria/$slug"
                params={{ slug: category.slug }}
                search={{ page: 1 }}
                aria-current={active ? "page" : undefined}
                className={`group flex snap-start items-center border text-left no-underline transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-[0.98] ${
                  isTabs
                    ? "min-h-10 w-auto gap-2 rounded-full px-3 py-2"
                    : "min-h-[82px] w-[116px] flex-col justify-center gap-2 rounded-xl px-2.5 py-2.5 text-center sm:w-[128px] lg:w-auto"
                } ${
                  active
                    ? "border-deep-green bg-deep-green text-white shadow-premium"
                    : "border-cacau/10 bg-white/90 text-deep-green hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-premium"
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center transition-colors ${
                    isTabs ? "h-6 w-6 rounded-full" : "h-9 w-9 rounded-lg"
                  } ${
                    active
                      ? "bg-gold/20 text-gold"
                      : "bg-sand text-deep-green group-hover:bg-gold/15 group-hover:text-gold-hover"
                  }`}
                >
                  <Icon
                    className={isTabs ? "h-4 w-4" : "h-5 w-5"}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={`${isTabs ? "whitespace-nowrap text-xs" : "text-[11px] sm:text-xs"} font-semibold leading-[1.2] text-balance`}
                >
                  {category.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
