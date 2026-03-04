import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  hover = false,
  glow = false,
  onClick,
}: GlassCardProps) {
  const Tag = onClick ? "button" : "div";
  const hoverClasses = hover
    ? "transition-all duration-200 hover:scale-[1.02] hover:shadow-8 hover:border-[var(--card-hover-border)] active:scale-[0.98]"
    : "";
  const baseClass = glow ? "card-glow" : "glass";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${baseClass} rounded-xl ${hoverClasses} ${className}`}
    >
      {children}
    </Tag>
  );
}
