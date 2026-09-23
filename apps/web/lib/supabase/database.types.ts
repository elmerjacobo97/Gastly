export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_transfers: {
        Row: {
          amount: number;
          created_at: string;
          from_account_id: string;
          id: string;
          notes: string | null;
          occurred_on: string;
          to_account_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          from_account_id: string;
          id?: string;
          notes?: string | null;
          occurred_on: string;
          to_account_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          from_account_id?: string;
          id?: string;
          notes?: string | null;
          occurred_on?: string;
          to_account_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_transfers_from_account_id_fkey";
            columns: ["from_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey";
            columns: ["to_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          balance: number;
          color: string;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          id?: string;
          month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          id?: string;
          month?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      custody_movements: {
        Row: {
          amount: number;
          created_at: string;
          custody_order_id: string;
          id: string;
          method: string | null;
          notes: string | null;
          occurred_on: string;
          type: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          custody_order_id: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          occurred_on: string;
          type: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          custody_order_id?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          occurred_on?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custody_movements_custody_order_id_fkey";
            columns: ["custody_order_id"];
            isOneToOne: false;
            referencedRelation: "custody_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      custody_orders: {
        Row: {
          created_at: string;
          currency: string;
          expected_on: string | null;
          id: string;
          notes: string | null;
          person_name: string;
          status: string;
          target_amount: number | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          expected_on?: string | null;
          id?: string;
          notes?: string | null;
          person_name: string;
          status?: string;
          target_amount?: number | null;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          expected_on?: string | null;
          id?: string;
          notes?: string | null;
          person_name?: string;
          status?: string;
          target_amount?: number | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      installment_payments: {
        Row: {
          amount: number;
          created_at: string;
          due_on: string;
          id: string;
          paid_externally: boolean;
          payment_number: number;
          purchase_id: string;
          transaction_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          due_on: string;
          id?: string;
          paid_externally?: boolean;
          payment_number: number;
          purchase_id: string;
          transaction_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          due_on?: string;
          id?: string;
          paid_externally?: boolean;
          payment_number?: number;
          purchase_id?: string;
          transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "installment_payments_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "installment_purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installment_payments_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      installment_purchases: {
        Row: {
          account_id: string | null;
          category_id: string | null;
          created_at: string;
          description: string;
          first_payment_on: string;
          id: string;
          installment_amount: number;
          interest_amount: number;
          notes: string | null;
          total_installments: number;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description: string;
          first_payment_on: string;
          id?: string;
          installment_amount: number;
          interest_amount?: number;
          notes?: string | null;
          total_installments: number;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          first_payment_on?: string;
          id?: string;
          installment_amount?: number;
          interest_amount?: number;
          notes?: string | null;
          total_installments?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "installment_purchases_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "installment_purchases_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      loan_disbursements: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          interest_rate: number;
          loan_id: string;
          notes: string | null;
          occurred_on: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          interest_rate?: number;
          loan_id: string;
          notes?: string | null;
          occurred_on: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          interest_rate?: number;
          loan_id?: string;
          notes?: string | null;
          occurred_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loan_disbursements_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
        ];
      };
      loan_payments: {
        Row: {
          amount: number;
          created_at: string;
          disbursement_id: string;
          id: string;
          loan_id: string;
          notes: string | null;
          occurred_on: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          disbursement_id: string;
          id?: string;
          loan_id: string;
          notes?: string | null;
          occurred_on: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          disbursement_id?: string;
          id?: string;
          loan_id?: string;
          notes?: string | null;
          occurred_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loan_payments_disbursement_loan_fkey";
            columns: ["disbursement_id", "loan_id"];
            isOneToOne: false;
            referencedRelation: "loan_disbursements";
            referencedColumns: ["id", "loan_id"];
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
        ];
      };
      loans: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          direction: string;
          expected_on: string | null;
          id: string;
          loaned_on: string;
          notes: string | null;
          person_name: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          direction?: string;
          expected_on?: string | null;
          id?: string;
          loaned_on: string;
          notes?: string | null;
          person_name: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          direction?: string;
          expected_on?: string | null;
          id?: string;
          loaned_on?: string;
          notes?: string | null;
          person_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      monthly_plans: {
        Row: {
          created_at: string;
          id: string;
          month: string;
          notes: string | null;
          savings_mode: string;
          savings_value: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          month: string;
          notes?: string | null;
          savings_mode?: string;
          savings_value: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          month?: string;
          notes?: string | null;
          savings_mode?: string;
          savings_value?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
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
      recurring_expenses: {
        Row: {
          account_id: string | null;
          amount: number;
          billing_day: number;
          category_id: string | null;
          created_at: string;
          currency: string;
          description: string;
          frequency: string;
          id: string;
          interval_months: number;
          is_active: boolean;
          next_due_on: string;
          notes: string | null;
          payment_kind: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          billing_day: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          description: string;
          frequency?: string;
          id?: string;
          interval_months?: number;
          is_active?: boolean;
          next_due_on?: string;
          notes?: string | null;
          payment_kind?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          billing_day?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string;
          frequency?: string;
          id?: string;
          interval_months?: number;
          is_active?: boolean;
          next_due_on?: string;
          notes?: string | null;
          payment_kind?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      savings_goals: {
        Row: {
          color: string;
          created_at: string;
          current_amount: number;
          id: string;
          name: string;
          notes: string | null;
          target_amount: number;
          target_date: string | null;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name: string;
          notes?: string | null;
          target_amount: number;
          target_date?: string | null;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name?: string;
          notes?: string | null;
          target_amount?: number;
          target_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      telegram_connections: {
        Row: {
          created_at: string | null;
          id: string;
          telegram_user_id: number;
          telegram_username: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          telegram_user_id: number;
          telegram_username?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          telegram_user_id?: number;
          telegram_username?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      telegram_link_tokens: {
        Row: {
          expires_at: string;
          token: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          expires_at?: string;
          token?: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          expires_at?: string;
          token?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          completed_at: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          note: string | null;
          planned_start_date: string | null;
          position: number;
          priority: string;
          project_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          note?: string | null;
          planned_start_date?: string | null;
          position?: number;
          priority?: string;
          project_id: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          note?: string | null;
          planned_start_date?: string | null;
          position?: number;
          priority?: string;
          project_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      timer_sessions: {
        Row: {
          ended_at: string | null;
          id: string;
          owner_id: string;
          started_at: string;
          ticket_id: string;
        };
        Insert: {
          ended_at?: string | null;
          id?: string;
          owner_id: string;
          started_at?: string;
          ticket_id: string;
        };
        Update: {
          ended_at?: string | null;
          id?: string;
          owner_id?: string;
          started_at?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timer_sessions_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          credit_card_due_on: string | null;
          credit_card_name: string | null;
          credit_card_paid_on: string | null;
          description: string;
          id: string;
          monthly_plan_id: string | null;
          notes: string | null;
          occurred_on: string;
          payment_method: string;
          recurring_expense_id: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          credit_card_due_on?: string | null;
          credit_card_name?: string | null;
          credit_card_paid_on?: string | null;
          description: string;
          id?: string;
          monthly_plan_id?: string | null;
          notes?: string | null;
          occurred_on?: string;
          payment_method?: string;
          recurring_expense_id?: string | null;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          credit_card_due_on?: string | null;
          credit_card_name?: string | null;
          credit_card_paid_on?: string | null;
          description?: string;
          id?: string;
          monthly_plan_id?: string | null;
          notes?: string | null;
          occurred_on?: string;
          payment_method?: string;
          recurring_expense_id?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_monthly_plan_id_fkey";
            columns: ["monthly_plan_id"];
            isOneToOne: false;
            referencedRelation: "monthly_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurring_expense_id_fkey";
            columns: ["recurring_expense_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          savings_percentage: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          savings_percentage?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          savings_percentage?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_account_balance: {
        Args: { p_account_id: string; p_amount: number };
        Returns: undefined;
      };
      increment_account_balance: {
        Args: { p_account_id: string; p_amount: number };
        Returns: undefined;
      };
      start_ticket_timer: {
        Args: { p_ticket_id: string };
        Returns: {
          ended_at: string | null;
          id: string;
          owner_id: string;
          started_at: string;
          ticket_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "timer_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
