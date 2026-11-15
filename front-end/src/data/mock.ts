/**
 * Dados de demonstração — extraídos do design `login copy.pen`.
 *
 * Enquanto a integração com a NASA e o backend Field Shift não está activa,
 * os ecrãs consomem estes dados. Quando o `useNasaAgro` entrar, os mesmos
 * campos serão preenchidos com valores reais e este ficheiro fica apenas
 * como fallback de recurso offline.
 */

import type { BiomeType, SoilTextureType } from "@/types/agronomy";

/* ------------------------------------------------------------------ perfil */

export interface PerfilProdutor {
  nome: string;
  iniciais: string;
  sitio: string;
  localizacao: string;
  provincia: string;
  bioma: BiomeType;
  solo: SoilTextureType;
  areaHectares: number;
}

export const perfil: PerfilProdutor = {
  nome: "Dona Maria",
  iniciais: "DM",
  sitio: "Sítio Recanto Verde",
  localizacao: "Caxito",
  provincia: "Bengo",
  bioma: "tropical",
  solo: "franco",
  areaHectares: 2.5,
};

/* ------------------------------------------------------------------- clima */

export interface DiaPrevisao {
  data: string; // ISO
  diaSemana: string; // "qua"
  dia: number;
  maximaC: number;
  minimaC: number;
  chuvaMm: number;
  descricao: string;
}

export interface ResumoClima {
  temperaturaC: number;
  sensacao: string;
  chuvaMm: number;
  chuvaTexto: string;
  humidadeArPct: number;
  humidadeAmanhaPct: number;
  ventoKmh: number;
  ventoDireccao: string;
  radiacaoKwh: number;
  radiacaoTexto: string;
  ceu: string;
  alertaPrincipal: {
    titulo: string;
    texto: string;
    tom: "atencao" | "bom";
  };
}

export const resumoClima: ResumoClima = {
  temperaturaC: 28,
  sensacao: "Sol morno, bom para o campo",
  chuvaMm: 0,
  chuvaTexto: "Não deve chover hoje. Ótima hora para molhar as plantas com calma.",
  humidadeArPct: 58,
  humidadeAmanhaPct: 62,
  ventoKmh: 12,
  ventoDireccao: "Do leste",
  radiacaoKwh: 6.4,
  radiacaoTexto: "Dia forte",
  ceu: "Céu claro com nuvens mansas. Vento brando soprando do leste.",
  alertaPrincipal: {
    titulo: "Cuidado com a seca",
    texto:
      "A água do solo está 22% abaixo da média. Regue o canteiro de cima amanhã cedo.",
    tom: "atencao",
  },
};

export const previsaoSemana: DiaPrevisao[] = [
  {
    data: "2026-11-12",
    diaSemana: "qua",
    dia: 12,
    maximaC: 28,
    minimaC: 20,
    chuvaMm: 0,
    descricao: "Céu claro",
  },
  {
    data: "2026-11-13",
    diaSemana: "qui",
    dia: 13,
    maximaC: 29,
    minimaC: 21,
    chuvaMm: 0,
    descricao: "Sol forte",
  },
  {
    data: "2026-11-14",
    diaSemana: "sex",
    dia: 14,
    maximaC: 27,
    minimaC: 20,
    chuvaMm: 2,
    descricao: "Nublado",
  },
  {
    data: "2026-11-15",
    diaSemana: "sáb",
    dia: 15,
    maximaC: 25,
    minimaC: 19,
    chuvaMm: 18,
    descricao: "Chuva",
  },
  {
    data: "2026-11-16",
    diaSemana: "dom",
    dia: 16,
    maximaC: 24,
    minimaC: 18,
    chuvaMm: 32,
    descricao: "Chuva forte",
  },
  {
    data: "2026-11-17",
    diaSemana: "seg",
    dia: 17,
    maximaC: 26,
    minimaC: 19,
    chuvaMm: 6,
    descricao: "Chuva fraca",
  },
  {
    data: "2026-11-18",
    diaSemana: "ter",
    dia: 18,
    maximaC: 28,
    minimaC: 20,
    chuvaMm: 0,
    descricao: "Céu limpo",
  },
];

export const alertasNasa: { titulo: string; texto: string; tom: "atencao" | "bom" }[] = [
  {
    titulo: "Cuidado com a seca",
    texto:
      "A água do solo está 22% abaixo da média. Regue o canteiro de cima amanhã cedo.",
    tom: "atencao",
  },
  {
    titulo: "Bom dia para plantar",
    texto: "A chuva volta na quinta. A terra vai estar boa para semear.",
    tom: "bom",
  },
];

/* ------------------------------------------------------------------- terra */

export interface Canteiro {
  id: string;
  nome: string;
  culturas: string;
  humidadePct: number;
  estado: "bom" | "precisa_agua" | "seco";
}

export interface ResumoSolo {
  humidadeRaizPct: number;
  humidadeRaizEstado: "seco" | "precisa_agua" | "ideal" | "encharcado";
  humidadeRaizTexto: string;
  humidadeSuperficiePct: number;
  humidadeSuperficieTexto: string;
  temperaturaSoloC: number;
  temperaturaSoloTexto: string;
  diasSemChuva: number;
  diasSemChuvaTexto: string;
}

export const resumoSolo: ResumoSolo = {
  humidadeRaizPct: 72,
  humidadeRaizEstado: "ideal",
  humidadeRaizTexto: "Na medida certa para plantar",
  humidadeSuperficiePct: 55,
  humidadeSuperficieTexto: "O solo de cima está úmido",
  temperaturaSoloC: 24,
  temperaturaSoloTexto: "Frio bom para as raízes",
  diasSemChuva: 9,
  diasSemChuvaTexto: "Aguarde a chuva de quinta",
};

export const canteiros: Canteiro[] = [
  {
    id: "canteiro-principal",
    nome: "Canteiro Principal",
    culturas: "Alface, Couve e Tomate Cereja",
    humidadePct: 72,
    estado: "bom",
  },
  {
    id: "horta-da-cozinha",
    nome: "Horta da Cozinha",
    culturas: "Cebolinha, Manjericão e Salsinha",
    humidadePct: 58,
    estado: "precisa_agua",
  },
  {
    id: "baixa-do-riacho",
    nome: "Baixa do Riacho",
    culturas: "Feijão e Milho",
    humidadePct: 35,
    estado: "seco",
  },
];

export const accoesSolo: {
  titulo: string;
  descricao: string;
  icone: "regar" | "adubar" | "plantar";
}[] = [
  { titulo: "Regar", descricao: "Usar 20 litros no canteiro da horta", icone: "regar" },
  { titulo: "Adubar", descricao: "A hora boa é de manhã cedo", icone: "adubar" },
  { titulo: "Plantar", descricao: "A terra do canteiro principal está pronta", icone: "plantar" },
];

/* ----------------------------------------------------------------- plantas */

export interface Planta {
  id: string;
  nome: string;
  canteiro: string;
  cuidado: string;
  estado: string;
  tom: "bom" | "atencao" | "neutro";
}

export const plantas: Planta[] = [
  {
    id: "tomate-cereja",
    nome: "Tomate Cereja",
    canteiro: "Canteiro Principal",
    cuidado: "Precisa de estaca agora",
    estado: "Florindo",
    tom: "bom",
  },
  {
    id: "alface",
    nome: "Alface",
    canteiro: "Canteiro Principal",
    cuidado: "Pode colher em 3 dias",
    estado: "Pronta",
    tom: "bom",
  },
  {
    id: "couve",
    nome: "Couve",
    canteiro: "Canteiro Principal",
    cuidado: "Rega de 2 em 2 dias",
    estado: "Crescendo",
    tom: "neutro",
  },
  {
    id: "feijao",
    nome: "Feijão",
    canteiro: "Baixa do Riacho",
    cuidado: "Solo seco, precisa de água",
    estado: "Com sede",
    tom: "atencao",
  },
  {
    id: "cebolinha",
    nome: "Cebolinha",
    canteiro: "Horta da Cozinha",
    cuidado: "Corte as folhas de cima",
    estado: "Cortando",
    tom: "neutro",
  },
];

export interface Colheita {
  id: string;
  cultura: string;
  quantidade: string;
  data: string; // ISO
  origem: "mercado" | "casa";
}

export const colheitas: Colheita[] = [
  { id: "c1", cultura: "Alface", quantidade: "12 cabeças", data: "2026-11-11", origem: "mercado" },
  { id: "c2", cultura: "Tomate", quantidade: "8 kg", data: "2026-11-12", origem: "casa" },
  { id: "c3", cultura: "Cebolinha", quantidade: "3 maços", data: "2026-11-10", origem: "casa" },
];

/* ------------------------------------------------------------------ contas */

export interface MovimentoConta {
  id: string;
  descricao: string;
  data: string; // ISO
  valor: number; // positivo = entrada, negativo = saída
  categoria: string;
}

export const resumoContas = {
  mes: "novembro",
  entrou: 1480,
  saiu: 620.5,
  sobrou: 859.5,
  rotuloEntrada: "Dinheiro que entrou",
  descricaoEntrada: "Ganhos no mercado",
  rotuloSaida: "Dinheiro que saiu",
  descricaoSaida: "Adubo, sementes e água",
  rotuloSobra: "Sobrou",
  descricaoSobra: "Para o próximo mês",
};

export const movimentos: MovimentoConta[] = [
  { id: "m1", descricao: "Venda de alface no mercado", data: "2026-11-12", valor: 240, categoria: "Venda" },
  { id: "m2", descricao: "Compra de adubo", data: "2026-11-10", valor: -185, categoria: "Gasto" },
  { id: "m3", descricao: "Venda de tomate", data: "2026-11-09", valor: 320, categoria: "Venda" },
  { id: "m4", descricao: "Conta de água", data: "2026-11-08", valor: -95.5, categoria: "Gasto" },
  { id: "m5", descricao: "Venda de cebola", data: "2026-11-07", valor: 180, categoria: "Venda" },
  { id: "m6", descricao: "Sementes e mudas", data: "2026-11-05", valor: -140, categoria: "Gasto" },
];

/* --------------------------------------------------------------- calendário */

export interface MesPlantio {
  mes: string;
  condicao: string;
  culturas: string[];
}

export const calendarioMeses: MesPlantio[] = [
  { mes: "Novembro", condicao: "Sombreado", culturas: ["Alface", "Couve", "Milho"] },
  { mes: "Dezembro", condicao: "Sol pleno", culturas: ["Cebola", "Tomate", "Feijão"] },
  { mes: "Janeiro", condicao: "Sol pleno", culturas: ["Abóbora", "Pepino", "Milho"] },
  { mes: "Fevereiro", condicao: "Sol pleno", culturas: ["Couve-flor", "Alface", "Cenoura"] },
];

export interface TarefaPlantio {
  id: string;
  titulo: string;
  detalhe: string;
  prazo: string;
  prazoCurto: string;
}

export const tarefasPlantio: TarefaPlantio[] = [
  {
    id: "t1",
    titulo: "Preparar o canteiro da couve",
    detalhe: "Cavar 20 cm e adubar com esterco",
    prazo: "Amanhã",
    prazoCurto: "Amanhã",
  },
  {
    id: "t2",
    titulo: "Comprar sementes de alface",
    detalhe: "Mercado da cidade",
    prazo: "Sexta, de manhã",
    prazoCurto: "Sexta",
  },
  {
    id: "t3",
    titulo: "Fazer a estaca do tomate",
    detalhe: "Galho de madeira de 1 metro",
    prazo: "Hoje",
    prazoCurto: "Hoje",
  },
];

/* ---------------------------------------------------------------- agrónoma */

export interface MensagemChat {
  id: string;
  autor: "agronoma" | "produtor";
  texto: string;
  hora: string;
}

export const mensagensChat: MensagemChat[] = [
  {
    id: "c1",
    autor: "agronoma",
    texto:
      "Bom dia, Dona Maria! Vi que o solo da Baixa do Riacho está com 35% de humidade. Já estou a ver isso.",
    hora: "11:42",
  },
  {
    id: "c2",
    autor: "produtor",
    texto:
      "Bom dia, Dona Maria! Vi que o solo da Baixa do Riacho está seco. Quer que eu passe aí de manhã?",
    hora: "11:45",
  },
  {
    id: "c3",
    autor: "produtor",
    texto: "Sim, por favor. Depois das 9h.",
    hora: "11:47",
  },
  {
    id: "c4",
    autor: "agronoma",
    texto:
      "Combinado, Dona Maria! Vou levar um balde de esterco para ajudar. Não se preocupe com nada.",
    hora: "11:48",
  },
];

export const perguntasProntas: string[] = [
  "Quando semear o milho?",
  "Como cuidar do solo seco?",
  "Quanto vou gastar de adubo?",
];

/* ------------------------------------------------------------------- ajuda */

export interface SecaoAudio {
  id: string;
  titulo: string;
  resumo: string;
}

export const secoesAudio: SecaoAudio[] = [
  {
    id: "tempo",
    titulo: "O tempo de hoje",
    resumo: "28 graus, céu claro e sem chuva. Bom dia para regar de manhã cedo.",
  },
  {
    id: "terra",
    titulo: "A minha terra",
    resumo:
      "O canteiro da horta está úmido. A baixa do riacho está seca e precisa de água.",
  },
  {
    id: "plantas",
    titulo: "As minhas plantas",
    resumo:
      "O tomate está florindo e precisa de estaca. A alface pode colher em 3 dias.",
  },
  {
    id: "contas",
    titulo: "Minhas contas",
    resumo: "Entraram 1.480 kuanzas e saíram 620. Sobrou 859 kuanzas este mês.",
  },
];

export const preferenciasAudio = {
  velocidade: "Normal",
  letra: "Grande",
  lerTudoAoAbrir: "Ligado",
};

/* ------------------------------------------------------------------- dicas */

export interface DicaDia {
  id: string;
  titulo: string;
  texto: string;
  etiqueta: string;
  tom: "bom" | "atencao" | "neutro";
}

export const dicasDoDia: DicaDia[] = [
  {
    id: "d1",
    titulo: "Tomate Cereja",
    texto: "Já estão florindo bastante. Hora de colocar as estacas.",
    etiqueta: "Pronta para tutorar",
    tom: "bom",
  },
  {
    id: "d2",
    titulo: "Água da Horta",
    texto: "Você economizou 4 baldes cheios de água esta semana.",
    etiqueta: "Cuidado exemplar",
    tom: "bom",
  },
  {
    id: "d3",
    titulo: "Próximo Mercado",
    texto: "Sábado pela manhã na praça do mercado. Leve o que sobrou.",
    etiqueta: "Daqui a 3 dias",
    tom: "neutro",
  },
];
