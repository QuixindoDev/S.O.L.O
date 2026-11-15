"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["O que queres", "A tua rotação", "Diagnóstico"] as const;

export interface WizardStepperProps {
  /** Passo actual (1, 2 ou 3). */
  current: number;
}

/**
 * O "onde estou" do guia de 3 passos.
 *
 * Passos já feitos ficam com visto verde — assim a pessoa sabe que
 * pode voltar atrás sem perder nada.
 */
export function WizardStepper({ current }: WizardStepperProps) {
  return (
    <nav aria-label="Passos da rotação">
      <ol className="flex flex-wrap items-center gap-3">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;

          return (
            <li key={label} className="flex items-center gap-3">
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 w-11 rounded-full",
                    number <= current ? "bg-primary" : "bg-border",
                  )}
                />
              )}

              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-[30px] w-[30px] items-center justify-center rounded-full text-[15px] font-bold",
                    done || active
                      ? "bg-primary text-surface"
                      : "border border-border bg-surface text-text-muted",
                  )}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : number}
                </span>

                <span
                  className={cn(
                    "text-base",
                    active
                      ? "font-bold text-text-primary"
                      : "text-text-muted",
                  )}
                >
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
