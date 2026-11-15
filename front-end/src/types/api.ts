/**
 * Contratos de rede do S.O.L.O.
 *
 * Separados dos componentes: a UI nunca monta o corpo do pedido à mão,
 * apenas entrega o objecto `payload` ao serviço correspondente.
 */

/** Dados do formulário "Criar Conta" (ecrã 1). */
export interface RegisterPayload {
  nome: string;
  telefone: string;
  cidade: string;
  senha: string;
}

/** Dados do formulário "Entrar" (ecrã 1B). */
export interface LoginPayload {
  telefone: string;
  senha: string;
}

/** Resposta normalizada de qualquer endpoint do S.O.L.O. */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  /** `true` = sucesso; `false` = erro. Espelha o `success` do `StatusMessage`. */
  success: boolean;
  /** Mensagem pronta para mostrar ao produtor. */
  message: string;
  /** Dados de retorno (ex. token, utilizador). */
  data?: T;
}
