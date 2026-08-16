import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Home, Plus, ShoppingBag, Users, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/pessoas", label: "Pessoas", icon: Users },
  { to: "/fatura", label: "Fatura", icon: CreditCard },
  { to: "/compras", label: "Compras", icon: ShoppingBag },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ativo = (to: string) => pathname === to || pathname.startsWith(to + "/");

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Menu lateral — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg leading-none font-bold">Meu Cartão</p>
            <p className="text-xs text-muted-foreground">Controle simples</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                ativo(item.to)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="lg" className="mt-6 rounded-2xl">
          <Link to="/nova-compra">
            <Plus className="size-5" /> Registrar compra
          </Link>
        </Button>

        <button
          onClick={sair}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <LogOut className="size-5" /> Sair
        </button>
      </aside>

      {/* Topo — mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CreditCard className="size-4" />
          </div>
          <span className="font-display text-base font-bold">Meu Cartão</span>
        </div>
        <button
          onClick={sair}
          aria-label="Sair"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:max-w-4xl md:pt-8 md:pb-12 md:pl-4 lg:max-w-5xl">
        <div className="md:ml-64">{children}</div>
      </main>

      {/* Botão flutuante — mobile */}
      <Link
        to="/nova-compra"
        aria-label="Registrar compra"
        className="fixed right-5 bottom-24 z-30 flex size-15 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-7" />
      </Link>

      {/* Barra inferior — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              ativo(item.to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-bold md:text-3xl">{titulo}</h1>
      {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
