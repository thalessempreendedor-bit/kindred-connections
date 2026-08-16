import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageTitle } from "@/components/AppLayout";
import { useAtualizarTudo, useCompras, usePessoas, mesmoMes } from "@/hooks/useDados";
import { atualizarCompra, excluirCompra } from "@/lib/data";
import { CATEGORIAS, MESES, dataBr, mesAnoDe, moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/compras")({
  component: Compras,
});

type Situacao = "todas" | "pendentes" | "pagas";

const schema = z.object({
  descricao: z.string().trim().min(1, "Diga o que foi comprado").max(120),
  observacao: z.string().trim().max(300).optional(),
});

function Compras() {
  const { data: compras = [], isLoading } = useCompras();
  const { data: pessoas = [] } = usePessoas();
  const atualizar = useAtualizarTudo();

  const [situacao, setSituacao] = useState<Situacao>("todas");
  const [pessoaFiltro, setPessoaFiltro] = useState("todas");
  const [mesFiltro, setMesFiltro] = useState("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const [editando, setEditando] = useState<string | null>(null);
  const [fDescricao, setFDescricao] = useState("");
  const [fCategoria, setFCategoria] = useState("Outros");
  const [fPessoa, setFPessoa] = useState("eu");
  const [fObs, setFObs] = useState("");

  const salvar = useMutation({
    mutationFn: (v: { id: string; descricao: string; categoria: string; pessoa_id: string | null; observacao?: string | undefined }) =>
      atualizarCompra(v.id, v),
    onSuccess: () => {
      atualizar();
      setEditando(null);
      toast.success("Compra atualizada ✅");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: excluirCompra,
    onSuccess: () => {
      atualizar();
      toast.success("Compra excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = useMemo(() => {
    return compras.filter((c) => {
      const pagas = c.parcelas.filter((p) => p.status === "pago").length;
      const quitada = c.parcelas.length > 0 && pagas === c.parcelas.length;
      if (situacao === "pagas" && !quitada) return false;
      if (situacao === "pendentes" && quitada) return false;
      if (pessoaFiltro === "eu" && c.pessoa_id) return false;
      if (pessoaFiltro !== "todas" && pessoaFiltro !== "eu" && c.pessoa_id !== pessoaFiltro)
        return false;
      if (categoriaFiltro !== "todas" && c.categoria !== categoriaFiltro) return false;
      if (mesFiltro !== "todos") {
        const [a, m] = mesFiltro.split("-").map(Number);
        const bate =
          mesmoMes(c.data_compra, a!, m!) ||
          c.parcelas.some((p) => mesmoMes(p.data_vencimento, a!, m!));
        if (!bate) return false;
      }
      return true;
    });
  }, [compras, situacao, pessoaFiltro, categoriaFiltro, mesFiltro]);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const c of compras) {
      const d = mesAnoDe(c.data_compra);
      set.add(`${d.ano}-${d.mes}`);
      for (const p of c.parcelas) {
        const v = mesAnoDe(p.data_vencimento);
        set.add(`${v.ano}-${v.mes}`);
      }
    }
    return [...set].sort();
  }, [compras]);

  function abrirEdicao(c: (typeof compras)[number]) {
    setEditando(c.id);
    setFDescricao(c.descricao);
    setFCategoria(c.categoria);
    setFPessoa(c.pessoa_id ?? "eu");
    setFObs(c.observacao ?? "");
  }

  function enviarEdicao(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ descricao: fDescricao, observacao: fObs });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }
    salvar.mutate({
      id: editando!,
      descricao: parsed.data.descricao,
      categoria: fCategoria,
      pessoa_id: !fPessoa || fPessoa === "eu" ? null : fPessoa,
      observacao: parsed.data.observacao,
    });
  }

  return (
    <div>
      <PageTitle titulo="Todas as compras" sub="Filtre e organize do seu jeito." />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {(["todas", "pendentes", "pagas"] as Situacao[]).map((s) => (
          <button
            key={s}
            onClick={() => setSituacao(s)}
            className={cn(
              "rounded-2xl border-2 py-2.5 text-sm font-semibold capitalize transition-colors",
              situacao === s
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <Select value={pessoaFiltro} onValueChange={setPessoaFiltro}>
          <SelectTrigger className="!h-11 rounded-xl">
            <SelectValue placeholder="Pessoa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as pessoas</SelectItem>
            <SelectItem value="eu">Minhas compras</SelectItem>
            {pessoas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mesFiltro} onValueChange={setMesFiltro}>
          <SelectTrigger className="!h-11 rounded-xl">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            {mesesDisponiveis.map((k) => {
              const [a, m] = k.split("-").map(Number);
              return (
                <SelectItem key={k} value={k}>
                  {MESES[(m ?? 1) - 1]} de {a}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="!h-11 rounded-xl">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : lista.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Nenhuma compra encontrada com esses filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((c) => {
            const pagas = c.parcelas.filter((p) => p.status === "pago").length;
            const quitada = c.parcelas.length > 0 && pagas === c.parcelas.length;
            return (
              <Card key={c.id} className="rounded-3xl">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {c.pessoa?.nome ?? "Minhas compras"} · {c.categoria}
                      </p>
                      <p className="font-display text-lg font-bold">{c.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {moeda(c.valor_total)} · {c.quantidade_parcelas}x de{" "}
                        {moeda(c.valor_parcela)} · {dataBr(c.data_compra)}
                      </p>
                      <p className="mt-1 text-sm">
                        {quitada ? (
                          <span className="font-semibold text-sucesso">🟢 Tudo pago</span>
                        ) : (
                          <span className="text-muted-foreground">
                            🟡 {pagas}/{c.parcelas.length} parcelas pagas
                          </span>
                        )}
                      </p>
                      {c.observacao ? (
                        <p className="mt-1 text-xs text-muted-foreground">{c.observacao}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        aria-label="Editar"
                        onClick={() => abrirEdicao(c)}
                      >
                        <Pencil className="size-5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-destructive"
                            aria-label="Excluir"
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir "{c.descricao}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              As parcelas dessa compra também serão apagadas. Não dá para desfazer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => remover.mutate(c.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={enviarEdicao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ed">Descrição</Label>
              <Input
                id="ed"
                value={fDescricao}
                onChange={(e) => setFDescricao(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Pessoa</Label>
              <Select value={fPessoa} onValueChange={(v) => v && setFPessoa(v)}>
                <SelectTrigger className="!h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Minhas compras</SelectItem>
                  {pessoas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={fCategoria} onValueChange={setFCategoria}>
                <SelectTrigger className="!h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edobs">Observação</Label>
              <Textarea
                id="edobs"
                value={fObs}
                onChange={(e) => setFObs(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={salvar.isPending}
              className="h-12 w-full rounded-xl text-base"
            >
              Salvar alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
