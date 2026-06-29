"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير")
      .regex(/[0-9]/, "يجب أن تحتوي على رقم"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (authError) {
      setError(
        authError.message.includes("same password")
          ? "كلمة المرور الجديدة يجب أن تختلف عن القديمة"
          : "حدث خطأ، يرجى طلب رابط جديد"
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">تم تغيير كلمة المرور</p>
          <p className="text-sm text-muted-foreground mt-1">
            يتم توجيهك إلى لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور الجديدة</Label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className={cn("ps-10 pe-10", errors.password && "border-destructive")}
            autoComplete="new-password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPass ? "إخفاء" : "إظهار"}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          8 أحرف على الأقل، حرف كبير ورقم واحد
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className={cn("ps-10 pe-10", errors.confirm && "border-destructive")}
            autoComplete="new-password"
            {...register("confirm")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? "إخفاء" : "إظهار"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          "حفظ كلمة المرور الجديدة"
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
