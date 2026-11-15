#!/usr/bin/env python3
import shutil
from pathlib import Path

def patch(path, pairs):
    p = Path(path)
    s = p.read_text(encoding="utf-8")
    bak = p.with_name(p.name + ".bak2")
    if not bak.exists():
        shutil.copy(p, bak)
    for old, new, label in pairs:
        if new in s:
            print("SKIP", label); continue
        if old not in s:
            print("FALHOU", label, "- não encontrei o texto; diga-me e ajusto"); continue
        s = s.replace(old, new, 1)
        print("OK  ", label)
    p.write_text(s, encoding="utf-8")

patch("src/types/nasa.ts", [(
    "  /** mm de chuva por mês do ano",
    "  daysSinceRain: number; // dias seguidos sem chuva (>= 1 mm) até hoje\n"
    "  annualRainMm: number; // chuva somada na série (≈ ano se a série tiver 365 dias)\n"
    "  avgTMax: number; // média das temperaturas máximas da série (°C)\n"
    "  /** mm de chuva por mês do ano",
    "types: campos novos")])

patch("src/lib/nasa/client.ts", [
  ("  rainTotalMm: 0, et0TotalMm: 0, rainByMonthOfYear: {},",
   "  rainTotalMm: 0, et0TotalMm: 0, rainByMonthOfYear: {},\n"
   "  daysSinceRain: 0, annualRainMm: 0, avgTMax: 28,",
   "client: emptySummary"),
  ("    const current = series.at(-1) ?? null;",
   "    const current = series.at(-1) ?? null;\n"
   "    let daysSinceRain = 0;\n"
   "    for (let i = series.length - 1; i >= 0 && series[i].rainMm < 1; i--) daysSinceRain++;\n"
   "    const rainTotal = Number(series.reduce((s, x) => s + x.rainMm, 0).toFixed(1));\n"
   "    const avgTMax = series.length\n"
   "      ? Number((series.reduce((s, x) => s + x.tMax, 0) / series.length).toFixed(1))\n"
   "      : 28;",
   "client: cálculos"),
  ("      rainByMonthOfYear,\n    };\n  } catch",
   "      rainByMonthOfYear,\n      daysSinceRain,\n      annualRainMm: rainTotal,\n      avgTMax,\n    };\n  } catch",
   "client: retorno"),
])

patch("src/app/(app)/previsao-do-tempo/page.tsx", [(
    "    defaultFarm.latitude,\n    defaultFarm.longitude,\n  );",
    "    defaultFarm.latitude,\n    defaultFarm.longitude,\n    365,\n  );",
    "previsao: pede 365 dias")])
