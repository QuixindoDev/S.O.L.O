import type { LucideIcon } from "lucide-react";
import {
  CloudSun,
  House,
  Leaf,
  MessageCircle,
  Repeat,
  Sprout,
  Volume2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Menu da aplicação.
 * A ordem segue o dia-a-dia do agricultor: primeiro o que vai fazer hoje,
 * depois o plantio/rotação e a ajuda no fim.
 */
export const navGroups: NavGroup[] = [
  {
    label: "MEU DIA A DIA",
    items: [
      { label: "Início", href: "/inicio", icon: House },
      { label: "Previsão do Tempo", href: "/previsao-do-tempo", icon: CloudSun },
      { label: "Minha Terra e Horta", href: "/minha-terra-e-horta", icon: Sprout },
      { label: "Minhas Plantas", href: "/minhas-plantas", icon: Leaf },
    ],
  },
  {
    label: "PLANTIO E ROTAÇÃO",
    items: [
      { label: "Rotação de Culturas", href: "/rotacao-de-culturas", icon: Repeat },
    ],
  },
  {
    label: "AJUDA",
    items: [
      { label: "Falar com a Agrônoma", href: "/falar-com-a-agronoma", icon: MessageCircle },
      { label: "Ouvir Ajuda", href: "/ouvir-ajuda", icon: Volume2 },
    ],
  },
];
