export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      battles: {
        Row: {
          created_at: string
          creator_card: Json
          creator_name: string | null
          creator_user_id: string
          id: string
          opponent_card: Json | null
          opponent_name: string | null
          opponent_zodiac: string | null
          questions: Json
          share_token: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          created_at?: string
          creator_card: Json
          creator_name?: string | null
          creator_user_id: string
          id?: string
          opponent_card?: Json | null
          opponent_name?: string | null
          opponent_zodiac?: string | null
          questions: Json
          share_token: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          created_at?: string
          creator_card?: Json
          creator_name?: string | null
          creator_user_id?: string
          id?: string
          opponent_card?: Json | null
          opponent_name?: string | null
          opponent_zodiac?: string | null
          questions?: Json
          share_token?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: []
      }
      daily_decodes: {
        Row: {
          card: Json
          created_at: string
          decode_date: string
          id: string
          regenerations_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card: Json
          created_at?: string
          decode_date?: string
          id?: string
          regenerations_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card?: Json
          created_at?: string
          decode_date?: string
          id?: string
          regenerations_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      era_cards: {
        Row: {
          accuracy_rating: number | null
          age_group: string | null
          aura_color_hex: string | null
          aura_color_name: string | null
          brutal_truth: string | null
          city: string | null
          cosmic_prediction: string | null
          created_at: string
          decode_date: string
          era_name: string | null
          id: string
          power_move: string | null
          song_artist: string | null
          song_name: string | null
          song_reason: string | null
          updated_at: string
          user_id: string
          vibe_word: string | null
          warning: string | null
          zodiac: string | null
        }
        Insert: {
          accuracy_rating?: number | null
          age_group?: string | null
          aura_color_hex?: string | null
          aura_color_name?: string | null
          brutal_truth?: string | null
          city?: string | null
          cosmic_prediction?: string | null
          created_at?: string
          decode_date?: string
          era_name?: string | null
          id?: string
          power_move?: string | null
          song_artist?: string | null
          song_name?: string | null
          song_reason?: string | null
          updated_at?: string
          user_id: string
          vibe_word?: string | null
          warning?: string | null
          zodiac?: string | null
        }
        Update: {
          accuracy_rating?: number | null
          age_group?: string | null
          aura_color_hex?: string | null
          aura_color_name?: string | null
          brutal_truth?: string | null
          city?: string | null
          cosmic_prediction?: string | null
          created_at?: string
          decode_date?: string
          era_name?: string | null
          id?: string
          power_move?: string | null
          song_artist?: string | null
          song_name?: string | null
          song_reason?: string | null
          updated_at?: string
          user_id?: string
          vibe_word?: string | null
          warning?: string | null
          zodiac?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          accuracy_rating: number
          brutal_truth: string | null
          city: string | null
          created_at: string
          era_name: string | null
          feedback_date: string
          id: string
          user_id: string
          zodiac: string | null
        }
        Insert: {
          accuracy_rating: number
          brutal_truth?: string | null
          city?: string | null
          created_at?: string
          era_name?: string | null
          feedback_date?: string
          id?: string
          user_id: string
          zodiac?: string | null
        }
        Update: {
          accuracy_rating?: number
          brutal_truth?: string | null
          city?: string | null
          created_at?: string
          era_name?: string | null
          feedback_date?: string
          id?: string
          user_id?: string
          zodiac?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dob: string | null
          id: string
          is_premium: boolean
          name: string | null
          region: string
          symbol: string | null
          updated_at: string
          zodiac: string | null
        }
        Insert: {
          created_at?: string
          dob?: string | null
          id: string
          is_premium?: boolean
          name?: string | null
          region?: string
          symbol?: string | null
          updated_at?: string
          zodiac?: string | null
        }
        Update: {
          created_at?: string
          dob?: string | null
          id?: string
          is_premium?: boolean
          name?: string | null
          region?: string
          symbol?: string | null
          updated_at?: string
          zodiac?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          options: string[]
          question_text: string
          region: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          options: string[]
          question_text: string
          region: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          options?: string[]
          question_text?: string
          region?: string
        }
        Relationships: []
      }
      user_questions_seen: {
        Row: {
          question_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          question_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          question_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questions_seen_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
