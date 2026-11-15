/**
 * Validação dos formulários do S.O.L.O.
 *
 * Regra do projecto: cada erro vive **no campo que o causou**. O produtor
 * lê "Este campo precisa de um número" olhando para o campo, sem procurar.
 *
 * Por isso a validação devolve um mapa `campo -> mensagem`, e nunca uma
 * frase única sobre o formulário todo.
 */

import type { LoginPayload, RegisterPayload } from "@/types/api";

/** Erros por campo. Um campo sem chave = campo válido (ou não preenchido). */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Número angolano: 9 dígitos, começa por 9.
 * Aceita espaços, traços e parênteses porque é assim que as pessoas escrevem.
 */
const TELEFONE_ANGOLA = /^9\d{8}$/;

/** Deixa só os dígitos — para comparar sem os separadores que a pessoa digitou. */
export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** O campo está vazio? (só espaços não contam) */
function vazio(valor: string): boolean {
  return valor.trim() === "";
}

/**
 * Valida o formulário "Criar Conta".
 * Devolve `{}` quando está tudo bem.
 */
export function validarRegisto(form: RegisterPayload): FieldErrors<RegisterPayload> {
  const erros: FieldErrors<RegisterPayload> = {};

  if (vazio(form.nome)) {
    erros.nome = "Escreva o seu nome ou o nome do sítio.";
  }

  const digitos = soDigitos(form.telefone);
  if (vazio(form.telefone)) {
    erros.telefone = "Escreva o seu número de WhatsApp ou celular.";
  } else if (digitos.length < 9) {
    erros.telefone = "O número está incompleto. Escreva os 9 dígitos.";
  } else if (digitos.length > 9) {
    erros.telefone = "Este número tem dígitos a mais. Um número angolano tem 9.";
  } else if (!TELEFONE_ANGOLA.test(digitos)) {
    erros.telefone = "Este número não parece de Angola. Começa por 9 e tem 9 dígitos.";
  }

  if (vazio(form.senha)) {
    erros.senha = "Escolha uma senha para entrar depois.";
  } else if (form.senha.length < 4) {
    erros.senha = "A senha é muito curta. Use pelo menos 4 caracteres.";
  }

  // A cidade é opcional — mas, se for escrita, tem de fazer sentido.
  if (!vazio(form.cidade) && form.cidade.trim().length < 2) {
    erros.cidade = "Escreva o nome da sua cidade e estado.";
  }

  return erros;
}

/** Valida o formulário "Entrar". */
export function validarLogin(form: LoginPayload): FieldErrors<LoginPayload> {
  const erros: FieldErrors<LoginPayload> = {};

  const digitos = soDigitos(form.telefone);
  if (vazio(form.telefone)) {
    erros.telefone = "Escreva o seu número de WhatsApp ou celular.";
  } else if (digitos.length < 9) {
    erros.telefone = "O número está incompleto. Escreva os 9 dígitos.";
  } else if (digitos.length > 9) {
    erros.telefone = "Este número tem dígitos a mais. Um número angolano tem 9.";
  }

  if (vazio(form.senha)) {
    erros.senha = "Escreva a sua senha.";
  }

  return erros;
}

/**
 * Primeiro campo com erro — para levar o foco do teclado até lá.
 * A ordem das chaves segue a ordem de escrita no objecto, que por sua vez
 * segue a ordem dos campos no ecrã.
 */
export function primeiroErro<T>(erros: FieldErrors<T>): keyof T | null {
  const chaves = Object.keys(erros) as (keyof T)[];
  return chaves.length > 0 ? chaves[0] : null;
}
