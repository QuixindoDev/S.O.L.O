import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AuthHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Diâmetro do círculo do ícone: 72px (ecrãs 1 e 1B), 84px (ecrã 2), 76px (ecrã 3). */
  iconSize?: 72 | 76 | 84;
  titleSize?: 32 | 34;
  className?: string;
}

/** Cabeçalho dos ecrãs de autenticação: ícone, título e frase de ajuda. */
export function AuthHero({
  icon: Icon,
  title,
  subtitle,
  iconSize = 72,
  titleSize = 34,
  className,
}: AuthHeroProps) {
  return (
    <div className={cn("flex w-full flex-col items-center gap-3.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary-soft",
          iconSize === 72 && "size-[72px]",
          iconSize === 76 && "size-[76px]",
          iconSize === 84 && "size-[84px]"
        )}
      >
        <Icon
          size={iconSize === 84 ? 40 : iconSize === 76 ? 38 : 36}
          className="text-primary"
          aria-hidden="true"
        />
      </span>

      <h1
        className={cn(
          "text-center font-bold text-text-primary",
          titleSize === 32 ? "text-[32px]" : "text-[34px]"
        )}
      >
        {title}
      </h1>

      <p
        className={cn(
          "w-full text-center text-text-secondary",
          titleSize === 32 ? "text-[19px]/[29px]" : "text-[20px]/[30px]"
        )}
      >
        {subtitle}
      </p>
    </div>
  );
}
