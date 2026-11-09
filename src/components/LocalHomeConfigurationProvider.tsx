import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getLocalPublicHome } from "../lib/home-local.functions";
import { HomeConfigurationProvider } from "./HomeConfigurationContext";
import { useRouterState } from "@tanstack/react-router";
import { homepageProductsQueryOptions } from "../lib/products.functions";
export function LocalHomeConfigurationProvider({ children }: { children: ReactNode }) {
  const landing = useRouterState({
    select: (s) =>
      s.location.pathname === "/" &&
      !["all", "ofertas", "q", "page"].some(
        (k) => !!(s.location.search as Record<string, unknown>)[k],
      ),
  });
  const snapshot = useQuery({ ...homepageProductsQueryOptions(), enabled: landing });
  const { data } = useQuery({
    queryKey: ["local-home-configuration"],
    queryFn: getLocalPublicHome,
    enabled: !landing,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return (
    <HomeConfigurationProvider
      configuration={landing ? (snapshot.data?.configuration ?? null) : (data?.config ?? null)}
    >
      {children}
    </HomeConfigurationProvider>
  );
}
