import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CloudSun,
  House,
  Leaf,
  MessageCircle,
  Repeat,
  Sprout,
  Volume2,
  Wallet,
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
 * Menu da aplicação — 4 grupos, 9 subsecções.
 * A ordem segue o dia-a-dia do agricultor: primeiro o que vai fazer hoje,
 * depois o plantio, depois o dinheiro, e a ajuda sempre no fim.
 *
 * Os `href` são slugs em português — é o que aparece no URL e é o que
 * a Dona Maria vai ler no ecrã do telemóvel.
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
      { label: "Calendário de Plantio", href: "/calendario-de-plantio", icon: CalendarDays },
    ],
  },
  {
    label: "DINHEIRO",
    items: [{ label: "Meu Caderninho", href: "/meu-caderninho", icon: Wallet }],
  },
  {
    label: "AJUDA",
    items: [
      { label: "Falar com a Agrônoma", href: "/falar-com-a-agronoma", icon: MessageCircle },
      { label: "Ouvir Ajuda", href: "/ouvir-ajuda", icon: Volume2 },
    ],
  },
];
