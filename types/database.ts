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
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_presence: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status"]
          context: Json | null
          employee_id: string
          id: string
          notes: string | null
          started_at: string
          updated_at: string
          workload_percent: number
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          context?: Json | null
          employee_id: string
          id?: string
          notes?: string | null
          started_at?: string
          updated_at?: string
          workload_percent?: number
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          context?: Json | null
          employee_id?: string
          id?: string
          notes?: string | null
          started_at?: string
          updated_at?: string
          workload_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_presence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_presence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          approved_role: Database["public"]["Enums"]["user_role"] | null
          approved_team_id: string | null
          approved_title: string | null
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          approved_role?: Database["public"]["Enums"]["user_role"] | null
          approved_team_id?: string | null
          approved_title?: string | null
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          approved_role?: Database["public"]["Enums"]["user_role"] | null
          approved_team_id?: string | null
          approved_title?: string | null
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_approved_team_id_fkey"
            columns: ["approved_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_approved_team_id_fkey"
            columns: ["approved_team_id"]
            isOneToOne: false
            referencedRelation: "v_team_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["task_priority"]
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          created_at: string
          description: string
          employee_id: string | null
          event_type: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          description: string
          employee_id?: string | null
          event_type: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          description?: string
          employee_id?: string | null
          event_type?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          employee_id: string
          id: string
          task_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          employee_id: string
          id?: string
          task_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          employee_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_participants: {
        Row: {
          employee_id: string
          id: string
          joined_at: string
          left_at: string | null
          task_id: string
        }
        Insert: {
          employee_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          task_id: string
        }
        Update: {
          employee_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_participants_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          created_at: string
          id: string
          request_type: Database["public"]["Enums"]["task_request_type"]
          requestee_id: string
          requester_id: string
          status: Database["public"]["Enums"]["task_request_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_type: Database["public"]["Enums"]["task_request_type"]
          requestee_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["task_request_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          request_type?: Database["public"]["Enums"]["task_request_type"]
          requestee_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["task_request_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_requests_requestee_id_fkey"
            columns: ["requestee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_employee_stats: {
        Row: {
          active_tasks: number | null
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          completed_tasks: number | null
          email: string | null
          full_name: string | null
          id: string | null
          job_title: string | null
          presence_updated_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status_context: Json | null
          status_started_at: string | null
          team_color: string | null
          team_id: string | null
          team_name: string | null
          workload_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_team_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_stats: {
        Row: {
          active_tasks: number | null
          avg_workload: number | null
          color: string | null
          completed_today: number | null
          employee_count: number | null
          icon: string | null
          id: string | null
          name: string | null
          present_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_employee_id: { Args: never; Returns: string }
      current_employee_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_today_activity_count: {
        Args: { p_employee_id: string }
        Returns: number
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      availability_status:
        | "available"
        | "busy"
        | "in_meeting"
        | "field_work"
        | "remote"
        | "offline"
      notification_type:
        | "task_assigned"
        | "task_updated"
        | "task_completed"
        | "comment_added"
        | "mention"
        | "system"
      request_status: "pending" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_request_status: "pending" | "accepted" | "rejected"
      task_request_type: "collaboration" | "review"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "on_hold"
        | "available"
      user_role: "super_admin" | "track_manager" | "team_member"
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
    Enums: {
      availability_status: [
        "available",
        "busy",
        "in_meeting",
        "field_work",
        "remote",
        "offline",
      ],
      notification_type: [
        "task_assigned",
        "task_updated",
        "task_completed",
        "comment_added",
        "mention",
        "system",
      ],
      request_status: ["pending", "approved", "rejected"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_request_status: ["pending", "accepted", "rejected"],
      task_request_type: ["collaboration", "review"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "on_hold",
        "available",
      ],
      user_role: ["super_admin", "track_manager", "team_member"],
    },
  },
} as const

// ─── Application types ────────────────────────────────────────────────────────
// Derived from the generated schema. Never define columns here manually.

// Enums
export type UserRole = Database["public"]["Enums"]["user_role"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type TaskPriority = Database["public"]["Enums"]["task_priority"]
export type NotificationType = Database["public"]["Enums"]["notification_type"]
export type RequestStatus = Database["public"]["Enums"]["request_status"]
export type AvailabilityStatus = Database["public"]["Enums"]["availability_status"]
export type TaskRequestType = Database["public"]["Enums"]["task_request_type"]
export type TaskRequestStatus = Database["public"]["Enums"]["task_request_status"]

// Row types — plain DB rows
export type Team = Tables<"teams">
export type EmployeeRow = Tables<"employees">
export type Task = Tables<"tasks">
export type Status = Tables<"statuses">
export type NotificationRow = Tables<"notifications">
export type ActivityLogRow = Tables<"activity_logs">
export type RegistrationRequest = Tables<"registration_requests">
export type EmployeePresence = Tables<"employee_presence">
export type TaskParticipantRow = Tables<"task_participants">
export type TaskCommentRow = Tables<"task_comments">
export type TaskActivityRow = Tables<"task_activity">
export type TaskRequestRow = Tables<"task_requests">

// Joined types — row + optional relational data populated by select queries
export type Employee = EmployeeRow & {
  team?: Team
}

export type Notification = NotificationRow & {
  recipient?: Employee
  sender?: Employee
}

export type ActivityLog = ActivityLogRow & {
  actor?: Employee
}

// Status context shapes stored as JSONB in employee_presence.context
export interface BusyContext {
  description: string
  expected_finish?: string
}

export interface MeetingContext {
  title: string
  end_time?: string
}

export interface FieldWorkContext {
  location: string
  activity?: string
}

export type StatusContext = BusyContext | MeetingContext | FieldWorkContext | null

// Composite / view types
export type EmployeeWithPresence = Employee & {
  presence: EmployeePresence | null
  current_task: Task | null
}

export type TeamWithStats = Team & {
  employee_count: number
  presence_summary: Record<AvailabilityStatus, number>
}
