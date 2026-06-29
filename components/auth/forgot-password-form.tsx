"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (authError) {
      setError("حدث خطأ أثناء إرسال رابط الاسترداد، يرجى المحاولة مجدداً");
      return;
    }

    setSentTo(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">تم الإرسال</p>
          <p className="text-sm text-muted-foreground mt-1">
            تم إرسال رابط إعادة تعيين كلمة المرور إلى
          </p>
          <p className="text-sm font-medium text-foreground mt-0.5 dir-ltr" dir="ltr">
            {sentTo}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          تحقق من بريدك الوارد وقد تجد الرسالة في مجلد الرسائل غير المرغوب بها.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          العودة لتسجيل الدخول
        </Link>
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
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="example@nusuk.sa"
            className={cn("ps-10", errors.email && "border-destructive")}
            autoComplete="email"
            dir="ltr"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
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
            جاري الإرسال...
          </>
        ) : (
          "إرسال رابط الاسترداد"
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
