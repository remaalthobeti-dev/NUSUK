import { notFound } from "next/navigation";
import { assertAuthenticated } from "@/lib/auth/guards";
import { getTaskDetail } from "@/lib/data/task-detail";
import { TaskDetailClient } from "@/components/assignments/task-detail/task-detail-client";

interface Props {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  await assertAuthenticated();
  const { taskId } = await params;
  const { data, error } = await getTaskDetail(taskId);

  if (error || !data) notFound();

  return <TaskDetailClient data={data} />;
}
