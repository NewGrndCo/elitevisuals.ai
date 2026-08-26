export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_whitelist: {
        Row: {
          created_at: string;
          email: string;
        };
        Insert: {
          created_at?: string;
          email: string;
        };
        Update: {
          created_at?: string;
          email?: string;
        };
        Relationships: [];
      };
      ai_logos: {
        Row: {
          created_at: string;
          id: string;
          is_published: boolean;
          link_url: string | null;
          logo_url: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          link_url?: string | null;
          logo_url: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          link_url?: string | null;
          logo_url?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          accent_color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          accent_color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          accent_color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      packs: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          hidden_sections: string[];
          id: string;
          is_published: boolean;
          price_cents: number;
          shopify_variant_id: string | null;
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          hidden_sections?: string[];
          id?: string;
          is_published?: boolean;
          price_cents?: number;
          shopify_variant_id?: string | null;
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          hidden_sections?: string[];
          id?: string;
          is_published?: boolean;
          price_cents?: number;
          shopify_variant_id?: string | null;
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          category_id: string | null;
          copy_count: number;
          cover_image_url: string | null;
          created_at: string;
          demo_video_url: string | null;
          description: string | null;
          gallery_urls: string[];
          id: string;
          is_published: boolean;
          pack_id: string | null;
          prompt_text: string;
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          copy_count?: number;
          cover_image_url?: string | null;
          created_at?: string;
          demo_video_url?: string | null;
          description?: string | null;
          gallery_urls?: string[];
          id?: string;
          is_published?: boolean;
          pack_id?: string | null;
          prompt_text?: string;
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          copy_count?: number;
          cover_image_url?: string | null;
          created_at?: string;
          demo_video_url?: string | null;
          description?: string | null;
          gallery_urls?: string[];
          id?: string;
          is_published?: boolean;
          pack_id?: string | null;
          prompt_text?: string;
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompts_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          created_at: string;
          id: string;
          is_membership: boolean;
          item_key: string | null;
          pack_id: string | null;
          shopify_order_id: string | null;
          stripe_session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_membership?: boolean;
          item_key?: string | null;
          pack_id?: string | null;
          shopify_order_id?: string | null;
          stripe_session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_membership?: boolean;
          item_key?: string | null;
          pack_id?: string | null;
          shopify_order_id?: string | null;
          stripe_session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_downloads: {
        Row: {
          downloaded_at: string;
          id: string;
          skill_id: string;
          user_id: string;
          version_id: string;
        };
        Insert: {
          downloaded_at?: string;
          id?: string;
          skill_id: string;
          user_id: string;
          version_id: string;
        };
        Update: {
          downloaded_at?: string;
          id?: string;
          skill_id?: string;
          user_id?: string;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_downloads_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skill_downloads_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "skill_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_entitlements: {
        Row: {
          granted_at: string;
          id: string;
          skill_id: string;
          source: string;
          stripe_session_id: string | null;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          id?: string;
          skill_id: string;
          source: string;
          stripe_session_id?: string | null;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          id?: string;
          skill_id?: string;
          source?: string;
          stripe_session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_entitlements_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_versions: {
        Row: {
          changelog: string;
          created_at: string;
          file_size: number;
          id: string;
          is_published: boolean;
          sha256: string;
          skill_id: string;
          storage_path: string;
          version: string;
        };
        Insert: {
          changelog?: string;
          created_at?: string;
          file_size: number;
          id?: string;
          is_published?: boolean;
          sha256: string;
          skill_id: string;
          storage_path: string;
          version: string;
        };
        Update: {
          changelog?: string;
          created_at?: string;
          file_size?: number;
          id?: string;
          is_published?: boolean;
          sha256?: string;
          skill_id?: string;
          storage_path?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_versions_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          compatibility: string[];
          cover_image_url: string | null;
          created_at: string;
          description: string;
          id: string;
          install_instructions: string;
          is_featured: boolean;
          is_published: boolean;
          price_cents: number;
          slug: string;
          sort_order: number;
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          compatibility?: string[];
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          install_instructions?: string;
          is_featured?: boolean;
          is_published?: boolean;
          price_cents?: number;
          slug: string;
          sort_order?: number;
          summary?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          compatibility?: string[];
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          install_instructions?: string;
          is_featured?: boolean;
          is_published?: boolean;
          price_cents?: number;
          slug?: string;
          sort_order?: number;
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_prompt_copy: { Args: { _slug: string }; Returns: number };
    };
    Enums: {
      app_role: "admin" | "user";
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
