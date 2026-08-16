import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Meu Cartão" },
      {
        name: "description",
        content: "Entre ou crie sua conta para controlar as compras feitas no seu cartão.",
      },
      { property: "og:title", content: "Entrar — Meu Cartão" },
      {
        property: "og:description",
        content: "Entre ou crie sua conta para controlar as compras feitas no seu cartão.",
      },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Digite um e-mail válido").max(255),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, senha });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados");
      return;
    }
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.senha,
        });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/inicio", replace: true });
      else toast.info("Confirme seu e-mail para entrar.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível continuar";
      toast.error(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos"
          : msg.includes("already registered")
            ? "Este e-mail já tem conta. Faça login."
            : msg,
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <CreditCard className="size-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Meu Cartão</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saiba quem comprou, quanto falta e quanto você tem para receber.
          </p>
        </div>

        <Card className="rounded-3xl">
          <CardContent className="pt-6">
            <form onSubmit={enviar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete={modo === "criar" ? "new-password" : "current-password"}
                  placeholder="••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={carregando}
                className="h-12 w-full rounded-xl text-base"
              >
                {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
              className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {modo === "entrar" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
