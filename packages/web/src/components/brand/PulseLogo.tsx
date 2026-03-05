import { useId } from "react";
import { cn } from "../../lib/cn";

interface PulseLogoProps {
  className?: string;
  monochrome?: boolean;
}

export function PulseLogo({ className, monochrome = false }: PulseLogoProps) {
  const gradientId = useId().replace(/[:]/g, "");
  const gradientRef = `url(#${gradientId})`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      {!monochrome && (
        <defs>
          <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9A3C" />
            <stop offset="1" stopColor="#4F7DF3" />
          </linearGradient>
        </defs>
      )}

      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        stroke={monochrome ? "currentColor" : gradientRef}
        strokeWidth="1.5"
      />

      <path
        d="M7.5 7.5H13.8C15.8435 7.5 17.5 9.15646 17.5 11.2C17.5 13.2435 15.8435 14.9 13.8 14.9H10.3"
        stroke={monochrome ? "currentColor" : gradientRef}
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M7.5 10.3H13"
        stroke={monochrome ? "currentColor" : "#FF9A3C"}
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M7.5 13.1H11.5"
        stroke={monochrome ? "currentColor" : "#4F7DF3"}
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle cx="15.95" cy="14.85" r="1.15" fill={monochrome ? "currentColor" : "#4F7DF3"} />
    </svg>
  );
}
