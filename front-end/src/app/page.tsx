import { redirect } from "next/navigation";

/** A raiz leva directamente ao ecrã de entrada. */
export default function Home() {
  redirect("/entrar");
}
