/**
 * Contratos dos blocos reutilizáveis de `components/ui`.
 * Nenhum componente de UI tem lógica de negócio — apenas apresentação.
 */

import type { LucideIcon } from "lucide-react";

/** Aparência do `ui/Button`. */
export type ButtonVariant =
  | "primary" // verde da marca — acção principal
  | "outline" // fundo branco com borda
  | "soft" // fundo surface-soft
  | "warm" // botão "Ouvir Ajuda"
  | "ghost" // sem fundo, só o texto
  | "link"; // ligação em texto (ex. "Já tem uma conta? Entrar")

/** Alturas do `ui/Button` (regra: alvo de toque >= 48px). */
export type ButtonSize = "sm" | "md" | "lg";

/** Aparência do `ui/Card`. */
export type CardVariant = "default" | "soft";

/** Item de navegação da `layout/Sidebar`. */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
