import type { QueryClient } from "@tanstack/react-query";
export function invalidateHomeRevision(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ["produtos", "homepage"] }),
    client.invalidateQueries({ queryKey: ["local-home-configuration"] }),
  ]);
}
