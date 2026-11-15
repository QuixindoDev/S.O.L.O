import { redirect } from "next/navigation";

/**
 * Raiz da aplicação.
 *
 * A Dona Maria não deve ter de escolher um ecrã — o dashboard
 * "Meu Caderno da Terra" é o ponto de partida.
 */
export default function Home() {
  redirect("/inicio");
}
