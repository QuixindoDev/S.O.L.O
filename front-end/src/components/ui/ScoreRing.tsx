import React from "react";
import { cn } from "@/lib/cn";

export interface ScoreRingProps {
  /** 0-100 */
  value: number;
  label?: string;
  /** Sufixo do número — "%" por omissão quando o valor é uma percentagem. */
  suffix?: string;
  size?: number;
  tone?: "primary" | "warning" | "danger";
  className?: string;
}

const TONES = {
  primary: { stroke: "var(--color-primary)", track: "var(--color-primary-soft)" },
  warning: { stroke: "var(--color-warning)", track: "var(--color-warning-soft)" },
  danger: { stroke: "var(--color-danger)", track: "var(--color-danger)" },
};

/**
 * Medidor circular de pontuação (0-100).
 * O número é sempre grande — é o que a pessoa lê primeiro.
 */
export function ScoreRing({
  value,
  label,
  suffix = "%",
  size = 170,
  tone = "primary",
  className,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const strokeWidth = 6;
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const colors = TONES[tone];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={
        {
          width: size,
          height: size,
          maxWidth: "100%",
          "--ring-value-size": `${Math.round(size * 0.27)}px`,
          "--ring-label-size": `${Math.max(12, Math.round(size * 0.09))}px`,
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-2 text-center">
        <span
          className="font-bold text-primary tabular-nums"
          style={{ fontSize: "var(--ring-value-size)" }}
        >
          {clamped}
          {suffix}
        </span>
        {label && (
          <span
            className="font-bold text-text-secondary"
            style={{ fontSize: "var(--ring-label-size)" }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
