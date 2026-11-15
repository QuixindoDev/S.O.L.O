#!/usr/bin/env python3
import shutil
from pathlib import Path

p = Path("src/hooks/useSimulator.ts")
s = p.read_text(encoding="utf-8")
bak = p.with_name(p.name + ".bak3")
if not bak.exists():
    shutil.copy(p, bak)

if "rotationWaterBalance" in s:
    print("SKIP (já alterado)")
else:
    pairs = [
        (
            "export type RotationSimulation = SimulationResult;",
            'import { rotationWaterBalance } from "@/lib/rotacao";\n'
            'import type { RotationBalance } from "@/lib/rotacao";\n\n'
            "export type RotationSimulation = SimulationResult & {\n"
            "  balance: RotationBalance;\n"
            "  cycleNames: string[];\n"
            "};\n\n"
            "// Sem dados da NASA, o balanço sai a zeros em vez de rebentar.\n"
            "const EMPTY_SUMMARY = {\n"
            "  series: [],\n"
            "  rainByMonthOfYear: {},\n"
            "} as unknown as AgroSummary;",
            "tipo + resumo vazio",
        ),
        (
            "    return {\n      overallScore: overall,",
            "    const balance = rotationWaterBalance(\n"
            "      [c1, c2, c3],\n"
            "      summary ?? EMPTY_SUMMARY,\n"
            "      soil,\n"
            "      (point) => point.et0Mm,\n"
            "    );\n\n"
            "    return {\n"
            "      balance,\n"
            "      cycleNames: [c1.name, c2.name, c3.name],\n"
            "      overallScore: overall,",
            "balance + cycleNames",
        ),
    ]
    for old, new, label in pairs:
        if old not in s:
            print("FALHOU", label, "- diga-me e ajusto")
            continue
        s = s.replace(old, new, 1)
        print("OK  ", label)
    p.write_text(s, encoding="utf-8")
