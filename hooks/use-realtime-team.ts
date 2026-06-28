"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  EmployeeWithPresence,
  EmployeePresence,
  Task,
} from "@/types/database";

export function useRealtimeTeam(
  teamId: string,
  initialEmployees: EmployeeWithPresence[]
) {
  const [employees, setEmployees] =
    useState<EmployeeWithPresence[]>(initialEmployees);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Sync when initial server data changes (route navigation)
  const prevTeamId = useRef<string | null>(null);
  useEffect(() => {
    if (prevTeamId.current !== teamId) {
      setEmployees(initialEmployees);
      prevTeamId.current = teamId;
    }
  }, [teamId, initialEmployees]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`team-realtime-${teamId}`)
      // Employee presence changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_presence" },
        (payload) => {
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const updated = payload.new as EmployeePresence;
            setEmployees((prev) =>
              prev.map((emp) =>
                emp.id === updated.employee_id
                  ? { ...emp, presence: updated }
                  : emp
              )
            );
            setLastUpdate(new Date());
          }
        }
      )
      // Task changes
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          const newTask = payload.new as Task | null;
          const oldTask = payload.old as Task | null;

          setEmployees((prev) =>
            prev.map((emp) => {
              // Assign/update task for this employee
              if (
                newTask &&
                newTask.assigned_to === emp.id &&
                newTask.status === "in_progress"
              ) {
                return { ...emp, current_task: newTask };
              }
              // Task removed or completed
              if (
                oldTask &&
                oldTask.assigned_to === emp.id &&
                emp.current_task?.id === oldTask.id
              ) {
                if (!newTask || newTask.status !== "in_progress") {
                  return { ...emp, current_task: null };
                }
              }
              return emp;
            })
          );
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  function updateEmployeeLocally(updated: EmployeeWithPresence) {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updated.id ? updated : emp))
    );
  }

  return { employees, lastUpdate, updateEmployeeLocally };
}
