import type { Metadata } from "next";
import { Sprout, ShieldCheck } from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { Callout, Card } from "@/components/ui";
import { CriarContaForm } from "./CriarContaForm";

export const metadata: Metadata = {
  title: "Criar sua Conta Grátis | S.O.L.O.",
  description:
    "Crie a sua conta do S.O.L.O. Campo Amigo em menos de 1 minuto.",
};

export default function CriarContaPage() {
  return (
    <Card padding="lg" className="max-w-[600px] gap-7">
      <AuthHero
        icon={Sprout}
        title="Criar sua Conta Grátis"
        subtitle="Leva menos de 1 minuto para começar a cuidar da sua horta e lavoura."
      />

      <CriarContaForm />

      <Callout
        variant="note"
        icon={ShieldCheck}
        description="Seus dados estão protegidos com carinho. Não cobramos nada."
      />
    </Card>
  );
}
