export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "supervisor" | "employee";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type NotificationType =
  | "task_assigned"
  | "task_updated"
  | "task_completed"
  | "comment_added"
  | "mention"
  | "system";

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: Omit<Team, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Team, "id" | "created_at">>;
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Employee, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      statuses: {
        Row: Status;
        Insert: Omit<Status, "id" | "created_at">;
        Update: Partial<Omit<Status, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      notification_type: NotificationType;
    };
  };
}

export interface Team {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  team_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  team_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  team?: Team;
  assignee?: Employee;
  creator?: Employee;
}

export interface Status {
  id: string;
  name: string;
  name_en: string | null;
  color: string;
  icon: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  recipient?: Employee;
  sender?: Employee;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: Employee;
}
