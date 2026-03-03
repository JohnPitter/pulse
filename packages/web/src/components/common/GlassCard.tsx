import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = "",
  hover = false,
  onClick,
}: GlassCardProps) {
  const Tag = onClick ? "button" : "div";
  const hoverClasses = hover
    ? "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-white/10 active:scale-[0.98]"
    : "";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-xl border border-white/5 bg-stone-900/80 backdrop-blur-sm ${hoverClasses} ${className}`}
    >
      {children}
    </Tag>
  );
}
