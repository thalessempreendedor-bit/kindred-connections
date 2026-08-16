import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageTitle } from "@/components/AppLayout";
import { useParcelas, mesmoMes } from "@/hooks/useDados";
import { MESES, dataBr, hojeIso, mesAnoDe, moeda } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/fatura")({
  component: Fatura,
});

function Fatura() {
  const { data: parcelas = [], isLoading } = useParcelas();
  const atual = mesAnoDe(hojeIso());
  const [mes, setMes] = useState(atual.mes);
  const [ano, setAno] = useState(atual.ano);

  const anos = useMemo(() => {
    const set = new Set<number>([atual.ano]);
    for (const p of parcelas) set.add(mesAnoDe(p.data_vencimento).ano);
    return [...set].sort();
  }, [parcelas, atual.ano]);

  const doMes = useMemo(
    () => parcelas.filter((p) => mesmoMes(p.data_vencimento, ano, mes)),
    [parcelas, ano, mes],
  );

  const total = doMes.reduce((s, p) => s + p.valor, 0);

  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; total: number; itens: { texto: string; valor: number; venc: string }[] }
    >();
    for (const p of doMes) {
      const chave = p.compra?.pessoa_id ?? "eu";
      const nome = p.compra?.pessoa?.nome ?? "Minhas compras";
      const g = mapa.get(chave) ?? { nome, total: 0, itens: [] };
      g.total += p.valor;
      g.itens.push({
        texto:
          p.compra.quantidade_parcelas > 1
            ? `${p.compra.descricao} — parcela ${p.numero_parcela}/${p.compra.quantidade_parcelas}`
            : p.compra.descricao,
        valor: p.valor,
        venc: p.data_vencimento,
      });
      mapa.set(chave, g);
    }
    const lista = [...mapa.entries()].map(([id, g]) => ({ id, ...g }));
    lista.sort((a, b) => (a.id === "eu" ? 1 : b.id === "eu" ? -1 : b.total - a.total));
    return lista;
  }, [doMes]);

  return (
    <div>
      <PageTitle titulo="Fatura" sub="Confira a fatura do cartão pessoa por pessoa." />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
          <SelectTrigger className="!h-12 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
          <SelectTrigger className="!h-12 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-3xl bg-primary text-primary-foreground">
        <CardContent className="py-5 text-center">
          <p className="text-sm text-primary-foreground/80">
            Fatura de {MESES[mes - 1]} de {ano}
          </p>
          <p className="mt-1 font-display text-3xl font-bold">{moeda(total)}</p>
        </CardContent>
      </Card>

      {isLoading ? null : grupos.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Nenhuma cobrança neste mês.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {grupos.map((g) => (
            <Card key={g.id} className="rounded-3xl">
              <CardContent className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{g.nome}</h2>
                  <span className="font-display text-lg font-bold text-primary">
                    {moeda(g.total)}
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-border">
                  {g.itens.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{item.texto}</span>
                        <span className="text-xs text-muted-foreground">
                          Vence em {dataBr(item.venc)}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium">{moeda(item.valor)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between rounded-3xl bg-secondary px-5 py-4 text-secondary-foreground">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-lg font-bold">{moeda(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
