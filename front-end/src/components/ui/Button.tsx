import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "soft" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-sm",
  soft: "bg-surface-soft text-primary hover:bg-primary-soft",
  outline:
    "bg-surface text-text-primary border border-border hover:bg-surface-soft",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-soft",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm gap-1.5 rounded-lg",
  md: "h-14 px-5 text-lg gap-2 rounded-input",
  lg: "h-16 px-7 text-xl gap-2.5 rounded-input",
};

const ICON_SIZES: Record<ButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Atributos comuns a `<button>` e `<a>`. Usamos `HTMLElement` para que
 * o mesmo conjunto de props sirva para os dois casos.
 */
export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  /** Se indicado, renderiza um link em vez de um `<button>`. */
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

/**
 * Botão do S.O.L.O.
 * Alturas: sm 40px · md 56px · lg 64px — sempre ≥ 48px para toque com luvas.
 *
 * Com `href` renderiza um `<Link>`; sem `href`, um `<button>`.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  href,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const iconSize = ICON_SIZES[size];

  const classes = cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-bold transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {Icon && iconPosition === "left" && <Icon size={iconSize} aria-hidden />}
      {children}
      {Icon && iconPosition === "right" && <Icon size={iconSize} aria-hidden />}
    </>
  );

  if (href) {
    // `type` e `children` já foram extraídos nos parâmetros.
    const { disabled: _disabled, ...anchorProps } = props;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
