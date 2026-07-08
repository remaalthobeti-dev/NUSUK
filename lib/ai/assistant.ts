/**
 * Phase 1: Keyword-based intent router for Nassaq AI Assistant.
 * No external LLM — matches Arabic keywords to data-fetching tools.
 */

import {
  getTaskStats,
  getMyTasks,
  getTeamPresence,
  getFactoryPressure,
  getDistributionSummary,
  getUpcomingMeetings,
  type EmployeeContext,
} from "./tools";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  actions?: ActionButton[];
  timestamp: string;
}

export interface ActionButton {
  label: string;
  href?: string;
  query?: string;
}

export interface AssistantResponse {
  content: string;
  actions?: ActionButton[];
}

// ── Intent detection ──────────────────────────────────────────────────────

type Intent =
  | "tasks_stats"
  | "my_tasks"
  | "presence"
  | "factory_pressure"
  | "distribution"
  | "meetings"
  | "greeting"
  | "help"
  | "unknown";

const INTENT_PATTERNS: Array<{ intent: Intent; keywords: string[] }> = [
  {
    intent: "greeting",
    keywords: ["مرحبا", "هلا", "السلام", "صباح", "مساء", "أهلا", "اهلا", "هي", "hi", "hello"],
  },
  {
    intent: "my_tasks",
    keywords: ["مهامي", "مهام خاصتي", "واجباتي", "ما مهامي", "شو عندي", "ايش عندي"],
  },
  {
    intent: "tasks_stats",
    keywords: ["مهام", "tasks", "عدد المهام", "كم مهمة", "إحصائيات", "احصاء", "تقرير المهام", "المهام المعلقة"],
  },
  {
    intent: "presence",
    keywords: ["من يعمل", "الحضور", "حضور الفريق", "من متاح", "متاح", "من موجود", "فريقي", "أعضاء الفريق"],
  },
  {
    intent: "factory_pressure",
    keywords: ["ضغط المصنع", "ضغط العمل", "المصنع", "factory", "الضغط"],
  },
  {
    intent: "distribution",
    keywords: ["توزيع", "رحلات", "توصيل", "trips", "distribution"],
  },
  {
    intent: "meetings",
    keywords: ["اجتماع", "اجتماعات", "لقاء", "meeting", "جلسة"],
  },
  {
    intent: "help",
    keywords: ["مساعدة", "ماذا تفعل", "ماذا يمكنك", "كيف تعمل", "help", "ساعدني"],
  },
];

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  for (const { intent, keywords } of INTENT_PATTERNS) {
    if (keywords.some((kw) => lower.includes(kw))) return intent;
  }
  return "unknown";
}

// ── Arabic helpers ────────────────────────────────────────────────────────

const STATUS_AR: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
  available: "متاح",
  busy: "مشغول",
  on_break: "في استراحة",
  offline: "غير متصل",
};

const PRESSURE_AR: Record<string, { label: string; emoji: string }> = {
  low:    { label: "منخفض", emoji: "🟢" },
  medium: { label: "متوسط", emoji: "🟡" },
  high:   { label: "عالٍ",   emoji: "🔴" },
};

const PRIORITY_AR: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

// ── Handlers ──────────────────────────────────────────────────────────────

async function handleTasksStats(ctx: EmployeeContext): Promise<AssistantResponse> {
  const stats = await getTaskStats(ctx);
  if (!stats) {
    return { content: "تعذّر جلب إحصائيات المهام في الوقت الحالي." };
  }

  const scopeLabel =
    ctx.role === "super_admin" ? "جميع الفرق" :
    ctx.role === "track_manager" ? "فريقك" : "مهامك";

  const content = `📋 **إحصائيات المهام** (${scopeLabel})

- **الإجمالي:** ${stats.total} مهمة
- **قيد الانتظار:** ${stats.pending}
- **جارية:** ${stats.in_progress}
- **مكتملة:** ${stats.completed}
${stats.cancelled > 0 ? `- **ملغاة:** ${stats.cancelled}` : ""}`;

  return {
    content,
    actions: [
      { label: "فتح المهام", href: "/dashboard/tasks" },
    ],
  };
}

async function handleMyTasks(ctx: EmployeeContext): Promise<AssistantResponse> {
  const tasks = await getMyTasks(ctx);
  if (!tasks.length) {
    return {
      content: "ما عندك مهام معلقة حالياً. 🎉",
      actions: [{ label: "فتح المهام", href: "/dashboard/tasks" }],
    };
  }

  const lines = tasks.map((t) => {
    const due = t.due_date ? ` · تستحق ${new Date(t.due_date).toLocaleDateString("ar-SA")}` : "";
    return `• **${t.title}** — ${STATUS_AR[t.status] ?? t.status}${due}`;
  });

  return {
    content: `📌 **مهامك الحالية** (${tasks.length} مهمة):\n\n${lines.join("\n")}`,
    actions: [{ label: "فتح المهام", href: "/dashboard/tasks" }],
  };
}

async function handlePresence(ctx: EmployeeContext): Promise<AssistantResponse> {
  const data = await getTeamPresence(ctx);

  const label =
    ctx.role === "super_admin" ? "جميع الموظفين" : "أعضاء فريقك";

  const statusLines = data.statuses
    .slice(0, 8)
    .map((s) => `• ${s.name} — ${STATUS_AR[s.status] ?? s.status}`);

  const extra = data.statuses.length > 8 ? `\n_(و ${data.statuses.length - 8} آخرين)_` : "";

  return {
    content: `👥 **حضور ${label}**\n\n**${data.online} متصل** من أصل ${data.total}\n\n${statusLines.join("\n")}${extra}`,
    actions: [{ label: "لوحة الحضور", href: "/dashboard/operations" }],
  };
}

async function handleFactoryPressure(): Promise<AssistantResponse> {
  const row = await getFactoryPressure();
  if (!row) {
    return { content: "لم يُسجَّل أي مستوى ضغط للمصنع حتى الآن." };
  }

  const p = PRESSURE_AR[row.level] ?? { label: row.level, emoji: "⚪" };

  return {
    content: `🏭 **ضغط العمل في المصنع**\n\n${p.emoji} المستوى الحالي: **${p.label}**\nآخر تحديث: ${timeAgo(row.updated_at)}`,
    actions: [{ label: "مركز العمليات", href: "/dashboard/operations" }],
  };
}

async function handleDistribution(ctx: EmployeeContext): Promise<AssistantResponse> {
  const stats = await getDistributionSummary(ctx);
  if (!stats) {
    return { content: "تعذّر جلب بيانات التوزيع حالياً." };
  }

  return {
    content: `🚗 **إحصائيات التوزيع**\n\n- **الإجمالي:** ${stats.total} رحلة\n- **قيد الانتظار:** ${stats.pending}\n- **جارية:** ${stats.in_progress}\n- **مكتملة:** ${stats.completed}`,
    actions: [{ label: "لوحة التوزيع", href: "/dashboard/distribution" }],
  };
}

async function handleMeetings(ctx: EmployeeContext): Promise<AssistantResponse> {
  const meetings = await getUpcomingMeetings(ctx);
  if (!meetings.length) {
    return { content: "لا توجد اجتماعات قادمة في الوقت الحالي." };
  }

  const lines = meetings.map((m) => {
    const dt = new Date(m.start_time).toLocaleString("ar-SA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `• **${m.title}** — ${dt}`;
  });

  return {
    content: `📅 **الاجتماعات القادمة** (${meetings.length}):\n\n${lines.join("\n")}`,
    actions: [{ label: "الاجتماعات", href: "/dashboard/meetings" }],
  };
}

function handleGreeting(employeeName?: string): AssistantResponse {
  const name = employeeName ? `يا ${employeeName.split(" ")[0]}` : "";
  return {
    content: `أهلاً ${name}! 👋 أنا **مساعد نسّق الذكي**. يمكنني مساعدتك في:

- عرض إحصائيات المهام
- معرفة حضور الفريق
- مستوى ضغط المصنع
- إحصائيات التوزيع
- الاجتماعات القادمة

اسألني بالعربي عن أي شيء! 🌟`,
    actions: [
      { label: "مهامي", query: "ما هي مهامي؟" },
      { label: "حضور الفريق", query: "من يعمل الآن؟" },
      { label: "إحصائيات المهام", query: "كم عدد المهام؟" },
    ],
  };
}

function handleHelp(): AssistantResponse {
  return {
    content: `🤖 **يمكنني مساعدتك في:**

- **المهام:** "كم عدد المهام؟" أو "ما هي مهامي؟"
- **الفريق:** "من يعمل الآن؟" أو "حضور الفريق"
- **المصنع:** "ضغط العمل في المصنع"
- **التوزيع:** "إحصائيات التوزيع"
- **الاجتماعات:** "الاجتماعات القادمة"

اكتب سؤالك بالعربي وسأجيبك! 😊`,
    actions: [
      { label: "مهامي", query: "ما هي مهامي؟" },
      { label: "حضور الفريق", query: "من يعمل الآن؟" },
    ],
  };
}

function handleUnknown(): AssistantResponse {
  return {
    content: `لم أفهم سؤالك تماماً. جرّب أن تسألني عن:
- المهام والمشاريع
- حضور الفريق
- ضغط المصنع
- رحلات التوزيع

أو اكتب **"مساعدة"** لعرض القائمة الكاملة. 🙂`,
  };
}

// ── Main router ───────────────────────────────────────────────────────────

export async function processMessage(
  message: string,
  ctx: EmployeeContext,
  employeeName?: string,
): Promise<AssistantResponse> {
  const intent = detectIntent(message);

  switch (intent) {
    case "greeting":
      return handleGreeting(employeeName);
    case "help":
      return handleHelp();
    case "my_tasks":
      return handleMyTasks(ctx);
    case "tasks_stats":
      return handleTasksStats(ctx);
    case "presence":
      return handlePresence(ctx);
    case "factory_pressure":
      return handleFactoryPressure();
    case "distribution":
      return handleDistribution(ctx);
    case "meetings":
      return handleMeetings(ctx);
    default:
      return handleUnknown();
  }
}
