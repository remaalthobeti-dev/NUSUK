"use client";

import { useEffect, useState } from "react";
import type { EmployeeWithPresence } from "@/types/database";

export type AlertSeverity = "error" | "warning" | "info";

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  dismissedAt?: number;
}

const BREAK_LIMIT_MS = 30 * 60 * 1000;      // 30 minutes
const BUSY_LIMIT_MS  = 2 * 60 * 60 * 1000;  // 2 hours
const CHECK_INTERVAL = 60 * 1000;            // every minute

export function useAlertChecker(employees: EmployeeWithPresence[]) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    function check() {
      const now = Date.now();
      const next: SystemAlert[] = [];

      for (const emp of employees) {
        if (!emp.presence) continue;
        const { availability_status, updated_at } = emp.presence;
        const elapsed = now - new Date(updated_at).getTime();

        // Break exceeded 30 min
        if (availability_status === "break" && elapsed > BREAK_LIMIT_MS) {
          next.push({
            id: `break-${emp.id}`,
            severity: "warning",
            employeeId: emp.id,
            employeeName: emp.full_name,
            title: "استراحة طويلة",
            description: `${emp.full_name} في استراحة منذ أكثر من ${Math.floor(elapsed / 60_000)} دقيقة`,
          });
        }

        // Busy more than 2 hours
        if (availability_status === "busy" && elapsed > BUSY_LIMIT_MS) {
          next.push({
            id: `busy-${emp.id}`,
            severity: "warning",
            employeeId: emp.id,
            employeeName: emp.full_name,
            title: "مشغول فترة طويلة",
            description: `${emp.full_name} مشغول منذ أكثر من ${Math.floor(elapsed / 3_600_000)} ساعة`,
          });
        }

        // Task overdue
        if (emp.current_task?.due_date) {
          const overdue = now - new Date(emp.current_task.due_date).getTime();
          if (overdue > 0) {
            next.push({
              id: `overdue-${emp.id}`,
              severity: "error",
              employeeId: emp.id,
              employeeName: emp.full_name,
              title: "مهمة متأخرة",
              description: `مهمة "${emp.current_task.title}" تجاوزت الوقت المحدد بـ ${Math.floor(overdue / 60_000)} دقيقة`,
            });
          }
        }
      }

      setAlerts(next.filter((a) => !dismissed.has(a.id)));
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [employees, dismissed]);

  function dismiss(alertId: string) {
    setDismissed((prev) => new Set([...prev, alertId]));
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  function dismissAll() {
    const ids = alerts.map((a) => a.id);
    setDismissed((prev) => new Set([...prev, ...ids]));
    setAlerts([]);
  }

  return { alerts, dismiss, dismissAll };
}
