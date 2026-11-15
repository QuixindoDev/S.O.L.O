import { cn } from "@/lib/utils";
import type { ButtonSize, ButtonVariant } from "@/types/ui";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Formato de cápsula — usado no "Ouvir Ajuda" e no "Falar com a Agrónoma". */
  pill?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "bg-surface text-text-primary border border-border hover:bg-surface-soft",
  soft: "bg-surface-soft text-text-primary hover:bg-border",
  warm: "bg-warm text-warm-text hover:brightness-95",
  ghost: "bg-transparent text-primary hover:bg-primary-soft",
  link: "bg-transparent text-primary hover:underline",
};

/**
 * Alturas: `sm` 40px | `md` 56px | `lg` 64px.
 * A regra do projecto é: alvo de toque >= 48px, por isso `sm` só para
 * acções secundárias dentro de cards.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-[15px] gap-1.5",
  md: "h-14 px-5 text-[17px] gap-2",
  lg: "h-16 px-7 text-[20px] gap-2.5",
};

const ICON_SIZES: Record<ButtonSize, number> = { sm: 18, md: 20, lg: 22 };

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  pill = false,
  icon: Icon,
  iconPosition = "left",
  className,
  children,
  ...props
}: ButtonProps) {
  const isLink = variant === "link";

  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-input font-bold",
        "transition-colors focus-visible:outline-3 focus-visible:outline-primary focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        isLink ? "h-auto gap-2 px-0 py-2 text-[18px]" : SIZES[size],
        pill && "rounded-full",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {Icon && iconPosition === "left" && (
        <Icon size={ICON_SIZES[size]} aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon size={ICON_SIZES[size]} aria-hidden="true" />
      )}
    </button>
  );
}
