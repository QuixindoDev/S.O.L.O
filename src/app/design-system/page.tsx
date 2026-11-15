import type { Metadata } from "next";
import {
  Check,
  CornerDownLeft,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  User,
  UserRound,
  Volume2,
  WifiOff,
} from "lucide-react";
import { AuthHero } from "@/components/features/auth/AuthHero";
import { StepRow } from "@/components/features/auth/StepRow";
import { Brand } from "@/components/layout/Brand";
import {
  Button,
  Callout,
  Card,
  CodeInputs,
  Field,
  Input,
  PhoneNotice,
  StatusMessage,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Design System | S.O.L.O.",
  robots: { index: false, follow: false },
};

/**
 * Preview dos blocos usados **apenas** nos ecrãs de autenticação:
 * 1. Criar Conta · 1B. Entrar · 2. SMS Enviado · 3. Código de Segurança.
 */
export default function DesignSystemPage() {
  return (
    <main className="flex flex-col gap-12 bg-bg px-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-[34px] font-bold text-text-primary">
          Sistema de Design — Autenticação
        </h1>
        <p className="max-w-2xl text-[17px] text-text-secondary">
          Blocos usados nos ecrãs <strong>1. Criar Conta</strong>,{" "}
          <strong>1B. Entrar</strong>, <strong>2. SMS Enviado</strong> e{" "}
          <strong>3. Verificação de Segurança (2FA)</strong>. Tokens em{" "}
          <code className="text-primary">src/app/globals.css</code>.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          Brand + Top Bar (ecrãs 1, 1B, 2 e 3)
        </h2>
        <div className="flex w-full items-center justify-between gap-4 rounded-card bg-surface p-[18px_48px]">
          <Brand />
          <Button
            variant="warm"
            pill
            icon={Volume2}
            className="h-12 px-5 text-[17px]"
          >
            Ouvir Ajuda
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">Button</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="md" icon={Check}>
            CRIAR MINHA CONTA E COMEÇAR
          </Button>
          <Button size="lg" variant="primary" pill className="h-[54px] text-[16px]">
            Falar com a Agrónoma
          </Button>
          <Button
            variant="warm"
            pill
            icon={Volume2}
            className="h-12 px-5 text-[17px]"
          >
            Ouvir Ajuda
          </Button>
          <Button variant="ghost" icon={CornerDownLeft}>
            Já tem uma conta? Entrar
          </Button>
          <Button size="sm">Pequeno 40px</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          AuthHero (ícone + título + frase de ajuda)
        </h2>
        <div className="flex flex-wrap gap-6">
          <Card padding="lg" className="max-w-[600px] gap-7">
            <AuthHero
              icon={UserRound}
              title="Entrar na minha conta"
              subtitle="Bom te ver de novo. Digite seu WhatsApp e sua senha."
            />
          </Card>
          <Card className="max-w-[620px] gap-6">
            <AuthHero
              icon={MessageSquare}
              iconSize={84}
              title="Mensagem enviada!"
              subtitle="Mandamos um SMS comum para o seu celular. É só o código de segurança."
            />
          </Card>
        </div>
      </section>

      <section className="flex max-w-2xl flex-col gap-6">
        <h2 className="text-[24px] font-bold text-text-primary">Field + Input</h2>
        <Field
          id="ds-nome"
          label="Como você quer ser chamada?"
          icon={User}
          hint="Pode ser seu nome, apelido carinhoso ou nome do sítio."
        >
          <Input
            id="ds-nome"
            placeholder="Ex: Dona Maria da Silva ou Sítio Esperança"
          />
        </Field>
        <Field
          id="ds-telefone"
          label="Seu WhatsApp ou Celular"
          icon={Smartphone}
          hint="Usado para você receber os alertas do tempo, de forma simples."
        >
          <Input id="ds-telefone" placeholder="Ex: (+244) 923 456 789" />
        </Field>
        <Field id="ds-cidade" label="Sua Cidade e Estado" icon={MapPin}>
          <Input id="ds-cidade" placeholder="Ex: Caxito - Bengo" />
        </Field>
        <Field
          id="ds-senha"
          label="Crie uma Senha Simples"
          icon={Lock}
          hint="Escolha algo que você lembre sem esforço no dia a dia."
        >
          <Input id="ds-senha" placeholder="Uma palavra ou números fáceis" />
        </Field>
        <Field
          id="ds-erro"
          label="Seu WhatsApp ou Celular"
          icon={Smartphone}
          hint="Usado para você receber os alertas do tempo."
          error="O número está incompleto. Escreva os 9 dígitos."
        >
          <Input
            id="ds-erro"
            placeholder="Ex: (+244) 923 456 789"
            defaultValue="+244 92"
            error="O número está incompleto. Escreva os 9 dígitos."
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          PhoneNotice (ecrãs 2 e 3)
        </h2>
        <PhoneNotice numero="+244 933 300 300" />
        <PhoneNotice
          numero="+244 933 3** ***"
          action={
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-[16px] font-bold text-primary"
            >
              Mudar número
            </button>
          }
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          StepRow (ecrã 2 — como fazer agora)
        </h2>
        <div className="flex w-full max-w-[620px] flex-col gap-3.5">
          <StepRow
            numero={1}
            title="Abra suas mensagens normais"
            description="O aplicativo de Mensagens (SMS) do seu celular."
            icon={MessageSquare}
          />
          <StepRow
            numero={2}
            title="Veja os 6 números"
            description="Foram enviados junto com a mensagem."
            icon={MessageSquare}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          Callout (aviso, boa notícia e ajuda humana)
        </h2>
        <div className="flex w-full max-w-[620px] flex-col gap-4">
          <Callout
            variant="note"
            icon={ShieldCheck}
            description="Seus dados estão protegidos com carinho. Não cobramos nada."
          />
          <Callout
            icon={WifiOff}
            title="Não precisa de internet no celular"
            description="Funciona com sinal fraco. É só receber a mensagem."
          />
          <Callout
            variant="help"
            icon={UserRound}
            title="Precisa de ajuda de uma pessoa real?"
            description="Nossa equipe do campo está pronta para te atender com carinho."
            action={
              <Button variant="primary" pill fullWidth className="h-[54px] text-[16px]">
                Falar com a Agrónoma
              </Button>
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          StatusMessage (retorno dos formulários)
        </h2>
        <div className="flex w-full max-w-[620px] flex-col gap-4">
          <StatusMessage
            success
            message="Pronto, Dona Maria! A sua conta foi criada. Já pode entrar com o seu número."
          />
          <StatusMessage
            success={false}
            message="Não foi possível entrar. O número ou a senha podem estar errados. Tente outra vez."
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          CodeInputs (ecrã 3 — os 6 números do SMS)
        </h2>
        <div className="w-full max-w-[640px]">
          <CodeInputs />
        </div>
      </section>
    </main>
  );
}
