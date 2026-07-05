"use client";

import { useState, useTransition } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCircularAction } from "@/app/(dashboard)/dashboard/circulars/actions";
import { toast } from "sonner";

export function CreateCircularDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      const result = await createCircularAction({ title, body });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم إرسال الإعلان إلى جميع الموظفين");
        setOpen(false);
        setTitle("");
        setBody("");
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Megaphone className="h-4 w-4 me-1.5" />
        إنشاء إعلان
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              إنشاء إعلان جديد
            </DialogTitle>
            <DialogDescription>
              سيُرسَل الإعلان إلى جميع الموظفين النشطين فور النشر.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="announcement-title">عنوان الإعلان</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: إجازة رسمية يوم الأحد"
                maxLength={120}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="announcement-body">محتوى الإعلان</Label>
              <Textarea
                id="announcement-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب محتوى الإعلان هنا…"
                rows={4}
                maxLength={800}
                required
                disabled={isPending}
                className="resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending || !title.trim() || !body.trim()}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                ) : (
                  <Megaphone className="h-4 w-4 me-1.5" />
                )}
                نشر الإعلان
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
