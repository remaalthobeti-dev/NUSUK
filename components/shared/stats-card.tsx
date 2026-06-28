import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  colorClass?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = "text-primary",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-5",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className={cn("text-3xl font-bold mt-1.5 leading-none", colorClass)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            "bg-primary/10 dark:bg-primary/20",
            colorClass
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
