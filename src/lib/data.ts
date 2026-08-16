import { supabase } from "@/integrations/supabase/client";
import { addMeses, calcularParcelas, hojeIso } from "./format";

export type Pessoa = {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  observacao: string | null;
  created_at: string;
};

export type Compra = {
  id: string;
  user_id: string;
  pessoa_id: string | null;
  descricao: string;
  valor_total: number;
  quantidade_parcelas: number;
  valor_parcela: number;
  categoria: string;
  data_compra: string;
  primeiro_vencimento: string;
  observacao: string | null;
  created_at: string;
};

export type Parcela = {
  id: string;
  user_id: string;
  compra_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: string;
  data_pagamento: string | null;
  created_at: string;
};

export type ParcelaCompleta = Parcela & {
  compra: Compra & { pessoa: { id: string; nome: string } | null };
};

const num = (v: unknown) => Number(v ?? 0);

export async function listarPessoas(): Promise<Pessoa[]> {
  const { data, error } = await supabase.from("pessoas").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Pessoa[];
}

export async function listarParcelas(): Promise<ParcelaCompleta[]> {
  const { data, error } = await supabase
    .from("parcelas")
    .select("*, compra:compras(*, pessoa:pessoas(id, nome))")
    .order("data_vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    valor: num(p.valor),
    compra: {
      ...p.compra,
      valor_total: num(p.compra?.valor_total),
      valor_parcela: num(p.compra?.valor_parcela),
    },
  })) as ParcelaCompleta[];
}

export async function listarCompras(): Promise<
  (Compra & { pessoa: { id: string; nome: string } | null; parcelas: Parcela[] })[]
> {
  const { data, error } = await supabase
    .from("compras")
    .select("*, pessoa:pessoas(id, nome), parcelas(*)")
    .order("data_compra", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...c,
    valor_total: num(c.valor_total),
    valor_parcela: num(c.valor_parcela),
    parcelas: (c.parcelas ?? [])
      .map((p: any) => ({ ...p, valor: num(p.valor) }))
      .sort((a: Parcela, b: Parcela) => a.numero_parcela - b.numero_parcela),
  }));
}

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Você precisa entrar na sua conta.");
  return data.user.id;
}

export async function criarPessoa(input: {
  nome: string;
  telefone?: string | undefined;
  observacao?: string | undefined;
}): Promise<Pessoa> {
  const uid = await userId();
  const { data, error } = await supabase
    .from("pessoas")
    .insert({
      user_id: uid,
      nome: input.nome.trim(),
      telefone: input.telefone?.trim() || null,
      observacao: input.observacao?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Pessoa;
}

export async function excluirPessoa(id: string) {
  const { error } = await supabase.from("pessoas").delete().eq("id", id);
  if (error) throw error;
}

export type NovaCompraInput = {
  pessoa_id: string | null;
  descricao: string;
  valor_total: number;
  quantidade_parcelas: number;
  categoria: string;
  data_compra: string;
  primeiro_vencimento: string;
  observacao?: string | undefined;
};

export async function salvarCompra(input: NovaCompraInput) {
  const uid = await userId();
  const valores = calcularParcelas(input.valor_total, input.quantidade_parcelas);
  const { data: compra, error } = await supabase
    .from("compras")
    .insert({
      user_id: uid,
      pessoa_id: input.pessoa_id,
      descricao: input.descricao.trim(),
      valor_total: input.valor_total,
      quantidade_parcelas: input.quantidade_parcelas,
      valor_parcela: valores[valores.length - 1] ?? input.valor_total,
      categoria: input.categoria,
      data_compra: input.data_compra,
      primeiro_vencimento: input.primeiro_vencimento,
      observacao: input.observacao?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;

  const parcelas = valores.map((valor, i) => ({
    user_id: uid,
    compra_id: (compra as Compra).id,
    numero_parcela: i + 1,
    valor,
    data_vencimento: addMeses(input.primeiro_vencimento, i),
    status: "pendente",
  }));
  const { error: e2 } = await supabase.from("parcelas").insert(parcelas);
  if (e2) throw e2;
  return compra as Compra;
}

export async function atualizarCompra(
  id: string,
  input: {
    descricao: string;
    categoria: string;
    pessoa_id: string | null;
    observacao?: string | undefined;
  },
) {
  const { error } = await supabase
    .from("compras")
    .update({
      descricao: input.descricao.trim(),
      categoria: input.categoria,
      pessoa_id: input.pessoa_id,
      observacao: input.observacao?.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function excluirCompra(id: string) {
  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) throw error;
}

export async function marcarParcela(id: string, pago: boolean) {
  const { error } = await supabase
    .from("parcelas")
    .update({
      status: pago ? "pago" : "pendente",
      data_pagamento: pago ? hojeIso() : null,
    })
    .eq("id", id);
  if (error) throw error;
}
