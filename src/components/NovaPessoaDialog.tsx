import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { criarPessoa, type Pessoa } from "@/lib/data";
import { useAtualizarTudo } from "@/hooks/useDados";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nome: z.string().trim().min(1, "Diga o nome da pessoa").max(80),
  telefone: z.string().trim().max(30).optional(),
  observacao: z.string().trim().max(300).optional(),
});

export function NovaPessoaDialog({
  aberto,
  onOpenChange,
  onCriada,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  onCriada?: (p: Pessoa) => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const atualizar = useAtualizarTudo();

  const mutation = useMutation({
    mutationFn: criarPessoa,
    onSuccess: (p) => {
      toast.success(`${p.nome} foi cadastrado! ✅`);
      atualizar();
      setNome("");
      setTelefone("");
      setObservacao("");
      onOpenChange(false);
      onCriada?.(p);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ nome, telefone, observacao });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nova pessoa</DialogTitle>
          <DialogDescription>Só o nome já é suficiente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="João"
              className="h-12 rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 90000-0000"
              inputMode="tel"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs">Observação (opcional)</Label>
            <Textarea
              id="obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Primo, paga sempre no dia 10"
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="h-12 w-full rounded-xl text-base"
          >
            {mutation.isPending ? "Salvando..." : "Salvar pessoa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
