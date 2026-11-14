"use client";

import React, { useId, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Selector em cartões — **substitui o `<select>` nativo**.
 * Native selects são pequenos e difíceis de tocar/readir em ecrãs
 * pequenos; aqui a pessoa vê sempre o valor actual em texto grande.
 */
export function Select({
  label,
  value,
  options,
  onChange,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  function move(delta: number) {
    setFocusIndex((i) => (i + delta + options.length) % options.length);
  }

  return (
    <div className={cn("relative flex w-full min-w-0 flex-col gap-2", className)}>
      {label && (
        <label className="text-lg font-bold text-text-primary sm:text-xl">
          {label}
        </label>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
            if (!open) setOpen(true);
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open) {
              onChange(options[focusIndex].value);
              setOpen(false);
            } else {
              setOpen(true);
            }
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn(
          "flex h-14 w-full items-center justify-between gap-3 rounded-input border bg-surface px-4 text-left sm:px-[18px]",
          "transition-colors hover:bg-surface-soft",
          open ? "border-primary" : "border-border",
        )}
      >
        <span className="truncate text-lg font-bold text-text-primary">
          {selected?.label ?? "Escolher"}
        </span>
        <ChevronDown
          size={22}
          aria-hidden
          className={cn(
            "shrink-0 text-text-secondary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-30 mt-2 w-full overflow-hidden rounded-input border border-border bg-surface shadow-lg"
        >
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onMouseEnter={() => setFocusIndex(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-[18px] py-3.5 text-left transition-colors",
                  i === focusIndex ? "bg-primary-soft" : "bg-surface",
                )}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-lg font-bold text-text-primary">
                    {o.label}
                  </span>
                  {o.description && (
                    <span className="text-base text-text-muted">
                      {o.description}
                    </span>
                  )}
                </span>
                {o.value === value && (
                  <Check size={20} className="shrink-0 text-primary" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
