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
      channel_members: {
        Row: {
          channel_id: string;
          cleared_at: string | null;
          inbox_folder: string | null;
          inbox_pinned_at: string | null;
          joined_at: string;
          last_read_seq: number;
          marked_unread: boolean;
          muted: boolean;
          nickname: string | null;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          channel_id: string;
          cleared_at?: string | null;
          inbox_folder?: string | null;
          inbox_pinned_at?: string | null;
          joined_at?: string;
          last_read_seq?: number;
          marked_unread?: boolean;
          muted?: boolean;
          nickname?: string | null;
          role?: string;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          cleared_at?: string | null;
          inbox_folder?: string | null;
          inbox_pinned_at?: string | null;
          joined_at?: string;
          last_read_seq?: number;
          marked_unread?: boolean;
          muted?: boolean;
          nickname?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
      channels: {
        Row: {
          course_tag: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          dm_key: string | null;
          id: string;
          kind: string;
          max_seats: number;
          name: string | null;
        };
        ComputedFields: never;
        Insert: {
          course_tag?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dm_key?: string | null;
          id?: string;
          kind: string;
          max_seats?: number;
          name?: string | null;
        };
        Update: {
          course_tag?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dm_key?: string | null;
          id?: string;
          kind?: string;
          max_seats?: number;
          name?: string | null;
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
      messages: {
        Row: {
          author_id: string;
          channel_id: string;
          client_nonce: string;
          content: string | null;
          created_at: string;
          deleted_at: string | null;
          edited_at: string | null;
          forwarded: boolean;
          id: string;
          last_change: string;
          parent_id: string | null;
          pinned_at: string | null;
          pinned_by: string | null;
          reply_count: number;
          reply_to_id: string | null;
          seq: number;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          channel_id: string;
          client_nonce: string;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          forwarded?: boolean;
          id?: string;
          last_change?: string;
          parent_id?: string | null;
          pinned_at?: string | null;
          pinned_by?: string | null;
          reply_count?: number;
          reply_to_id?: string | null;
          seq?: never;
        };
        Update: {
          author_id?: string;
          channel_id?: string;
          client_nonce?: string;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          forwarded?: boolean;
          id?: string;
          last_change?: string;
          parent_id?: string | null;
          pinned_at?: string | null;
          pinned_by?: string | null;
          reply_count?: number;
          reply_to_id?: string | null;
          seq?: never;
        };
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "message_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "message_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
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
      reactions: {
        Row: {
          created_at: string;
          emoji: string;
          target_id: string;
          target_kind: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          emoji: string;
          target_id: string;
          target_kind: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          target_id?: string;
          target_kind?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      message_view: {
        Row: {
          author_id: string | null;
          channel_id: string | null;
          client_nonce: string | null;
          content: string | null;
          created_at: string | null;
          deleted_at: string | null;
          edited_at: string | null;
          forwarded: boolean | null;
          id: string | null;
          parent_id: string | null;
          pinned_at: string | null;
          pinned_by: string | null;
          reply_count: number | null;
          reply_to: Json | null;
          seq: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "message_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
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
      add_members: { Args: { channel: string; users: string[] }; Returns: number };
      block_user: { Args: { target: string }; Returns: string };
      can_manage: { Args: { channel: string }; Returns: boolean };
      can_see_target: { Args: { kind: string; target: string }; Returns: boolean };
      channel_rows: {
        Args: { max_rows?: number; only_channel?: string; skip?: number };
        Returns: Json[];
      };
      clear_channel: { Args: { channel: string }; Returns: string };
      create_channel: {
        Args: {
          course_tag?: string;
          description?: string;
          kind: string;
          max_seats?: number;
          name: string;
        };
        Returns: string;
      };
      delete_channel: { Args: { channel: string }; Returns: undefined };
      delete_message: { Args: { message: string }; Returns: undefined };
      edit_message: { Args: { body: string; message: string }; Returns: undefined };
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
      is_member: { Args: { channel: string }; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      leave_channel: { Args: { channel: string }; Returns: undefined };
      mark_read: { Args: { channel: string; upto: number }; Returns: undefined };
      mark_unread: { Args: { channel: string }; Returns: undefined };
      my_role: { Args: { channel: string }; Returns: string };
      open_direct: { Args: { group_name?: string; peers: string[] }; Returns: string };
      reaction_summaries: {
        Args: { kind: string; targets: string[] };
        Returns: {
          count: number;
          emoji: string;
          first_at: string;
          reacted_by_me: boolean;
          target_id: string;
        }[];
      };
      remove_member: { Args: { channel: string; target: string }; Returns: undefined };
      require_member: { Args: { channel: string }; Returns: string };
      require_user: { Args: Record<PropertyKey, never>; Returns: string };
      send_message: {
        Args: {
          body: string;
          channel: string;
          is_forward?: boolean;
          nonce: string;
          parent?: string;
          reply_to?: string;
        };
        Returns: string;
      };
      set_nickname: { Args: { channel: string; nick: string; target: string }; Returns: undefined };
      set_pin: { Args: { message: string; pinned: boolean }; Returns: undefined };
      update_channel: {
        Args: { channel: string; new_description?: string; new_name?: string };
        Returns: undefined;
      };
      update_inbox: {
        Args: { channel: string; folder?: string; mute?: boolean; pinned?: boolean };
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
