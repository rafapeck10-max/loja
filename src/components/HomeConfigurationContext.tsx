import { createContext, useContext, type ReactNode } from "react";
import type { HomeConfiguration } from "../lib/home-configuration";
const Context = createContext<HomeConfiguration | null>(null);
export function HomeConfigurationProvider({
  configuration,
  children,
}: {
  configuration: HomeConfiguration | null;
  children: ReactNode;
}) {
  return <Context.Provider value={configuration}>{children}</Context.Provider>;
}
export const useHomeConfiguration = () => useContext(Context);
