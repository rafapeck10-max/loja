export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      homepage_banners: {
        Row: {
          position: number;
          image_url: string;
          eyebrow: string;
          title: string;
          subtitle: string;
          cta_label: string;
          cta_href: string;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          position: number;
          image_url: string;
          eyebrow?: string;
          title: string;
          subtitle?: string;
          cta_label?: string;
          cta_href?: string;
          active?: boolean;
          updated_at?: string;
        };
        Update: {
          position?: number;
          image_url?: string;
          eyebrow?: string;
          title?: string;
          subtitle?: string;
          cta_label?: string;
          cta_href?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      produtos: {
        Row: {
          categoria: string;
          cores: string[] | null;
          created_at: string;
          descricao: string;
          fonte_preco: string | null;
          fornecedor: string | null;
          id: string;
          imagens: string[];
          medidas: string | null;
          nome: string;
          slug: string;
          sku: string | null;
          preco_antigo: number;
          preco_atual: number;
          preco_atacado: number | null;
          preco_mercado: number | null;
          parcelas_sem_juros: number;
          url_imagem: string;
          ordem: number;
          variacoes_preco: Json;
          url_fornecedor: string | null;
          vendas_ultimos_30_dias: number;
          vitrine_semana_ordem: number | null;
          vitrine_novidade: string;
          vitrine_sala: string;
          vitrine_descoberta: boolean;
        };
        Insert: {
          categoria?: string;
          cores?: string[] | null;
          created_at?: string;
          descricao?: string;
          fonte_preco?: string | null;
          fornecedor?: string | null;
          id?: string;
          imagens?: string[];
          medidas?: string | null;
          nome: string;
          slug: string;
          sku?: string | null;
          preco_antigo: number;
          preco_atual: number;
          preco_atacado?: number | null;
          preco_mercado?: number | null;
          parcelas_sem_juros?: number;
          url_imagem: string;
          ordem?: number;
          variacoes_preco?: Json;
          url_fornecedor?: string | null;
          vendas_ultimos_30_dias?: number;
          vitrine_semana_ordem?: number | null;
          vitrine_novidade?: string;
          vitrine_sala?: string;
          vitrine_descoberta?: boolean;
        };
        Update: {
          categoria?: string;
          cores?: string[] | null;
          created_at?: string;
          descricao?: string;
          fonte_preco?: string | null;
          fornecedor?: string | null;
          id?: string;
          imagens?: string[];
          medidas?: string | null;
          nome?: string;
          slug?: string;
          sku?: string | null;
          preco_antigo?: number;
          preco_atual?: number;
          preco_atacado?: number | null;
          preco_mercado?: number | null;
          parcelas_sem_juros?: number;
          url_imagem?: string;
          ordem?: number;
          variacoes_preco?: Json;
          url_fornecedor?: string | null;
          vendas_ultimos_30_dias?: number;
          vitrine_semana_ordem?: number | null;
          vitrine_novidade?: string;
          vitrine_sala?: string;
          vitrine_descoberta?: boolean;
        };
        Relationships: [];
      };
      scraped_products: {
        Row: {
          id: string;
          supplier: string;
          name: string;
          category: string | null;
          supplier_price: number | null;
          price_variations: Json;
          currency: string | null;
          sku: string | null;
          reference: string | null;
          colors: string | null;
          availability: Json;
          measurements: string | null;
          description: string | null;
          image_urls: string[];
          source_url: string | null;
          scraped_at: string | null;
          status: string;
          product_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          supplier: string;
          name: string;
          category?: string | null;
          supplier_price?: number | null;
          price_variations?: Json;
          currency?: string | null;
          sku?: string | null;
          reference?: string | null;
          colors?: string | null;
          availability?: Json;
          measurements?: string | null;
          description?: string | null;
          image_urls?: string[];
          source_url?: string | null;
          scraped_at?: string | null;
          status?: string;
          product_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          supplier?: string;
          name?: string;
          category?: string | null;
          supplier_price?: number | null;
          price_variations?: Json;
          currency?: string | null;
          sku?: string | null;
          reference?: string | null;
          colors?: string | null;
          availability?: Json;
          measurements?: string | null;
          description?: string | null;
          image_urls?: string[];
          source_url?: string | null;
          scraped_at?: string | null;
          status?: string;
          product_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_homepage_curation: {
        Args: { p_weekly_ids: string[]; p_home_settings: Json };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
