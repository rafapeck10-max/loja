import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_HOMEPAGE_BANNERS, type HomepageBanner } from "@/lib/homepage-banners";

function isMissingHomepageBannersTable(error: { code?: string; message: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message.toLowerCase().includes("homepage_banners") &&
      /schema cache|does not exist|could not find|relation/i.test(error.message))
  );
}

export const getHomepageBanners = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageBanner[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("homepage_banners")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      if (isMissingHomepageBannersTable(error)) return DEFAULT_HOMEPAGE_BANNERS;
      throw new Error(error.message);
    }
    return data?.length ? data : DEFAULT_HOMEPAGE_BANNERS;
  },
);
