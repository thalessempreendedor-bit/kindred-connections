import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CreditCard, PiggyBank, Users, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Cartão — controle quem usou seu cartão de crédito" },
      {
        name: "description",
        content:
          "Emprestou o cartão? Registre cada compra, acompanhe as parcelas e saiba exatamente quanto cada pessoa ainda deve.",
      },
      { property: "og:title", content: "Meu Cartão — controle quem usou seu cartão" },
      {
        property: "og:description",
        content:
          "Registre compras à vista ou parceladas, marque parcelas como pagas e confira sua fatura pessoa por pessoa.",
      },
    ],
  }),
  component: Landing,
});

const BENEFICIOS = [
  { icon: Users, titulo: "Quem comprou", texto: "Cada compra fica ligada a uma pessoa." },
  { icon: CalendarCheck, titulo: "Quantas parcelas faltam", texto: "As parcelas são criadas sozinhas." },
  { icon: PiggyBank, titulo: "Quanto falta pagar", texto: "Veja quanto você tem para receber." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/inicio", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-14 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <CreditCard className="size-8" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">Meu Cartão</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Emprestou o cartão para família e amigos? Aqui você registra cada compra e o sistema faz
          todas as contas para você.
        </p>

        <Button asChild size="lg" className="mt-7 h-13 rounded-2xl px-8 text-base">
          <Link to="/auth">Começar agora</Link>
        </Button>

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="rounded-3xl border border-border bg-card p-5">
              <b.icon className="size-6 text-primary" />
              <p className="mt-3 font-semibold">{b.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
