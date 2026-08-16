import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppLayout";
import { StatusParcela } from "@/components/StatusParcela";
import { useAtualizarTudo, useCompras, usePessoas } from "@/hooks/useDados";
import { excluirPessoa, marcarParcela } from "@/lib/data";
import { dataBr, moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/pessoas/$id")({
  component: DetalhePessoa,
});

function DetalhePessoa() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: pessoas = [] } = usePessoas();
  const { data: compras = [], isLoading } = useCompras();
  const atualizar = useAtualizarTudo();

  const pessoa = pessoas.find((p) => p.id === id);
  const minhas = useMemo(() => compras.filter((c) => c.pessoa_id === id), [compras, id]);

  const totais = useMemo(() => {
    let pago = 0;
    let aberto = 0;
    let total = 0;
    for (const c of minhas) {
      total += c.valor_total;
      for (const p of c.parcelas) {
        if (p.status === "pago") pago += p.valor;
        else aberto += p.valor;
      }
    }
    return { pago, aberto, total };
  }, [minhas]);

  const alternar = useMutation({
    mutationFn: ({ id: pid, pago }: { id: string; pago: boolean }) => marcarParcela(pid, pago),
    onSuccess: () => {
      atualizar();
      toast.success("Pronto! Valores atualizados ✅");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: () => excluirPessoa(id),
    onSuccess: () => {
      atualizar();
      toast.success("Pessoa excluída");
      navigate({ to: "/pessoas" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!pessoa) {
    return (
      <div>
        <PageTitle titulo="Pessoa não encontrada" />
        <Button asChild variant="secondary" className="rounded-xl">
          <Link to="/pessoas">Voltar para Pessoas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/pessoas"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Pessoas
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{pessoa.nome}</h1>
          {pessoa.telefone ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-4" /> {pessoa.telefone}
            </p>
          ) : null}
          {pessoa.observacao ? (
            <p className="mt-1 text-sm text-muted-foreground">{pessoa.observacao}</p>
          ) : null}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive">
              <Trash2 className="size-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {pessoa.nome}?</AlertDialogTitle>
              <AlertDialogDescription>
                Todas as compras e parcelas dessa pessoa também serão apagadas. Não dá para
                desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => remover.mutate()}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Bloco titulo="Ainda falta pagar" valor={moeda(totais.aberto)} destaque />
        <Bloco titulo="Total já pago" valor={moeda(totais.pago)} />
        <Bloco titulo="Total de compras" valor={moeda(totais.total)} />
      </div>

      <h2 className="mt-8 mb-3 font-display text-xl font-bold">Compras</h2>
      {minhas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Nenhuma compra registrada para {pessoa.nome}.
        </div>
      ) : (
        <div className="space-y-4">
          {minhas.map((c) => {
            const pagas = c.parcelas.filter((p) => p.status === "pago").length;
            const pendentes = c.parcelas.length - pagas;
            return (
              <Card key={c.id} className="rounded-3xl">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{c.descricao}</h3>
                    <span className="text-xs text-muted-foreground">{c.categoria}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compra: {moeda(c.valor_total)} — {c.quantidade_parcelas}{" "}
                    {c.quantidade_parcelas > 1 ? "parcelas" : "parcela"} de{" "}
                    {moeda(c.valor_parcela)}
                  </p>
                  <p className="mt-2 text-sm">
                    ✅ {pagas} {pagas === 1 ? "parcela paga" : "parcelas pagas"} · 🟡 {pendentes}{" "}
                    {pendentes === 1 ? "pendente" : "pendentes"}
                  </p>

                  <div className="mt-3 divide-y divide-border">
                    {c.parcelas.map((p) => (
                      <div key={p.id} className="flex flex-wrap items-center gap-2 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            Parcela {p.numero_parcela} — {moeda(p.valor)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.status === "pago"
                              ? `Pago em ${dataBr(p.data_pagamento)}`
                              : `Vence em ${dataBr(p.data_vencimento)}`}
                          </p>
                        </div>
                        <StatusParcela status={p.status} vencimento={p.data_vencimento} />
                        <Button
                          size="sm"
                          variant={p.status === "pago" ? "ghost" : "default"}
                          className="h-9 rounded-xl"
                          disabled={alternar.isPending}
                          onClick={() =>
                            alternar.mutate({ id: p.id, pago: p.status !== "pago" })
                          }
                        >
                          {p.status === "pago" ? "Desfazer" : "Marcar como paga"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Bloco({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <Card className={`rounded-3xl ${destaque ? "bg-primary text-primary-foreground" : ""}`}>
      <CardContent className="py-4">
        <p
          className={`text-xs font-medium ${destaque ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {titulo}
        </p>
        <p className="mt-1 font-display text-lg leading-tight font-bold break-words">{valor}</p>
      </CardContent>
    </Card>
  );
}
