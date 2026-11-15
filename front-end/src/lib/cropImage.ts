/**
 * Fotografias das culturas.
 *
 * Os cards de "Minhas Plantas" e de "Colheitas recentes" mostram uma
 * foto por cultura. O back-end devolve apenas o nome da cultura, por
 * isso associamos aqui cada cultura à fotografia da pasta `public`.
 */

/** Tira acentos e normaliza para comparar nomes escritos de formas diferentes. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const FOTOS: { chaves: string[]; src: string }[] = [
  {
    chaves: ["tomate", "tomate cereja", "pomarod"],
    src: "/2304.jpg",
  },
  {
    chaves: ["alface", "lettuce"],
    src: "/organicos-miller-alface-americana-organicos-miller-12un-embaladas-individualmente-1660944695.jpg",
  },
  {
    chaves: ["couve", "repolho", "brassica"],
    src: "/Vente-directe-de-legumes-1024x684.webp",
  },
  {
    chaves: ["feijao", "feijao-carioca", "soja", "grao"],
    src: "/soja-lavoura.jpg",
  },
  {
    chaves: ["cebola", "cebolinha", "cheiro-verde"],
    src: "/images3.jpg",
  },
  {
    chaves: ["cenoura", "beterraba"],
    src: "/images3.jpg",
  },
  {
    chaves: ["milho", "mandioca"],
    src: "/Vente-directe-de-legumes-1024x684.webp",
  },
  {
    chaves: ["batata", "abobora", "inhame", "nabo"],
    src: "/images2.jpg",
  },
];

/** Foto por defeito: a muda a germinar na terra da horta. */
const FOTO_PADRAO = "/images.jpg";

/**
 * Fotografia de uma cultura.
 *
 * Procura o nome da cultura (planta ou colheita) na lista de fotografias
 * e devolve a primeira que encaixa; se nenhuma encaixa, devolve a
 * fotografia por defeito.
 */
export function cropImageFor(nome: string | null | undefined): string {
  const alvo = normalizar(nome ?? "");
  if (!alvo) return FOTO_PADRAO;

  for (const foto of FOTOS) {
    const chaves = foto.chaves.map(normalizar);
    if (chaves.some((chave) => alvo.includes(chave))) {
      return foto.src;
    }
  }

  return FOTO_PADRAO;
}
