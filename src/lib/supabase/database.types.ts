export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      default_terms: {
        Row: {
          created_at: string
          end_date: string
          half_term_end: string
          half_term_start: string
          id: number
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          half_term_end: string
          half_term_start: string
          id?: never
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          half_term_end?: string
          half_term_start?: string
          id?: never
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: number
          name: string
          school_id: number
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: never
          name: string
          school_id: number
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: never
          name?: string
          school_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "locations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      off_days: {
        Row: {
          created_at: string
          date: string
          id: number
          label: string | null
          school_id: number | null
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: never
          label?: string | null
          school_id?: number | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: never
          label?: string | null
          school_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "off_days_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admins: {
        Row: {
          created_at: string
          school_id: number
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          school_id: number
          volunteer_id: string
        }
        Update: {
          created_at?: string
          school_id?: number
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active: boolean
          created_at: string
          id: number
          is_demo: boolean
          name: string
          street: string | null
          town: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: never
          is_demo?: boolean
          name: string
          street?: string | null
          town?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: never
          is_demo?: boolean
          name?: string
          street?: string | null
          town?: string | null
        }
        Relationships: []
      }
      signups: {
        Row: {
          created_at: string
          id: number
          slot_instance_id: number
          status: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          slot_instance_id: number
          status?: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          id?: never
          slot_instance_id?: number
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signups_slot_instance_id_fkey"
            columns: ["slot_instance_id"]
            isOneToOne: false
            referencedRelation: "slot_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signups_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_instances: {
        Row: {
          capacity: number
          created_at: string
          date: string
          end_time: string
          id: number
          slot_id: number
          start_time: string
          status: string
          term_id: number
        }
        Insert: {
          capacity: number
          created_at?: string
          date: string
          end_time: string
          id?: never
          slot_id: number
          start_time: string
          status?: string
          term_id: number
        }
        Update: {
          capacity?: number
          created_at?: string
          date?: string
          end_time?: string
          id?: never
          slot_id?: number
          start_time?: string
          status?: string
          term_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "slot_instances_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_instances_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          day_of_week: number
          end_time: string
          id: number
          label: string
          location_id: number
          start_time: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: never
          label: string
          location_id: number
          start_time: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: never
          label?: string
          location_id?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          end_date: string
          id: number
          name: string
          school_id: number
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: never
          name: string
          school_id: number
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: never
          name?: string
          school_id?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_calendar_feeds: {
        Row: {
          created_at: string
          last_fetched_at: string | null
          token: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          last_fetched_at?: string | null
          token?: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          last_fetched_at?: string | null
          token?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_calendar_feeds_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: true
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_schools: {
        Row: {
          created_at: string
          school_id: number
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          school_id: number
          volunteer_id: string
        }
        Update: {
          created_at?: string
          school_id?: number
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_schools_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_admin: boolean
          is_superuser: boolean
          preferred_school_id: number | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          is_admin?: boolean
          is_superuser?: boolean
          preferred_school_id?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_admin?: boolean
          is_superuser?: boolean
          preferred_school_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_preferred_school_id_fkey"
            columns: ["preferred_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slot_instances_for_school_term: {
        Args: { p_school_id: number; p_term_id: number }
        Returns: undefined
      }
      is_school_admin: { Args: { p_school_id: number }; Returns: boolean }
      is_superuser: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

