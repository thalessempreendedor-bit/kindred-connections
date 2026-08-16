CREATE TABLE public.pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  telefone text,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pessoas TO authenticated;
GRANT ALL ON public.pessoas TO service_role;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pessoas_own" ON public.pessoas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pessoa_id uuid REFERENCES public.pessoas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor_total numeric(12,2) NOT NULL,
  quantidade_parcelas integer NOT NULL DEFAULT 1,
  valor_parcela numeric(12,2) NOT NULL,
  categoria text NOT NULL DEFAULT 'Outros',
  data_compra date NOT NULL DEFAULT current_date,
  primeiro_vencimento date NOT NULL DEFAULT current_date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras TO authenticated;
GRANT ALL ON public.compras TO service_role;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compras_own" ON public.compras FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  compra_id uuid NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  numero_parcela integer NOT NULL,
  valor numeric(12,2) NOT NULL,
  data_vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  data_pagamento date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcelas TO authenticated;
GRANT ALL ON public.parcelas TO service_role;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parcelas_own" ON public.parcelas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_compras_user ON public.compras(user_id);
CREATE INDEX idx_compras_pessoa ON public.compras(pessoa_id);
CREATE INDEX idx_parcelas_compra ON public.parcelas(compra_id);
CREATE INDEX idx_parcelas_venc ON public.parcelas(user_id, data_vencimento);