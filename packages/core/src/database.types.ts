export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  canva: {
    Tables: {
      assets: {
        Row: {
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string;
          size_bytes: number;
          source_site: string | null;
          source_url: string | null;
          trashed_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type: string;
          size_bytes: number;
          source_site?: string | null;
          source_url?: string | null;
          trashed_at?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string;
          size_bytes?: number;
          source_site?: string | null;
          source_url?: string | null;
          trashed_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      designs: {
        Row: {
          created_at: string;
          design_type: string;
          document: NonNullable<Json>;
          folder_id: string | null;
          height: number;
          id: string;
          source_template_id: string | null;
          starred_at: string | null;
          tags: string[];
          thumbnail: string | null;
          title: string;
          trashed_at: string | null;
          updated_at: string;
          user_id: string;
          width: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          design_type: string;
          document: NonNullable<Json>;
          folder_id?: string | null;
          height: number;
          id?: string;
          source_template_id?: string | null;
          starred_at?: string | null;
          tags?: string[];
          thumbnail?: string | null;
          title: string;
          trashed_at?: string | null;
          updated_at?: string;
          user_id?: string;
          width: number;
        };
        Update: {
          created_at?: string;
          design_type?: string;
          document?: NonNullable<Json>;
          folder_id?: string | null;
          height?: number;
          id?: string;
          source_template_id?: string | null;
          starred_at?: string | null;
          tags?: string[];
          thumbnail?: string | null;
          title?: string;
          trashed_at?: string | null;
          updated_at?: string;
          user_id?: string;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: "designs_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folders";
            referencedColumns: ["id"];
          },
        ];
      };
      folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  community: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      close_friends: {
        Row: {
          created_at: string;
          friend_id: string;
          owner_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          friend_id: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string;
          follower_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          followee_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followee_id?: string;
          follower_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          comments_from: string;
          cover_url: string | null;
          created_at: string;
          display_name: string;
          role: string;
          show_activity_status: boolean;
          show_in_suggestions: boolean;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          comments_from?: string;
          cover_url?: string | null;
          created_at?: string;
          display_name: string;
          role?: string;
          show_activity_status?: boolean;
          show_in_suggestions?: boolean;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          comments_from?: string;
          cover_url?: string | null;
          created_at?: string;
          display_name?: string;
          role?: string;
          show_activity_status?: boolean;
          show_in_suggestions?: boolean;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      profile_stats: {
        Row: {
          follower_count: number | null;
          following_count: number | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          follower_count?: never;
          following_count?: never;
          user_id?: string | null;
        };
        Update: {
          follower_count?: never;
          following_count?: never;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      block_user: { Args: { target: string }; Returns: string };
      follow_suggestions: {
        Args: { max_rows?: number };
        Returns: {
          followed_by: string[];
          followed_by_count: number;
          mutual_count: number;
          user_id: string;
        }[];
      };
      is_blocked_either: { Args: { a: string; b: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  toolboxes: {
    Tables: {
      favorites: {
        Row: {
          created_at: string;
          slug: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          slug: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          slug?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  canva: {
    Enums: {},
  },
  community: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  toolboxes: {
    Enums: {},
  },
} as const;
