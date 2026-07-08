import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processMessage } from "@/lib/ai/assistant";
import type { EmployeeContext } from "@/lib/ai/tools";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { data: emp } = await supabase
      .from("employees")
      .select("id, full_name, role, team_id")
      .eq("user_id", user.id)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "لم يُعثر على الموظف" }, { status: 403 });
    }

    const ctx: EmployeeContext = {
      id: emp.id,
      teamId: emp.team_id,
      role: emp.role,
    };

    const response = await processMessage(message.trim(), ctx, emp.full_name);

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 });
  }
}
