import { statusVencimento } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAPA = {
  pago: { texto: "🟢 Pago", classe: "bg-sucesso/15 text-sucesso" },
  atrasada: { texto: "🔴 Atrasada", classe: "bg-destructive/15 text-destructive" },
  hoje: { texto: "⚠️ Vence hoje", classe: "bg-alerta/25 text-alerta-foreground" },
  amanha: { texto: "⚠️ Vence amanhã", classe: "bg-alerta/25 text-alerta-foreground" },
  pendente: { texto: "🟡 Pendente", classe: "bg-muted text-muted-foreground" },
} as const;

export function StatusParcela({
  status,
  vencimento,
  className,
}: {
  status: string;
  vencimento: string;
  className?: string;
}) {
  const info = MAPA[statusVencimento(status, vencimento)];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        info.classe,
        className,
      )}
    >
      {info.texto}
    </span>
  );
}
