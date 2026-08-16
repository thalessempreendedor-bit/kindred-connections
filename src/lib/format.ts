export const CATEGORIAS = [
  "Alimentação",
  "Mercado",
  "Roupas",
  "Eletrônicos",
  "Transporte",
  "Saúde",
  "Lazer",
  "Casa",
  "Outros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export function moeda(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : (valor ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Recebe "2026-08-15" (date do banco) e devolve "15/08/2026" */
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function hojeIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function addMeses(iso: string, meses: number): string {
  const [a = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number);
  const base = new Date(Date.UTC(a, m - 1, 1));
  base.setUTCMonth(base.getUTCMonth() + meses);
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, ultimoDia));
  return base.toISOString().slice(0, 10);
}

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function mesAnoDe(iso: string) {
  const [a = 0, m = 1] = iso.slice(0, 10).split("-").map(Number);
  return { ano: a, mes: m };
}

/** Divide o total em N parcelas, ajustando os centavos na primeira parcela. */
export function calcularParcelas(total: number, n: number): number[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / n);
  const resto = centavos - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === 0 ? resto : 0)) / 100);
}

export type StatusVenc = "pago" | "atrasada" | "hoje" | "amanha" | "pendente";

export function statusVencimento(status: string, vencimento: string): StatusVenc {
  if (status === "pago") return "pago";
  const hoje = hojeIso();
  if (vencimento < hoje) return "atrasada";
  if (vencimento === hoje) return "hoje";
  if (vencimento === addDias(hoje, 1)) return "amanha";
  return "pendente";
}

export function addDias(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
