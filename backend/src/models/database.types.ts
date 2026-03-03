// Database types matching Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          first_name: string | null;
          last_name: string | null;
          username: string | null;
          language_code: string | null;
          is_blocked: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_active_at: string | null;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          first_name?: string | null;
          last_name?: string | null;
          username?: string | null;
          language_code?: string | null;
          is_blocked?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
        };
        Update: {
          id?: string;
          telegram_id?: number;
          first_name?: string | null;
          last_name?: string | null;
          username?: string | null;
          language_code?: string | null;
          is_blocked?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
        };
      };
      resources: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          media_type: 'image' | 'video' | 'file' | 'none';
          media_url: string | null;
          telegram_file_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          media_type?: 'image' | 'video' | 'file' | 'none';
          media_url?: string | null;
          telegram_file_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          media_type?: 'image' | 'video' | 'file' | 'none';
          media_url?: string | null;
          telegram_file_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      broadcasts: {
        Row: {
          id: string;
          message_text: string | null;
          media_type: 'image' | 'video' | 'audio' | 'file' | 'none';
          media_url: string | null;
          telegram_file_id: string | null;
          total_users: number;
          sent_count: number;
          failed_count: number;
          status: 'pending' | 'sending' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          message_text?: string | null;
          media_type?: 'image' | 'video' | 'audio' | 'file' | 'none';
          media_url?: string | null;
          telegram_file_id?: string | null;
          total_users?: number;
          sent_count?: number;
          failed_count?: number;
          status?: 'pending' | 'sending' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          message_text?: string | null;
          media_type?: 'image' | 'video' | 'audio' | 'file' | 'none';
          media_url?: string | null;
          telegram_file_id?: string | null;
          total_users?: number;
          sent_count?: number;
          failed_count?: number;
          status?: 'pending' | 'sending' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
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
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
