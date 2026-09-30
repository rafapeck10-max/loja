import { Armchair, BedDouble, CookingPot, Sofa, Table2, Tv } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/constants";
const icons = {
  armchair: Armchair,
  sofa: Sofa,
  tv: Tv,
  bed: BedDouble,
  "cooking-pot": CookingPot,
  table: Table2,
  mattress: BedDouble,
};
export function FurnitureCategoryIcon({ category }: { category: Category }) {
  const Icon = category.slug === "sala-de-estar" ? Sofa : icons[category.icon];
  return <Icon size={21} strokeWidth={1.8} aria-hidden="true" />;
}
export function categoryDisplayLabel(category: Category, mobile = false) {
  return mobile && category.slug === "dormitorios"
    ? "Quarto"
    : category.slug === "decoracao"
      ? "Decoração"
      : category.shortLabel;
}
export function CategoryNavigation({
  categories,
  activeSlug,
  label = "Categorias",
  variant = "cards",
  mobileCategories,
}: {
  categories: readonly Category[];
  activeSlug?: string;
  label?: string;
  variant?: "cards" | "tabs";
  mobileCategories?: readonly Category[];
}) {
  const render = (category: Category, mobile = false) => (
    <Link
      key={category.slug}
      to="/categoria/$slug"
      params={{ slug: category.slug }}
      search={{ page: 1 }}
      aria-current={category.slug === activeSlug ? "page" : undefined}
      className={category.slug === activeSlug ? "selected" : ""}
    >
      <span className="mobi-category-icon">
        <FurnitureCategoryIcon category={category} />
      </span>
      <span>{categoryDisplayLabel(category, mobile)}</span>
    </Link>
  );
  const mobile =
    mobileCategories ??
    ["sala-de-estar", "cozinha", "dormitorios"].flatMap((slug) =>
      categories.filter((category) => category.slug === slug),
    );
  return (
    <nav aria-label={label}>
      <div
        className={
          variant === "tabs"
            ? "mobi-category-chips mobi-desktop-categories"
            : "mobi-categories mobi-desktop-categories"
        }
      >
        {categories.map((category) => render(category))}
      </div>
      <div className="mobi-mobile-environments">
        {mobile.map((category) => render(category, true))}
      </div>
    </nav>
  );
}
