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
        "rounded-2xl border bg-card p-5",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-2 leading-none tabular-nums", colorClass)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            colorClass
          )}
          style={{ background: "hsl(var(--n-gold) / .08)" }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
