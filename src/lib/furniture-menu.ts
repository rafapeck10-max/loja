import { getCategory, getSubcategories } from "./constants.ts";

export interface FurnitureMenuLink {
  label: string;
  slug: string;
}

export interface FurnitureMenuSection {
  title?: string;
  slug?: string;
  links: readonly FurnitureMenuLink[];
}

export interface FurnitureMenuColumn {
  title: string;
  slug?: string;
  sections: readonly FurnitureMenuSection[];
}

function categoryLink(slug: string): FurnitureMenuLink {
  const category = getCategory(slug);
  if (!category) throw new Error(`Categoria de navegação não encontrada: ${slug}`);
  return { label: category.label, slug: category.slug };
}

function childrenOf(slug: string): FurnitureMenuLink[] {
  return getSubcategories(slug).map((category) => categoryLink(category.slug));
}

function sectionFor(slug: string): FurnitureMenuSection {
  const category = getCategory(slug);
  if (!category) throw new Error(`Grupo de navegação não encontrado: ${slug}`);
  return { title: category.label, slug: category.slug, links: childrenOf(category.slug) };
}

export const FURNITURE_MENU_COLUMNS: readonly FurnitureMenuColumn[] = [
  {
    title: categoryLink("sala-de-estar").label,
    slug: "sala-de-estar",
    sections: [
      {
        links: [
          ...childrenOf("sofas"),
          categoryLink("poltronas"),
          ...childrenOf("paineis"),
          categoryLink("mesas-laterais"),
        ],
      },
    ],
  },
  {
    title: categoryLink("dormitorios").label,
    slug: "dormitorios",
    sections: [{ links: childrenOf("dormitorios") }],
  },
  {
    title: categoryLink("cozinha").label,
    slug: "cozinha",
    sections: [{ links: childrenOf("cozinha") }],
  },
  {
    title: "Jantar e complementos",
    sections: [
      sectionFor("salas-de-jantar"),
      sectionFor("colchoes-e-bases"),
      {
        ...sectionFor("decoracao"),
        links: childrenOf("decoracao").filter((link) => link.slug !== "mesas-laterais"),
      },
    ],
  },
];
