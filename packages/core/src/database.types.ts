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
      assets: {
        Row: {
          blocked_reason: string | null;
          bucket: string;
          created_at: string;
          file_name: string;
          id: string;
          kind: string;
          message_id: string | null;
          mime_type: string;
          object_path: string;
          owner_id: string;
          size_bytes: number;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_reason?: string | null;
          bucket: string;
          created_at?: string;
          file_name: string;
          id?: string;
          kind: string;
          message_id?: string | null;
          mime_type: string;
          object_path: string;
          owner_id?: string;
          size_bytes: number;
          status?: string;
        };
        Update: {
          blocked_reason?: string | null;
          bucket?: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          kind?: string;
          message_id?: string | null;
          mime_type?: string;
          object_path?: string;
          owner_id?: string;
          size_bytes?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "message_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          metadata: NonNullable<Json>;
          target_id: string | null;
          target_kind: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          target_id?: string | null;
          target_kind?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: NonNullable<Json>;
          target_id?: string | null;
          target_kind?: string | null;
        };
        Relationships: [];
      };
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
      bookmark_collection_items: {
        Row: {
          collection_id: string;
          created_at: string;
          owner_id: string;
          target_id: string;
          target_kind: string;
        };
        ComputedFields: never;
        Insert: {
          collection_id: string;
          created_at?: string;
          owner_id?: string;
          target_id: string;
          target_kind: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          owner_id?: string;
          target_id?: string;
          target_kind?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmark_collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "bookmark_collection_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmark_collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "bookmark_collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmark_collection_items_owner_id_target_kind_target_id_fkey";
            columns: ["owner_id", "target_kind", "target_id"];
            isOneToOne: false;
            referencedRelation: "bookmark_view";
            referencedColumns: ["user_id", "target_kind", "target_id"];
          },
          {
            foreignKeyName: "bookmark_collection_items_owner_id_target_kind_target_id_fkey";
            columns: ["owner_id", "target_kind", "target_id"];
            isOneToOne: false;
            referencedRelation: "bookmarks";
            referencedColumns: ["user_id", "target_kind", "target_id"];
          },
        ];
      };
      bookmark_collections: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          created_at: string;
          target_id: string;
          target_kind: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          target_id: string;
          target_kind: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          target_id?: string;
          target_kind?: string;
          user_id?: string;
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
      highlight_items: {
        Row: {
          highlight_id: string;
          position: number;
          story_id: string;
        };
        ComputedFields: never;
        Insert: {
          highlight_id: string;
          position: number;
          story_id: string;
        };
        Update: {
          highlight_id?: string;
          position?: number;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlight_items_highlight_id_fkey";
            columns: ["highlight_id"];
            isOneToOne: false;
            referencedRelation: "highlight_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlight_items_highlight_id_fkey";
            columns: ["highlight_id"];
            isOneToOne: false;
            referencedRelation: "highlights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlight_items_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlight_items_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "story_feed";
            referencedColumns: ["id"];
          },
        ];
      };
      highlights: {
        Row: {
          cover_story_id: string | null;
          created_at: string;
          id: string;
          owner_id: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cover_story_id?: string | null;
          created_at?: string;
          id?: string;
          owner_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cover_story_id?: string | null;
          created_at?: string;
          id?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_cover_story_id_fkey";
            columns: ["cover_story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_cover_story_id_fkey";
            columns: ["cover_story_id"];
            isOneToOne: false;
            referencedRelation: "story_feed";
            referencedColumns: ["id"];
          },
        ];
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
          embed_kind: string | null;
          embed_ref: string | null;
          forwarded: boolean;
          id: string;
          last_change: string;
          parent_id: string | null;
          pinned_at: string | null;
          pinned_by: string | null;
          reply_count: number;
          reply_to_id: string | null;
          seq: number;
          story_reply_emoji: string | null;
          story_reply_kind: string | null;
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
          embed_kind?: string | null;
          embed_ref?: string | null;
          forwarded?: boolean;
          id?: string;
          last_change?: string;
          parent_id?: string | null;
          pinned_at?: string | null;
          pinned_by?: string | null;
          reply_count?: number;
          reply_to_id?: string | null;
          seq?: never;
          story_reply_emoji?: string | null;
          story_reply_kind?: string | null;
        };
        Update: {
          author_id?: string;
          channel_id?: string;
          client_nonce?: string;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          embed_kind?: string | null;
          embed_ref?: string | null;
          forwarded?: boolean;
          id?: string;
          last_change?: string;
          parent_id?: string | null;
          pinned_at?: string | null;
          pinned_by?: string | null;
          reply_count?: number;
          reply_to_id?: string | null;
          seq?: never;
          story_reply_emoji?: string | null;
          story_reply_kind?: string | null;
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
      notes: {
        Row: {
          audience: string;
          created_at: string;
          expires_at: string;
          text: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          audience?: string;
          created_at?: string;
          expires_at?: string;
          text: string;
          user_id: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          expires_at?: string;
          text?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          comment_likes: boolean;
          comments: string;
          group_requests: boolean;
          likes: string;
          mentions: string;
          message_requests: boolean;
          messages: string;
          new_followers: boolean;
          paused_until: string | null;
          reposts: boolean;
          story_replies: boolean;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment_likes?: boolean;
          comments?: string;
          group_requests?: boolean;
          likes?: string;
          mentions?: string;
          message_requests?: boolean;
          messages?: string;
          new_followers?: boolean;
          paused_until?: string | null;
          reposts?: boolean;
          story_replies?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          comment_likes?: boolean;
          comments?: string;
          group_requests?: boolean;
          likes?: string;
          mentions?: string;
          message_requests?: boolean;
          messages?: string;
          new_followers?: boolean;
          paused_until?: string | null;
          reposts?: boolean;
          story_replies?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          payload: Json | null;
          read_at: string | null;
          ref_id: string;
          silent: boolean;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          payload?: Json | null;
          read_at?: string | null;
          ref_id: string;
          silent?: boolean;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          payload?: Json | null;
          read_at?: string | null;
          ref_id?: string;
          silent?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          post_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_media: {
        Row: {
          asset_id: string;
          position: number;
          post_id: string;
        };
        ComputedFields: never;
        Insert: {
          asset_id: string;
          position: number;
          post_id: string;
        };
        Update: {
          asset_id?: string;
          position?: number;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          comment_count: number;
          content: string;
          course_tag: string | null;
          created_at: string;
          id: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string;
          comment_count?: number;
          content?: string;
          course_tag?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
        };
        Update: {
          author_id?: string;
          comment_count?: number;
          content?: string;
          course_tag?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          comments_from: string;
          cover_asset_id: string | null;
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
          cover_asset_id?: string | null;
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
          cover_asset_id?: string | null;
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
        Relationships: [
          {
            foreignKeyName: "profiles_cover_asset_id_fkey";
            columns: ["cover_asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
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
      reel_comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "reel_comment_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "reel_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          like_count: number;
          parent_id: string | null;
          reel_id: string;
          reply_count: number;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          like_count?: number;
          parent_id?: string | null;
          reel_id: string;
          reply_count?: number;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          like_count?: number;
          parent_id?: string | null;
          reel_id?: string;
          reply_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reel_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "reel_comment_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "reel_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reel_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_likes: {
        Row: {
          created_at: string;
          reel_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          reel_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          reel_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reel_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_likes_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_reposts: {
        Row: {
          created_at: string;
          reel_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          reel_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          reel_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_reposts_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reel_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_reposts_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_views: {
        Row: {
          reel_id: string;
          user_id: string;
          viewed_at: string;
        };
        ComputedFields: never;
        Insert: {
          reel_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          reel_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reel_views_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reel_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_views_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reels: {
        Row: {
          asset_id: string;
          author_id: string;
          caption: string | null;
          created_at: string;
          duration_ms: number;
          id: string;
          like_count: number;
          repost_count: number;
          title: string;
          view_count: number;
        };
        ComputedFields: never;
        Insert: {
          asset_id: string;
          author_id: string;
          caption?: string | null;
          created_at?: string;
          duration_ms: number;
          id?: string;
          like_count?: number;
          repost_count?: number;
          title: string;
          view_count?: number;
        };
        Update: {
          asset_id?: string;
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          duration_ms?: number;
          id?: string;
          like_count?: number;
          repost_count?: number;
          title?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reels_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      stories: {
        Row: {
          asset_id: string;
          author_id: string;
          caption: string | null;
          created_at: string;
          expires_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          asset_id: string;
          author_id: string;
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
        };
        Update: {
          asset_id?: string;
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      story_views: {
        Row: {
          story_id: string;
          user_id: string;
          viewed_at: string;
        };
        ComputedFields: never;
        Insert: {
          story_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          story_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "story_feed";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      bookmark_collection_view: {
        Row: {
          cover: Json | null;
          created_at: string | null;
          id: string | null;
          item_count: number | null;
          name: string | null;
          owner_id: string | null;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          cover?: never;
          created_at?: string | null;
          id?: string | null;
          item_count?: never;
          name?: string | null;
          owner_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cover?: never;
          created_at?: string | null;
          id?: string | null;
          item_count?: never;
          name?: string | null;
          owner_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      bookmark_view: {
        Row: {
          author_id: string | null;
          created_at: string | null;
          target_id: string | null;
          target_kind: string | null;
          title: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      highlight_view: {
        Row: {
          cover_kind: string | null;
          cover_path: string | null;
          cover_story_id: string | null;
          created_at: string | null;
          id: string | null;
          item_count: number | null;
          owner_id: string | null;
          title: string | null;
          updated_at: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "highlights_cover_story_id_fkey";
            columns: ["cover_story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_cover_story_id_fkey";
            columns: ["cover_story_id"];
            isOneToOne: false;
            referencedRelation: "story_feed";
            referencedColumns: ["id"];
          },
        ];
      };
      message_view: {
        Row: {
          attachments: Json | null;
          author_id: string | null;
          channel_id: string | null;
          client_nonce: string | null;
          content: string | null;
          created_at: string | null;
          deleted_at: string | null;
          edited_at: string | null;
          embed_kind: string | null;
          embed_ref: string | null;
          forwarded: boolean | null;
          id: string | null;
          parent_id: string | null;
          pinned_at: string | null;
          pinned_by: string | null;
          reply_count: number | null;
          reply_to: Json | null;
          seq: number | null;
          story_reply_emoji: string | null;
          story_reply_kind: string | null;
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
      my_comments: {
        Row: {
          content: string | null;
          created_at: string | null;
          id: string | null;
          target_author_id: string | null;
          target_id: string | null;
          target_kind: string | null;
          target_title: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      my_post_reactions: {
        Row: {
          author_id: string | null;
          content: string | null;
          emoji: string | null;
          media: Json | null;
          post_id: string | null;
          reacted_at: string | null;
          title: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      post_view: {
        Row: {
          author_id: string | null;
          can_comment: boolean | null;
          comment_count: number | null;
          content: string | null;
          course_tag: string | null;
          created_at: string | null;
          id: string | null;
          media: Json | null;
          title: string | null;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          can_comment?: never;
          comment_count?: number | null;
          content?: string | null;
          course_tag?: string | null;
          created_at?: string | null;
          id?: string | null;
          media?: never;
          title?: string | null;
        };
        Update: {
          author_id?: string | null;
          can_comment?: never;
          comment_count?: number | null;
          content?: string | null;
          course_tag?: string | null;
          created_at?: string | null;
          id?: string | null;
          media?: never;
          title?: string | null;
        };
        Relationships: [];
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
      reel_comment_view: {
        Row: {
          author_id: string | null;
          content: string | null;
          created_at: string | null;
          id: string | null;
          like_count: number | null;
          liked_by_me: boolean | null;
          parent_id: string | null;
          reel_id: string | null;
          reply_count: number | null;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string | null;
          like_count?: number | null;
          liked_by_me?: never;
          parent_id?: string | null;
          reel_id?: string | null;
          reply_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string | null;
          like_count?: number | null;
          liked_by_me?: never;
          parent_id?: string | null;
          reel_id?: string | null;
          reply_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reel_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "reel_comment_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "reel_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reel_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey";
            columns: ["reel_id"];
            isOneToOne: false;
            referencedRelation: "reels";
            referencedColumns: ["id"];
          },
        ];
      };
      reel_view: {
        Row: {
          asset_id: string | null;
          author_id: string | null;
          can_comment: boolean | null;
          caption: string | null;
          comment_count: number | null;
          created_at: string | null;
          duration_ms: number | null;
          id: string | null;
          like_count: number | null;
          liked_by_me: boolean | null;
          repost_count: number | null;
          reposted_by_me: boolean | null;
          title: string | null;
          video_path: string | null;
          view_count: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "reels_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      story_feed: {
        Row: {
          asset_id: string | null;
          author_id: string | null;
          caption: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string | null;
          kind: string | null;
          path: string | null;
          view_count: number | null;
          viewed_by_me: boolean | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "stories_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: true;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_comment: { Args: { body: string; post: string }; Returns: string };
      add_members: { Args: { channel: string; users: string[] }; Returns: number };
      add_reel_comment: { Args: { body: string; parent?: string; reel: string }; Returns: string };
      asset_in_use: { Args: { asset: string }; Returns: boolean };
      audit: {
        Args: { action: string; metadata: Json; target_id: string; target_kind: string };
        Returns: undefined;
      };
      block_user: { Args: { target: string }; Returns: string };
      can_comment: { Args: { owner: string }; Returns: boolean };
      can_manage: { Args: { channel: string }; Returns: boolean };
      can_read_asset: { Args: { asset: string }; Returns: boolean };
      can_see_note: { Args: { audience: string; owner: string }; Returns: boolean };
      can_see_reel: { Args: { reel: string }; Returns: boolean };
      can_see_story: { Args: { story: string }; Returns: boolean };
      can_see_target: { Args: { kind: string; target: string }; Returns: boolean };
      channel_rows: {
        Args: { max_rows?: number; only_channel?: string; skip?: number };
        Returns: Json[];
      };
      check_highlight: {
        Args: { cover: string; story_ids: string[]; title: string };
        Returns: undefined;
      };
      claim_assets: { Args: { assets: string[]; kinds: string[] }; Returns: undefined };
      clear_channel: { Args: { channel: string }; Returns: string };
      commit_asset: {
        Args: { asset: string };
        Returns: {
          blocked_reason: string | null;
          bucket: string;
          created_at: string;
          file_name: string;
          id: string;
          kind: string;
          message_id: string | null;
          mime_type: string;
          object_path: string;
          owner_id: string;
          size_bytes: number;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "assets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
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
      create_highlight: {
        Args: { cover?: string; story_ids: string[]; title: string };
        Returns: string;
      };
      create_post: {
        Args: { asset_ids?: string[]; content?: string; course_tag?: string; title?: string };
        Returns: string;
      };
      create_reel: {
        Args: { asset: string; caption?: string; duration_ms: number; title: string };
        Returns: string;
      };
      create_story: { Args: { asset: string; caption?: string }; Returns: string };
      create_upload_intent: {
        Args: { bucket: string; content_type?: string; file_name: string; size_bytes: number };
        Returns: {
          id: string;
          mime: string;
          path: string;
        }[];
      };
      delete_asset: { Args: { asset: string }; Returns: string };
      delete_channel: { Args: { channel: string }; Returns: undefined };
      delete_comment: { Args: { comment: string; post: string }; Returns: undefined };
      delete_message: { Args: { message: string }; Returns: undefined };
      delete_post: { Args: { post: string }; Returns: string[] };
      delete_reel: { Args: { reel: string }; Returns: string };
      delete_reel_comment: { Args: { comment: string }; Returns: undefined };
      delete_story: { Args: { story: string }; Returns: string };
      edit_message: { Args: { body: string; message: string }; Returns: undefined };
      file_type: { Args: { file_name: string; hint?: string }; Returns: Record<string, unknown> };
      follow_suggestions: {
        Args: { max_rows?: number };
        Returns: {
          followed_by: string[];
          followed_by_count: number;
          mutual_count: number;
          user_id: string;
        }[];
      };
      inbox_folder_of: { Args: { channel: string; member: string }; Returns: string };
      is_blocked_either: { Args: { a: string; b: string }; Returns: boolean };
      is_member: { Args: { channel: string }; Returns: boolean };
      is_muted: { Args: { channel: string; member: string }; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      leave_channel: { Args: { channel: string }; Returns: undefined };
      like_reel: { Args: { liked: boolean; reel: string }; Returns: number };
      like_reel_comment: { Args: { comment: string; liked: boolean }; Returns: number };
      mark_all_notifications_read: { Args: Record<PropertyKey, never>; Returns: number };
      mark_notification_read: { Args: { notification: string }; Returns: number };
      mark_read: { Args: { channel: string; upto: number }; Returns: undefined };
      mark_unread: { Args: { channel: string }; Returns: undefined };
      my_role: { Args: { channel: string }; Returns: string };
      notify: {
        Args: { kind: string; payload?: Json; recipient: string; ref: string };
        Returns: undefined;
      };
      open_direct: { Args: { group_name?: string; peers: string[] }; Returns: string };
      put_note: { Args: { audience?: string; body: string }; Returns: undefined };
      quota_bytes: { Args: Record<PropertyKey, never>; Returns: number };
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
      reply_story: {
        Args: { body?: string; emoji?: string; story: string };
        Returns: {
          channel: string;
          message: string;
        }[];
      };
      repost_reel: { Args: { reel: string; reposted: boolean }; Returns: number };
      require_member: { Args: { channel: string }; Returns: string };
      require_reel: { Args: { reel: string }; Returns: string };
      require_user: { Args: Record<PropertyKey, never>; Returns: string };
      search: {
        Args: { kind?: string; max_rows?: number; q: string; skip?: number };
        Returns: {
          author_id: string;
          body: string;
          channel_id: string;
          created_at: string;
          hit_kind: string;
          id: string;
          title: string;
          total: number;
        }[];
      };
      send_message: {
        Args: {
          attachments?: string[];
          body: string;
          channel: string;
          embed_kind?: string;
          embed_ref?: string;
          is_forward?: boolean;
          nonce: string;
          parent?: string;
          reply_to?: string;
        };
        Returns: string;
      };
      set_cover: { Args: { asset?: string }; Returns: string };
      set_nickname: { Args: { channel: string; nick: string; target: string }; Returns: undefined };
      set_pin: { Args: { message: string; pinned: boolean }; Returns: undefined };
      storage_can_purge: { Args: { bucket: string; name: string }; Returns: boolean };
      storage_can_read: { Args: { bucket: string; name: string }; Returns: boolean };
      storage_can_upload: { Args: { bucket: string; name: string }; Returns: boolean };
      story_insights: { Args: { story: string }; Returns: Json };
      update_channel: {
        Args: { channel: string; new_description?: string; new_name?: string };
        Returns: undefined;
      };
      update_highlight: {
        Args: {
          cover?: string;
          highlight: string;
          set_cover?: boolean;
          story_ids?: string[];
          title?: string;
        };
        Returns: undefined;
      };
      update_inbox: {
        Args: { channel: string; folder?: string; mute?: boolean; pinned?: boolean };
        Returns: undefined;
      };
      used_bytes: { Args: { except_asset?: string; owner: string }; Returns: number };
      view_reel: { Args: { reel: string }; Returns: number };
      view_story: { Args: { story: string }; Returns: number };
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
