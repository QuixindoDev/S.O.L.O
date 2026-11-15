import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Brand } from "./Brand";

/**
 * Barra superior dos ecrãs de autenticação (sem barra lateral).
 * Regra do projecto: "Ouvir Ajuda" está sempre visível.
 */
export function AuthTopBar() {
  return (
    <header className="flex w-full shrink-0 flex-row items-center justify-between gap-4 bg-surface p-[18px_48px]">
      <Brand />
      <Button
        variant="warm"
        pill
        icon={Volume2}
        className="h-12 px-5 text-[17px]"
        aria-label="Ouvir Ajuda"
      >
        Ouvir Ajuda
      </Button>
    </header>
  );
}
