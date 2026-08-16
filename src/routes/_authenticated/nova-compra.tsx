import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageTitle } from "@/components/AppLayout";
import { NovaPessoaDialog } from "@/components/NovaPessoaDialog";
import { usePessoas, useAtualizarTudo } from "@/hooks/useDados";
import { salvarCompra } from "@/lib/data";
import { CATEGORIAS, calcularParcelas, hojeIso, moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/nova-compra")({
  component: NovaCompra,
});

const schema = z.object({
  descricao: z.string().trim().min(1, "Diga o que foi comprado").max(120),
  valor_total: z.number().positive("Informe um valor maior que zero").max(9999999),
  quantidade_parcelas: z.number().int().min(1).max(24),
  observacao: z.string().trim().max(300).optional(),
});

function NovaCompra() {
  const navigate = useNavigate();
  const { data: pessoas = [] } = usePessoas();
  const atualizar = useAtualizarTudo();

  const [pessoaId, setPessoaId] = useState<string>("eu");
  const [descricao, setDescricao] = useState("");
  const [valorTexto, setValorTexto] = useState("");
  const [parcelado, setParcelado] = useState(false);
  const [parcelas, setParcelas] = useState(2);
  const [dataCompra, setDataCompra] = useState(hojeIso());
  const [primeiroVenc, setPrimeiroVenc] = useState(hojeIso());
  const [categoria, setCategoria] = useState<string>("Outros");
  const [observacao, setObservacao] = useState("");
  const [dialogPessoa, setDialogPessoa] = useState(false);
  const [resumo, setResumo] = useState<null | {
    pessoa: string;
    descricao: string;
    parcelas: number;
    valorParcela: number;
    total: number;
  }>(null);

  const valor = useMemo(() => {
    const limpo = valorTexto.replace(/\./g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : 0;
  }, [valorTexto]);

  const qtd = parcelado ? parcelas : 1;
  const valorParcela = valor > 0 ? (calcularParcelas(valor, qtd)[qtd - 1] ?? 0) : 0;

  const mutation = useMutation({
    mutationFn: salvarCompra,
    onSuccess: (compra) => {
      atualizar();
      const nome = pessoaId === "eu" ? "Minhas compras" : (pessoas.find((p) => p.id === pessoaId)?.nome ?? "");
      setResumo({
        pessoa: nome,
        descricao: compra.descricao,
        parcelas: qtd,
        valorParcela,
        total: valor,
      });
      toast.success("Compra registrada com sucesso! ✅");
      setDescricao("");
      setValorTexto("");
      setObservacao("");
      setParcelado(false);
      setParcelas(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      descricao,
      valor_total: valor,
      quantidade_parcelas: qtd,
      observacao,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }
    mutation.mutate({
      pessoa_id: !pessoaId || pessoaId === "eu" ? null : pessoaId,
      descricao: parsed.data.descricao,
      valor_total: parsed.data.valor_total,
      quantidade_parcelas: qtd,
      categoria,
      data_compra: dataCompra,
      primeiro_vencimento: primeiroVenc,
      observacao: parsed.data.observacao,
    });
  }

  if (resumo) {
    return (
      <div>
        <PageTitle titulo="Compra registrada! ✅" sub="Tudo certo, já está no controle." />
        <Card className="rounded-3xl">
          <CardContent className="space-y-1 pt-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-sucesso" />
            <p className="mt-3 font-display text-xl font-bold">{resumo.pessoa}</p>
            <p className="text-muted-foreground">{resumo.descricao}</p>
            <p className="mt-2 text-lg font-semibold">
              {resumo.parcelas}x de {moeda(resumo.valorParcela)}
            </p>
            <p className="text-sm text-muted-foreground">Total: {moeda(resumo.total)}</p>
          </CardContent>
        </Card>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-12 flex-1 rounded-2xl"
            onClick={() => setResumo(null)}
          >
            Registrar outra compra
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 flex-1 rounded-2xl">
            <Link to="/inicio">Ir para o Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle titulo="Nova compra" sub="Preencha e o resto o sistema calcula." />

      <form onSubmit={enviar} className="space-y-5">
        <Card className="rounded-3xl">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Pessoa</Label>
              <Select value={pessoaId} onValueChange={(v) => v && setPessoaId(v)}>
                <SelectTrigger className="!h-12 w-full rounded-xl">
                  <SelectValue placeholder="Escolha a pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">Minhas compras (foi para mim)</SelectItem>
                  {pessoas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-2 text-primary"
                onClick={() => setDialogPessoa(true)}
              >
                <Plus className="size-4" /> Cadastrar nova pessoa
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da compra</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Celular"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor total</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor"
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="1.200,00"
                  inputMode="decimal"
                  className="h-12 rounded-xl pl-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 pt-6">
            <Label>Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: false, label: "À vista" },
                { v: true, label: "Parcelado" },
              ].map((op) => (
                <button
                  key={String(op.v)}
                  type="button"
                  onClick={() => setParcelado(op.v)}
                  className={cn(
                    "rounded-2xl border-2 px-4 py-4 text-base font-semibold transition-colors",
                    parcelado === op.v
                      ? "border-primary bg-secondary text-secondary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {parcelado ? (
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Select value={String(parcelas)} onValueChange={(v) => setParcelas(Number(v))}>
                  <SelectTrigger className="!h-12 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {valor > 0 ? (
              <div className="rounded-2xl bg-secondary px-4 py-3 text-center">
                <p className="font-display text-xl font-bold text-secondary-foreground">
                  {qtd}x de {moeda(valorParcela)}
                </p>
                <p className="text-xs text-secondary-foreground/70">Total: {moeda(valor)}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data">Data da compra</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venc">Primeiro vencimento</Label>
                <Input
                  id="venc"
                  type="date"
                  value={primeiroVenc}
                  onChange={(e) => setPrimeiroVenc(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
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
              <Label htmlFor="obs">Observação (opcional)</Label>
              <Textarea
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Combinado de pagar todo dia 10"
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="h-14 w-full rounded-2xl text-base"
        >
          {mutation.isPending ? "Salvando..." : "Salvar compra"}
        </Button>
      </form>

      <NovaPessoaDialog
        aberto={dialogPessoa}
        onOpenChange={setDialogPessoa}
        onCriada={(p) => setPessoaId(p.id)}
      />
    </div>
  );
}
