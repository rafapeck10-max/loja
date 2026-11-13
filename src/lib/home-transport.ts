import type { HomeDocument, HomeDraftInput } from "./home-configuration";
export type HomeTransportCommand = { expected: number } & (
  { action: "save" } | { action: "review" | "apply" | "restore"; id: number }
);
export interface HomeTransport {
  publicPreviewHref?: string;
  read: () => Promise<{ enabled: boolean; document?: HomeDocument }>;
  change: (
    command: HomeTransportCommand,
    draft?: HomeDraftInput,
  ) => Promise<{ enabled: boolean; document?: HomeDocument }>;
}
