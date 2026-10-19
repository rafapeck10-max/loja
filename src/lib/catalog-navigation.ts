import { getCategory, categoryMatches } from "./constants.ts";
export const catalogEnvironments = [
  "sala-de-estar",
  "dormitorios",
  "cozinha",
  "salas-de-jantar",
  "colchoes-e-bases",
  "decoracao",
].map((slug) => getCategory(slug)!);
export function catalogRoom(category: string, preferred = "all") {
  if (category === "all") return undefined;
  const preferredRoom = catalogEnvironments.find((room) => room.slug === preferred);
  if (
    preferredRoom &&
    (category === preferred || categoryMatches(getCategory(category)?.dbLabels[0] ?? "", preferred))
  )
    return preferredRoom;
  return catalogEnvironments.find(
    (room) =>
      room.slug === category ||
      categoryMatches(getCategory(category)?.dbLabels[0] ?? "", room.slug),
  );
}
