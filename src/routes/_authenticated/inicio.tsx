import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  CreditCard,
  HandCoins,
  CalendarClock,
  Users,
  Plus,
  Sparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppLayout";
import { StatusParcela } from "@/components/StatusParcela";
import { useAtualizarTudo, useParcelas, usePessoas, mesmoMes } from "@/hooks/useDados";
import { marcarParcela, type ParcelaCompleta } from "@/lib/data";
import { dataBr, hojeIso, mesAnoDe, moeda, statusVencimento } from "@/lib/format";
import { criarDadosDeExemplo } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: Inicio,
});

const CORES = [
  "oklch(0.55 0.115 168)",
  "oklch(0.7 0.14 78)",
  "oklch(0.62 0.15 152)",
  "oklch(0.6 0.12 250)",
  "oklch(0.65 0.16 25)",
  "oklch(0.6 0.13 300)",
  "oklch(0.7 0.1 200)",
  "oklch(0.55 0.09 60)",
  "oklch(0.65 0.05 160)",
];

function Inicio() {
  const { data: parcelas, isLoading } = useParcelas();
  const { data: pessoas = [] } = usePessoas();
  const atualizar = useAtualizarTudo();
  const [semeando, setSemeando] = useState(false);

  const hoje = hojeIso();
  const { ano, mes } = mesAnoDe(hoje);

  useEffect(() => {
    if (isLoading || !parcelas || semeando) return;
    if (parcelas.length === 0 && pessoas.length === 0) {
      setSemeando(true);
      criarDadosDeExemplo()
        .then((criou) => {
          if (criou) {
            atualizar();
            toast.success("Criamos alguns dados de exemplo para você explorar ✨");
          }
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, parcelas, pessoas]);

  const totais = useMemo(() => {
    const lista = parcelas ?? [];
    const faturaAtual = lista
      .filter((p) => mesmoMes(p.data_vencimento, ano, mes))
      .reduce((s, p) => s + p.valor, 0);
    const deOutros = lista.filter((p) => p.compra?.pessoa_id);
    const aReceber = deOutros
      .filter((p) => p.status !== "pago")
      .reduce((s, p) => s + p.valor, 0);
    const aReceberMes = deOutros
      .filter((p) => p.status !== "pago" && mesmoMes(p.data_vencimento, ano, mes))
      .reduce((s, p) => s + p.valor, 0);
    return { faturaAtual, aReceber, aReceberMes };
  }, [parcelas, ano, mes]);

  const proximas = useMemo(
    () =>
      (parcelas ?? [])
        .filter((p) => p.status !== "pago" && p.compra?.pessoa_id)
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
        .slice(0, 6),
    [parcelas],
  );

  const alertas = useMemo(
    () =>
      (parcelas ?? []).filter((p) => {
        const s = statusVencimento(p.status, p.data_vencimento);
        return p.compra?.pessoa_id && (s === "atrasada" || s === "hoje" || s === "amanha");
      }),
    [parcelas],
  );

  const porPessoa = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number }>();
    for (const p of parcelas ?? []) {
      const pessoa = p.compra?.pessoa;
      if (!pessoa || p.status === "pago") continue;
      const atual = mapa.get(pessoa.id) ?? { nome: pessoa.nome, total: 0 };
      atual.total += p.valor;
      mapa.set(pessoa.id, atual);
    }
    return [...mapa.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [parcelas]);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of parcelas ?? []) {
      const cat = p.compra?.categoria ?? "Outros";
      mapa.set(cat, (mapa.get(cat) ?? 0) + p.valor);
    }
    return [...mapa.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [parcelas]);

  const pagar = useMutation({
    mutationFn: (p: ParcelaCompleta) => marcarParcela(p.id, true),
    onSuccess: () => {
      atualizar();
      toast.success("Parcela marcada como paga! ✅");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div>
      <PageTitle titulo="Olá! 👋" sub="Veja como está o seu cartão." />

      {alertas.length > 0 ? (
        <div className="mb-5 space-y-2">
          {alertas.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-2xl bg-alerta/20 px-4 py-3 text-sm text-alerta-foreground"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>{p.compra.pessoa?.nome}</strong> tem uma parcela de{" "}
                <strong>{moeda(p.valor)}</strong>{" "}
                {p.data_vencimento < hoje
                  ? `atrasada desde ${dataBr(p.data_vencimento)}`
                  : p.data_vencimento === hoje
                    ? "vencendo hoje"
                    : "vencendo amanhã"}
                .
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CardResumo
          icone={<CreditCard className="size-5" />}
          titulo="Fatura atual"
          valor={moeda(totais.faturaAtual)}
          destaque
        />
        <CardResumo
          icone={<HandCoins className="size-5" />}
          titulo="Tenho para receber"
          valor={moeda(totais.aReceber)}
        />
        <CardResumo
          icone={<CalendarClock className="size-5" />}
          titulo="A receber este mês"
          valor={moeda(totais.aReceberMes)}
        />
        <CardResumo
          icone={<Users className="size-5" />}
          titulo="Pessoas"
          valor={String(pessoas.length)}
        />
      </div>

      <Button asChild size="lg" className="mt-5 hidden h-13 w-full rounded-2xl text-base md:flex">
        <Link to="/nova-compra">
          <Plus className="size-5" /> Registrar compra
        </Link>
      </Button>

      <h2 className="mt-8 mb-3 font-display text-xl font-bold">Próximos pagamentos</h2>
      {proximas.length === 0 ? (
        <Vazio texto="Nenhuma parcela pendente por aqui. Tudo em dia! 🎉" />
      ) : (
        <div className="space-y-3">
          {proximas.map((p) => (
            <Card key={p.id} className="rounded-3xl">
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold">{p.compra.pessoa?.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.compra.descricao} — {p.numero_parcela}/{p.compra.quantidade_parcelas}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{moeda(p.valor)}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence em {dataBr(p.data_vencimento)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusParcela status={p.status} vencimento={p.data_vencimento} />
                  <Button
                    size="sm"
                    className="h-10 rounded-xl"
                    disabled={pagar.isPending}
                    onClick={() => pagar.mutate(p)}
                  >
                    Marcar como pago
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-xl font-bold">Ainda falta pagar</h2>
          {porPessoa.length === 0 ? (
            <Vazio texto="Ninguém está devendo agora." />
          ) : (
            <Card className="rounded-3xl">
              <CardContent className="divide-y divide-border py-2">
                {porPessoa.map((p) => (
                  <Link
                    key={p.id}
                    to="/pessoas/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="font-medium">{p.nome}</span>
                    <span className="font-semibold text-primary">{moeda(p.total)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-bold">Gastos por categoria</h2>
          {porCategoria.length === 0 ? (
            <Vazio texto="Registre uma compra para ver o gráfico." />
          ) : (
            <Card className="rounded-3xl">
              <CardContent className="pt-6">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porCategoria}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {porCategoria.map((_, i) => (
                          <Cell key={i} fill={CORES[i % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => moeda(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  {porCategoria.map((c, i) => (
                    <span key={c.name} className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: CORES[i % CORES.length] }}
                      />
                      {c.name} — {moeda(c.value)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CardResumo({
  icone,
  titulo,
  valor,
  destaque,
}: {
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <Card className={`rounded-3xl ${destaque ? "bg-primary text-primary-foreground" : ""}`}>
      <CardContent className="py-4">
        <div className={destaque ? "text-primary-foreground/80" : "text-primary"}>{icone}</div>
        <p
          className={`mt-2 text-xs font-medium ${destaque ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {titulo}
        </p>
        <p className="mt-0.5 font-display text-xl leading-tight font-bold break-words">{valor}</p>
      </CardContent>
    </Card>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-5 py-6 text-sm text-muted-foreground">
      <Sparkles className="size-5 shrink-0 text-primary" />
      {texto}
    </div>
  );
}
