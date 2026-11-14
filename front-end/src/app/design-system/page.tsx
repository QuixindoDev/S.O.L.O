"use client";

/**
 * ⚠️  ROTA TEMPORÁRIA — apenas para avaliação visual dos componentes.
 *     Apagar antes da demonstração final (ou mover para /dev/design-system
 *     fora da build de produção).
 */

import React, { useState } from "react";
import {
  CalendarDays,
  Check,
  CloudRain,
  Droplets,
  Leaf,
  Sprout,
  Sun,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { IconBox } from "@/components/ui/IconBox";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Select } from "@/components/ui/Select";

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {note && <p className="text-base text-text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>;
}

export default function DesignSystemPage() {
  const [ciclo, setCiclo] = useState("milho");

  return (
    <AppShell
      title="Biblioteca de Componentes"
      subtitle="Rota temporária de avaliação — /design-system"
      location="Feira de Santana - BA"
    >
      <div className="flex flex-col gap-10 pb-20 sm:gap-16">
        {/* AVISO RESPONSIVO */}
        <Card variant="soft" padding="md" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <IconBox icon={TriangleAlert} tone="warning" size="sm" />
          <p className="text-base leading-snug text-text-secondary">
            <strong className="text-text-primary">Responsividade:</strong> estrela a
            janela do browser (ou abre no telemóvel) para ver a barra lateral
            transformar-se em menu <strong>hamburger</strong>. No telemóvel, o
            botão ☰ aparece no canto superior esquerdo.
          </p>
        </Card>

        {/* ÍNDICE */}
        <nav className="flex flex-wrap gap-2">
          {[
            ["botoes", "Botões"],
            ["cartoes", "Cartões"],
            ["etiquetas", "Etiquetas"],
            ["icones", "Ícones"],
            ["formularios", "Formulários"],
            ["pontuacao", "Pontuação"],
            ["estrutura", "Estrutura"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-soft sm:px-4 sm:text-base"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* BOTÕES */}
        <Section
          id="botoes"
          title="Botões"
          note="Variantes × tamanhos. Altura mínima 40px; os principais usam 64px."
        >
          <Card padding="lg" className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold tracking-wider text-text-muted">
                VARIANTES
              </span>
              <Row>
                <Button variant="primary">Guardar</Button>
                <Button variant="soft">Anotar</Button>
                <Button variant="outline">Cancelar</Button>
                <Button variant="ghost">Saber mais</Button>
              </Row>
            </div>
            <Divider />
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold tracking-wider text-text-muted">
                TAMANHOS
              </span>
              <Row>
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg">Grande</Button>
              </Row>
            </div>
            <Divider />
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold tracking-wider text-text-muted">
                COM ÍCONE
              </span>
              <Row>
                <Button icon={Sprout}>Plantar</Button>
                <Button icon={CalendarDays} variant="soft">
                  Calendário
                </Button>
                <Button icon={Check} iconPosition="right" variant="outline">
                  Confirmar
                </Button>
              </Row>
            </div>
            <Divider />
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold tracking-wider text-text-muted">
                LARGURA TOTAL (para mobile)
              </span>
              <Button fullWidth icon={Sprout}>
                Registar canteiro
              </Button>
            </div>
            <Divider />
            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold tracking-wider text-text-muted">
                ÍCONE SOZINHO (sempre com aria-label)
              </span>
              <Row>
                <IconButton icon={Sprout} label="Adicionar planta" tone="soft" />
                <IconButton icon={Check} label="Confirmar" tone="primary" />
                <IconButton icon={Sun} label="Ouvir" tone="warm" />
              </Row>
            </div>
          </Card>
        </Section>

        {/* CARTÕES */}
        <Section
          id="cartoes"
          title="Cartões"
          note="Três variantes. Nunca aninhar cartões sem razão funcional."
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card padding="lg" className="flex flex-col gap-3">
              <Eyebrow icon={Leaf}>PREVISÃO DA ROÇA</Eyebrow>
              <h3 className="text-xl font-bold text-text-primary sm:text-2xl">
                Tempo & Chuva Hoje
              </h3>
              <p className="text-base text-text-secondary sm:text-lg">
                Cartão principal, com fundo branco e borda suave.
              </p>
              <div>
                <Badge>Ideal</Badge>
              </div>
            </Card>
            <Card variant="soft" padding="lg" className="flex flex-col gap-3">
              <IconBox icon={Droplets} tone="surface" />
              <h3 className="text-xl font-bold text-text-primary sm:text-2xl">
                Cartão secundário
              </h3>
              <p className="text-base text-text-secondary sm:text-lg">
                Fundo bege, para informação de apoio.
              </p>
            </Card>
            <Card variant="outline" padding="lg" className="flex flex-col gap-3">
              <IconBox icon={Wallet} tone="soft" />
              <h3 className="text-xl font-bold text-text-primary sm:text-2xl">
                Cartão vazado
              </h3>
              <p className="text-base text-text-secondary sm:text-lg">
                Só a borda, para quando o cartão é mesmo opcional.
              </p>
            </Card>
          </div>
        </Section>

        {/* ETIQUETAS */}
        <Section
          id="etiquetas"
          title="Etiquetas e avisos"
          note="Estados usados no semáforo de risco e nos resumos."
        >
          <Card padding="lg" className="flex flex-col gap-6">
            <Row>
              <Badge tone="primary">Bom</Badge>
              <Badge tone="soft">Neutro</Badge>
              <Badge tone="warning">Atenção</Badge>
              <Badge tone="danger">Risco</Badge>
              <Badge tone="onPrimary">Confirmado</Badge>
            </Row>
            <Divider />
            <Row>
              <IconBox icon={TriangleAlert} tone="warning" size="lg" />
              <IconBox icon={Sun} tone="warm" size="lg" />
              <IconBox icon={Check} tone="primary" size="lg" />
              <IconBox icon={CloudRain} tone="surface" size="lg" />
              <IconBox icon={Leaf} tone="soft" size="lg" />
            </Row>
            <Divider />
            <Row>
              <Avatar initials="DM" size="sm" />
              <Avatar initials="DM" size="md" />
              <Avatar initials="DM" size="lg" />
            </Row>
          </Card>
        </Section>

        {/* FORMULÁRIOS */}
        <Section
          id="formularios"
          title="Formulários"
          note="Campo com rótulo, ícone e texto de ajuda. Selector em cartões."
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card padding="lg" className="flex flex-col gap-6">
              <Field
                label="Como você quer ser chamada?"
                icon={Sprout}
                placeholder="Ex: Dona Maria da Silva"
                helper="Pode ser seu nome, apelido carinhoso ou nome do sítio."
              />
              <Field
                label="Seu WhatsApp ou Celular"
                icon={Droplets}
                placeholder="Ex: (71) 99123-4567"
                helper="Usado para você receber os alertas do tempo."
              />
              <div className="flex flex-col gap-2">
                <label className="text-lg font-bold text-text-primary sm:text-xl">
                  Campo simples
                </label>
                <Input placeholder="Ex: Feira de Santana - BA" />
              </div>
            </Card>

            <Card padding="lg" className="flex flex-col gap-6">
              <Select
                label="Cultura da Safra Principal"
                value={ciclo}
                onChange={setCiclo}
                options={[
                  {
                    value: "milho",
                    label: "Milho",
                    description: "Zea mays — alto consumo de água",
                  },
                  {
                    value: "soja",
                    label: "Soja",
                    description: "Glycine max — fixa nitrogénio no solo",
                  },
                  {
                    value: "arroz",
                    label: "Arroz de Sequeiro",
                    description: "Consumo de água elevado",
                  },
                ]}
              />
              <p className="text-base text-text-muted">
                Valor actual:{" "}
                <strong className="text-text-primary">{ciclo}</strong> — clique no
                selector para ver o menu abrir.
              </p>
            </Card>
          </div>
        </Section>

        {/* PONTUAÇÃO */}
        <Section
          id="pontuacao"
          title="Pontuação"
          note="Medidor circular e barras de sustentabilidade do simulador."
        >
          <Card padding="lg" className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
              <ScoreRing value={88} label="Índice S.O.L.O." />
              <ScoreRing value={72} label="Umidade" size={130} />
              <ScoreRing value={34} label="Atenção" size={130} tone="warning" />
            </div>
            <Divider />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ProgressBar label="Economia de Água" value={86} />
              <ProgressBar label="Saúde do Solo" value={92} />
              <ProgressBar label="Resiliência à Seca" value={84} />
            </div>
          </Card>
        </Section>

        {/* ESTRUTURA */}
        <Section
          id="estrutura"
          title="Estrutura"
          note="Barra lateral e cabeçalho — o esqueleto de todos os ecrãs."
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-surface-soft px-5 py-3">
                <span className="text-sm font-bold tracking-wider text-text-muted">
                  BARRA LATERAL (desktop)
                </span>
              </div>
              <div className="flex h-[640px] justify-center bg-bg">
                <Sidebar activeHref="/rotacao" />
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border bg-surface-soft px-5 py-3">
                <span className="text-sm font-bold tracking-wider text-text-muted">
                  CABEÇALHO (desktop)
                </span>
              </div>
              <div className="flex h-[120px] items-stretch bg-bg">
                <TopBar
                  title="Rotação de Culturas"
                  subtitle="Planeie o que plantar em cada etapa da safra"
                  location="Feira de Santana - BA"
                />
              </div>
              <div className="border-b border-border bg-surface-soft px-5 py-3">
                <span className="text-sm font-bold tracking-wider text-text-muted">
                  BARRA LATERAL (drawer do telemóvel)
                </span>
              </div>
              <div className="flex h-[640px] justify-start bg-bg">
                <Sidebar isDrawer activeHref="/clima" />
              </div>
            </Card>
          </div>
        </Section>

        {/* ESTADO VAZIO */}
        <Section id="vazio" title="Estado vazio" note="Quando ainda não há dados.">
          <EmptyState
            icon={Sprout}
            title="Ainda não tem canteiros registados"
            description="Assim que registar a sua horta, mostramos aqui a humidade do solo e o que plantar."
            action={
              <Button icon={Sprout} className="w-full sm:w-auto">
                Registar canteiro
              </Button>
            }
          />
        </Section>
      </div>
    </AppShell>
  );
}
