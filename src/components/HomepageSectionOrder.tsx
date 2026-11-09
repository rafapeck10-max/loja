import { Fragment, type ReactNode } from "react";
import { PAGE_SECTIONS, type PageSection } from "../lib/pages-shelves";
export function HomepageSectionOrder({
  sections = PAGE_SECTIONS.map((s) => ({ ...s, enabled: true })),
  renderSection,
}: {
  sections?: PageSection[];
  renderSection: (section: PageSection) => ReactNode;
}) {
  const seen = new Set<string>();
  return (
    <>
      {sections.map((section) => {
        const definition = PAGE_SECTIONS.find((s) => s.id === section?.id);
        if (
          !definition ||
          definition.type !== section.type ||
          !section.enabled ||
          seen.has(section.id)
        )
          return null;
        seen.add(section.id);
        return <Fragment key={section.id}>{renderSection(section)}</Fragment>;
      })}
    </>
  );
}
