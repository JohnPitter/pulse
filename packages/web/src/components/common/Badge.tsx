import type { ReactNode } from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral" | "purple" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  neutral: "badge-neutral",
  purple: "badge-purple",
  info: "badge-info",
};

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <span className={`badge ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
