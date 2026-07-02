"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createTeamAction,
  updateTeamAction,
} from "@/app/(dashboard)/dashboard/teams/actions";
import type { TeamWithStats } from "@/lib/data/teams-management";

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16", "#06b6d4", "#a855f7",
];

const ICON_OPTIONS: Array<{ value: string; emoji: string; label: string }> = [
  { value: "handshake", emoji: "🤝", label: "تعاون" },
  { value: "truck",     emoji: "📦", label: "توصيل" },
  { value: "cpu",       emoji: "💻", label: "تقنية" },
  { value: "settings",  emoji: "⚙️", label: "إعدادات" },
  { value: "users",     emoji: "👥", label: "فريق" },
  { value: "shield",    emoji: "🛡️", label: "أمن" },
  { value: "star",      emoji: "⭐", label: "مميز" },
  { value: "chart",     emoji: "📊", label: "تحليل" },
  { value: "target",    emoji: "🎯", label: "هدف" },
  { value: "globe",     emoji: "🌐", label: "عالمي" },
];

const schema = z.object({
  name: z.string().min(2, "اسم الفريق يجب أن يكون حرفين على الأقل"),
  name_en: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, "اختر لوناً للفريق"),
  icon: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: TeamWithStats | null;
}

export function TeamFormDialog({ open, onOpenChange, team }: Props) {
  const isEdit = !!team;
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      name_en: "",
      description: "",
      color: PRESET_COLORS[0],
      icon: "users",
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  useEffect(() => {
    if (open) {
      reset({
        name: team?.name ?? "",
        name_en: team?.name_en ?? "",
        description: team?.description ?? "",
        color: team?.color ?? PRESET_COLORS[0],
        icon: team?.icon ?? "users",
      });
    }
  }, [open, team, reset]);

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const payload = {
        name: data.name,
        name_en: data.name_en || null,
        description: data.description || null,
        color: data.color,
        icon: data.icon || null,
      };

      const { error } = isEdit
        ? await updateTeamAction(team!.id, payload)
        : await createTeamAction(payload);

      if (error) {
        toast.error(error);
      } else {
        toast.success(isEdit ? "تم تحديث الفريق بنجاح" : "تم إنشاء الفريق بنجاح");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الفريق" : "إنشاء فريق جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "عدّل تفاصيل الفريق. سيظهر التغيير فوراً لجميع الأعضاء."
              : "أدخل تفاصيل الفريق الجديد ليظهر في لوحة التحكم."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogBody>
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">اسم الفريق *</Label>
              <Input
                id="name"
                placeholder="مثال: فريق التسويق"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Name EN */}
            <div className="space-y-1.5">
              <Label htmlFor="name_en">الاسم بالإنجليزية (اختياري)</Label>
              <Input
                id="name_en"
                placeholder="Marketing Team"
                dir="ltr"
                {...register("name_en")}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                placeholder="وصف مختصر لمهام الفريق..."
                rows={2}
                {...register("description")}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>لون الفريق *</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-150",
                      selectedColor === c
                        ? "border-foreground scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              {selectedColor && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ background: selectedColor }}
                  />
                  <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                    {selectedColor}
                  </span>
                </div>
              )}
              {errors.color && (
                <p className="text-xs text-destructive">{errors.color.message}</p>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>أيقونة الفريق</Label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("icon", opt.value)}
                    title={opt.label}
                    className={cn(
                      "flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-all",
                      selectedIcon === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-muted/30 hover:bg-muted"
                    )}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {watch("name") && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-3">معاينة</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${selectedColor}22` }}
                  >
                    {ICON_OPTIONS.find((o) => o.value === selectedIcon)?.emoji ?? "👥"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{watch("name")}</p>
                    {watch("name_en") && (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {watch("name_en")}
                      </p>
                    )}
                  </div>
                  <div
                    className="h-6 w-1 rounded-full ms-auto"
                    style={{ background: selectedColor }}
                  />
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التغييرات" : "إنشاء الفريق"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
