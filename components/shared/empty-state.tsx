import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const padding = size === "sm" ? "py-8 px-6" : size === "lg" ? "py-16 px-8" : "py-12 px-8";
  const iconSize = size === "sm" ? "w-10 h-10 [&>*]:h-5 [&>*]:w-5" : size === "lg" ? "w-20 h-20 [&>*]:h-10 [&>*]:w-10" : "w-14 h-14 [&>*]:h-7 [&>*]:w-7";
  const titleSize = size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl text-center",
        "border border-dashed",
        padding,
        className
      )}
      style={{ borderColor: "hsl(var(--n-gold) / 0.18)", background: "hsl(var(--n-gold) / 0.02)" }}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 rounded-2xl flex items-center justify-center shrink-0",
            iconSize
          )}
          style={{
            background: "linear-gradient(135deg, hsl(var(--n-dark) / .06), hsl(var(--n-dark) / .03))",
            color: "hsl(var(--n-ink-3))",
          }}
        >
          {icon}
        </div>
      )}
      <p className={cn("font-semibold text-foreground leading-snug", titleSize)}>
        {title}
      </p>
      {description && (
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
