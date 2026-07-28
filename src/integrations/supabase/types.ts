export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          candidate_id: string;
          created_at: string;
          employer_id: string;
          id: string;
          match_score: number | null;
          posting_id: string;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          employer_id: string;
          id?: string;
          match_score?: number | null;
          posting_id: string;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          employer_id?: string;
          id?: string;
          match_score?: number | null;
          posting_id?: string;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_posting_id_fkey";
            columns: ["posting_id"];
            isOneToOne: false;
            referencedRelation: "job_postings";
            referencedColumns: ["id"];
          },
        ];
      };
      candidate_profiles: {
        Row: {
          availability: string;
          bio: string;
          created_at: string;
          embedding: string | null;
          headline: string;
          id: string;
          portfolio_links: string;
          rate_max: number | null;
          rate_min: number | null;
          skills_text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          availability?: string;
          bio?: string;
          created_at?: string;
          embedding?: string | null;
          headline?: string;
          id?: string;
          portfolio_links?: string;
          rate_max?: number | null;
          rate_min?: number | null;
          skills_text?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          availability?: string;
          bio?: string;
          created_at?: string;
          embedding?: string | null;
          headline?: string;
          id?: string;
          portfolio_links?: string;
          rate_max?: number | null;
          rate_min?: number | null;
          skills_text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      job_postings: {
        Row: {
          budget_max: number | null;
          budget_min: number | null;
          company_id: string;
          contract_length: string;
          created_at: string;
          description: string;
          embedding: string | null;
          id: string;
          owner_id: string;
          required_skills_text: string;
          status: Database["public"]["Enums"]["posting_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          budget_max?: number | null;
          budget_min?: number | null;
          company_id: string;
          contract_length?: string;
          created_at?: string;
          description?: string;
          embedding?: string | null;
          id?: string;
          owner_id: string;
          required_skills_text?: string;
          status?: Database["public"]["Enums"]["posting_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          budget_max?: number | null;
          budget_min?: number | null;
          company_id?: string;
          contract_length?: string;
          created_at?: string;
          description?: string;
          embedding?: string | null;
          id?: string;
          owner_id?: string;
          required_skills_text?: string;
          status?: Database["public"]["Enums"]["posting_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_candidates_for_posting: {
        Args: { p_posting_id: string };
        Returns: {
          application_id: string;
          applied_at: string;
          availability: string;
          bio: string;
          candidate_id: string;
          headline: string;
          portfolio_links: string;
          rate_max: number;
          rate_min: number;
          similarity: number;
          skills_text: string;
          status: Database["public"]["Enums"]["application_status"];
        }[];
      };
      match_postings_for_candidate: {
        Args: {
          p_budget_max?: number;
          p_budget_min?: number;
          p_candidate_id: string;
          p_contract_length?: string;
        };
        Returns: {
          budget_max: number;
          budget_min: number;
          company_id: string;
          contract_length: string;
          created_at: string;
          description: string;
          id: string;
          required_skills_text: string;
          similarity: number;
          title: string;
        }[];
      };
    };
    Enums: {
      app_role: "candidate" | "employer";
      application_status: "applied" | "viewed" | "shortlisted" | "rejected" | "closed";
      posting_status: "open" | "closed";
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
    Enums: {
      app_role: ["candidate", "employer"],
      application_status: ["applied", "viewed", "shortlisted", "rejected", "closed"],
      posting_status: ["open", "closed"],
    },
  },
} as const;
