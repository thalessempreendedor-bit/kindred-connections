import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ChevronRight, UserRound } from "lucide-react";
import { PageTitle } from "@/components/AppLayout";
import { NovaPessoaDialog } from "@/components/NovaPessoaDialog";
import { useParcelas, usePessoas } from "@/hooks/useDados";
import { moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/pessoas/")({
  component: Pessoas,
});

function Pessoas() {
  const { data: pessoas = [], isLoading } = usePessoas();
  const { data: parcelas = [] } = useParcelas();
  const [dialog, setDialog] = useState(false);

  const resumo = useMemo(() => {
    const mapa = new Map<string, { aberto: number; pendentes: number }>();
    for (const p of parcelas) {
      const id = p.compra?.pessoa_id;
      if (!id || p.status === "pago") continue;
      const atual = mapa.get(id) ?? { aberto: 0, pendentes: 0 };
      atual.aberto += p.valor;
      atual.pendentes += 1;
      mapa.set(id, atual);
    }
    return mapa;
  }, [parcelas]);

  return (
    <div>
      <PageTitle titulo="Pessoas" sub="Quem usa o seu cartão." />

      <Button
        size="lg"
        className="mb-5 h-13 w-full rounded-2xl text-base"
        onClick={() => setDialog(true)}
      >
        <Plus className="size-5" /> Nova pessoa
      </Button>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : pessoas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Você ainda não cadastrou ninguém.
        </div>
      ) : (
        <div className="space-y-3">
          {pessoas.map((p) => {
            const r = resumo.get(p.id) ?? { aberto: 0, pendentes: 0 };
            return (
              <Card key={p.id} className="rounded-3xl">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <UserRound className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold">{p.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Total em aberto:{" "}
                      <span className="font-semibold text-foreground">{moeda(r.aberto)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Parcelas pendentes: {r.pendentes}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="h-10 rounded-xl">
                    <Link to="/pessoas/$id" params={{ id: p.id }}>
                      Ver detalhes <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovaPessoaDialog aberto={dialog} onOpenChange={setDialog} />
    </div>
  );
}
