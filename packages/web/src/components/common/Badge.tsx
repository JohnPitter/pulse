import type { ReactNode } from "react";

type BadgeVariant = "orange" | "green" | "yellow" | "red" | "stone" | "purple";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  stone: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function Badge({ children, variant = "stone", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
