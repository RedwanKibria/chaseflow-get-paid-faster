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
      activity_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string
          description: string
          id: string
          invoice_id: string | null
          log_code: string | null
          log_number: string | null
          meta: Json | null
          related_user_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string
          description: string
          id?: string
          invoice_id?: string | null
          log_code?: string | null
          log_number?: string | null
          meta?: Json | null
          related_user_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string | null
          log_code?: string | null
          log_number?: string | null
          meta?: Json | null
          related_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "activity_logs_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          hourly_rate: number | null
          hours: number | null
          id: string
          invoice_id: string
          item_no: number
          item_total: number
          quantity: number | null
          unit_amount: number | null
        }
        Insert: {
          created_at?: string
          description: string
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_id: string
          item_no: number
          item_total?: number
          quantity?: number | null
          unit_amount?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          invoice_id?: string
          item_no?: number
          item_total?: number
          quantity?: number | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          after_14_sent: boolean | null
          after_14_sent_at: string | null
          after_3_sent: boolean | null
          after_3_sent_at: string | null
          after_7_sent: boolean | null
          after_7_sent_at: string | null
          before_3_sent: boolean | null
          before_3_sent_at: string | null
          cancelled_at: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          created_at: string
          deleted_at: string | null
          due_date: string
          due_sent: boolean | null
          due_sent_at: string | null
          email_body: string | null
          id: string
          invoice_code: string | null
          invoice_date: string
          invoice_file_name: string | null
          invoice_file_path: string | null
          invoice_number: string | null
          invoice_reference: string | null
          invoice_type: string
          is_deleted: boolean | null
          logo_url: string | null
          paid: boolean
          paid_date: string | null
          reminder_after_14: boolean
          reminder_after_3: boolean
          reminder_after_7: boolean
          reminder_before_3: boolean
          reminder_due: boolean
          reminder_email_body: string | null
          reminder_email_subject: string | null
          status: string
          subtotal_amount: number | null
          tax_amount: number | null
          tax_percent: number | null
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number | null
          vat_percent: number | null
          your_company_name: string | null
        }
        Insert: {
          after_14_sent?: boolean | null
          after_14_sent_at?: string | null
          after_3_sent?: boolean | null
          after_3_sent_at?: string | null
          after_7_sent?: boolean | null
          after_7_sent_at?: string | null
          before_3_sent?: boolean | null
          before_3_sent_at?: string | null
          cancelled_at?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          deleted_at?: string | null
          due_date: string
          due_sent?: boolean | null
          due_sent_at?: string | null
          email_body?: string | null
          id?: string
          invoice_code?: string | null
          invoice_date?: string
          invoice_file_name?: string | null
          invoice_file_path?: string | null
          invoice_number?: string | null
          invoice_reference?: string | null
          invoice_type: string
          is_deleted?: boolean | null
          logo_url?: string | null
          paid?: boolean
          paid_date?: string | null
          reminder_after_14?: boolean
          reminder_after_3?: boolean
          reminder_after_7?: boolean
          reminder_before_3?: boolean
          reminder_due?: boolean
          reminder_email_body?: string | null
          reminder_email_subject?: string | null
          status?: string
          subtotal_amount?: number | null
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount?: number
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          vat_percent?: number | null
          your_company_name?: string | null
        }
        Update: {
          after_14_sent?: boolean | null
          after_14_sent_at?: string | null
          after_3_sent?: boolean | null
          after_3_sent_at?: string | null
          after_7_sent?: boolean | null
          after_7_sent_at?: string | null
          before_3_sent?: boolean | null
          before_3_sent_at?: string | null
          cancelled_at?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          deleted_at?: string | null
          due_date?: string
          due_sent?: boolean | null
          due_sent_at?: string | null
          email_body?: string | null
          id?: string
          invoice_code?: string | null
          invoice_date?: string
          invoice_file_name?: string | null
          invoice_file_path?: string | null
          invoice_number?: string | null
          invoice_reference?: string | null
          invoice_type?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          paid?: boolean
          paid_date?: string | null
          reminder_after_14?: boolean
          reminder_after_3?: boolean
          reminder_after_7?: boolean
          reminder_before_3?: boolean
          reminder_due?: boolean
          reminder_email_body?: string | null
          reminder_email_subject?: string | null
          status?: string
          subtotal_amount?: number | null
          tax_amount?: number | null
          tax_percent?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_percent?: number | null
          your_company_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_jobs: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_jobs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_jobs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: string
          renews_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string
          renews_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          comment_value: string | null
          created_at: string
          id: string
          satisfaction_value: number | null
          submission_id: string
          survey_question_id: string
          updated_at: string
          user_id: string
          yes_no_value: boolean | null
        }
        Insert: {
          comment_value?: string | null
          created_at?: string
          id?: string
          satisfaction_value?: number | null
          submission_id: string
          survey_question_id: string
          updated_at?: string
          user_id: string
          yes_no_value?: boolean | null
        }
        Update: {
          comment_value?: string | null
          created_at?: string
          id?: string
          satisfaction_value?: number | null
          submission_id?: string
          survey_question_id?: string
          updated_at?: string
          user_id?: string
          yes_no_value?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["submission_id"]
          },
          {
            foreignKeyName: "survey_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "survey_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_survey_question_id_fkey"
            columns: ["survey_question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "survey_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "survey_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          answer_type: string
          created_at: string
          id: string
          is_active: boolean
          question_key: string
          question_order: number
          question_text: string
          updated_at: string
        }
        Insert: {
          answer_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          question_key: string
          question_order: number
          question_text: string
          updated_at?: string
        }
        Update: {
          answer_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question_key?: string
          question_order?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey_submissions: {
        Row: {
          created_at: string
          id: string
          q1_satisfaction: number | null
          q2_satisfaction: number | null
          q3_satisfaction: number | null
          q4_pay_pro: boolean | null
          q5_comment: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          q1_satisfaction?: number | null
          q2_satisfaction?: number | null
          q3_satisfaction?: number | null
          q4_pay_pro?: boolean | null
          q5_comment?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          q1_satisfaction?: number | null
          q2_satisfaction?: number | null
          q3_satisfaction?: number | null
          q4_pay_pro?: boolean | null
          q5_comment?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "survey_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "survey_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "user_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_permissions: {
        Row: {
          activity_logs: boolean
          admin_invoice_reports: boolean
          admin_survey_reports: boolean | null
          admin_system_logs: boolean
          admin_user_management: boolean
          create_invoice: boolean
          created_at: string
          dashboard: boolean
          my_invoices: boolean
          pro_plan: boolean
          review_feedback: boolean | null
          settings: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_logs?: boolean
          admin_invoice_reports?: boolean
          admin_survey_reports?: boolean | null
          admin_system_logs?: boolean
          admin_user_management?: boolean
          create_invoice?: boolean
          created_at?: string
          dashboard?: boolean
          my_invoices?: boolean
          pro_plan?: boolean
          review_feedback?: boolean | null
          settings?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_logs?: boolean
          admin_invoice_reports?: boolean
          admin_survey_reports?: boolean | null
          admin_system_logs?: boolean
          admin_user_management?: boolean
          create_invoice?: boolean
          created_at?: string
          dashboard?: boolean
          my_invoices?: boolean
          pro_plan?: boolean
          review_feedback?: boolean | null
          settings?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_page_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "user_page_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_page_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_survey_question_permissions: {
        Row: {
          can_answer: boolean
          can_view: boolean
          created_at: string
          id: string
          survey_question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_answer?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          survey_question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_answer?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          survey_question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_survey_question_permissions_survey_question_id_fkey"
            columns: ["survey_question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_survey_question_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "invoice_reports_view"
            referencedColumns: ["owner_user_id"]
          },
          {
            foreignKeyName: "user_survey_question_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "survey_reports_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_survey_question_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          plan?: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      invoice_reports_view: {
        Row: {
          after_14_sent: boolean | null
          after_3_sent: boolean | null
          after_7_sent: boolean | null
          before_3_sent: boolean | null
          cancelled_at: string | null
          client_company: string | null
          client_email: string | null
          client_name: string | null
          created_at: string | null
          deleted_at: string | null
          due_date: string | null
          due_sent: boolean | null
          id: string | null
          invoice_code: string | null
          invoice_date: string | null
          invoice_reference: string | null
          invoice_type: string | null
          is_deleted: boolean | null
          owner_email: string | null
          owner_full_name: string | null
          owner_is_active: boolean | null
          owner_role: string | null
          owner_user_id: string | null
          paid: boolean | null
          paid_date: string | null
          status: string | null
          subtotal_amount: number | null
          tax_amount: number | null
          tax_percent: number | null
          total_amount: number | null
          vat_amount: number | null
          vat_percent: number | null
          your_company_name: string | null
        }
        Relationships: []
      }
      survey_reports_view: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          q1_satisfaction: number | null
          q2_satisfaction: number | null
          q3_satisfaction: number | null
          q4_pay_pro: boolean | null
          q5_comment: string | null
          submission_id: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_activity_log:
        | {
            Args: {
              p_action_type: string
              p_actor_user_id: string
              p_description: string
              p_invoice_id?: string
              p_meta?: Json
              p_related_user_id?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action_type: string
              p_description: string
              p_invoice_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
      admin_set_user_active: {
        Args: { p_is_active: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_user_permission: {
        Args: {
          p_enabled: boolean
          p_permission_key: string
          p_user_id: string
        }
        Returns: undefined
      }
      cancel_invoice: { Args: { p_invoice_id: string }; Returns: undefined }
      create_reminder_jobs_for_invoice: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      mark_invoice_paid: { Args: { p_invoice_id: string }; Returns: undefined }
      refresh_invoice_financials: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      refresh_invoice_total: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      soft_delete_invoice: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      update_my_profile: {
        Args: { p_company_name: string; p_full_name: string }
        Returns: undefined
      }
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
