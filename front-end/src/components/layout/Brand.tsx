import { Satellite } from "lucide-react";

/**
 * Marca do S.O.L.O. — usada na barra superior dos ecrãs de autenticação.
 * (Ecrã 1 "Criar Conta", 1B "Entrar", 2 "SMS Enviado", 3 "Código de Segurança".)
 */
export function Brand() {
  return (
    <div className="flex w-fit shrink-0 items-center justify-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-input bg-primary">
        <Satellite size={26} className="text-white" aria-hidden="true" />
      </span>
      <span className="flex flex-col items-start">
        <span className="text-[24px] leading-none font-bold text-primary">
          S.O.L.O.
        </span>
        <span className="text-[15px] leading-none text-text-muted">Campo Amigo</span>
      </span>
    </div>
  );
}
