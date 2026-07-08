// ── Distribution page types ────────────────────────────────────────────────

export type CompanyType = "inside" | "outside";
export type DistributionCenter = "mecca" | "medina";
export type DistributionRequestType = "new_batches" | "alert_late" | "alert_no_auth";
export type DistributionRequestStatus = "new" | "received" | "delivered" | "reported";
export type DistributionPageRole = "admin" | "distribution" | "corporate";

export interface DistributionCompany {
  id: string;
  name: string;
  type: CompanyType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DistributionRequest {
  id: string;
  company_id: string;
  company_name: string;
  company_type: CompanyType;
  request_type: DistributionRequestType;
  status: DistributionRequestStatus;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  processed_by: string | null;
  processed_by_name: string | null;
  processed_at: string | null;
  delegate_name: string | null;
  delegate_phone: string | null;
  notes: string | null;
  center: DistributionCenter | null;
}

export interface DistributionPageData {
  companies: DistributionCompany[];
  requests: DistributionRequest[];
  pageRole: DistributionPageRole;
  employeeId: string;
  employeeName: string;
  error: string | null;
}

// ── UI config maps ─────────────────────────────────────────────────────────

export const REQUEST_TYPE_CONFIG: Record<
  DistributionRequestType,
  { label: string; shortLabel: string; alertColor: string }
> = {
  new_batches: {
    label: "دفعات جديدة",
    shortLabel: "دفعات جديدة",
    alertColor: "blue",
  },
  alert_late: {
    label: "تنبيه: دفعات متأخرة",
    shortLabel: "دفعات متأخرة",
    alertColor: "amber",
  },
  alert_no_auth: {
    label: "تنبيه: لا يوجد خطاب تفويض",
    shortLabel: "لا تفويض",
    alertColor: "red",
  },
};

export const REQUEST_STATUS_CONFIG: Record<
  DistributionRequestStatus,
  { label: string; bgStyle: React.CSSProperties; textStyle: React.CSSProperties }
> = {
  new: {
    label: "جديد",
    bgStyle: { background: "hsl(201 96% 32% / .1)" },
    textStyle: { color: "hsl(201 96% 32%)" },
  },
  received: {
    label: "تم الاستلام",
    bgStyle: { background: "hsl(142 71% 35% / .1)" },
    textStyle: { color: "hsl(142 71% 35%)" },
  },
  delivered: {
    label: "تم التوصيل",
    bgStyle: { background: "hsl(142 60% 28% / .12)" },
    textStyle: { color: "hsl(142 60% 28%)" },
  },
  reported: {
    label: "تم الإبلاغ",
    bgStyle: { background: "hsl(270 60% 50% / .1)" },
    textStyle: { color: "hsl(270 60% 50%)" },
  },
};

export const CENTER_CONFIG: Record<DistributionCenter, { label: string }> = {
  mecca:  { label: "مركز توزيع مكة" },
  medina: { label: "مركز توزيع المدينة" },
};

// React needed for CSSProperties type — import at usage site
import type React from "react";
