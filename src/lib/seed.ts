import { supabase } from "@/integrations/supabase/client";
import { criarPessoa, salvarCompra, marcarParcela } from "./data";
import { addMeses, hojeIso } from "./format";

/** Cria dados de exemplo na primeira vez que a conta é usada. */
export async function criarDadosDeExemplo() {
  const { count } = await supabase.from("pessoas").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return false;

  const hoje = hojeIso();
  const dia10 = `${hoje.slice(0, 8)}10`;
  // se o dia 10 deste mês já passou, a próxima cobrança é no mês seguinte
  const primeiro = hoje > dia10 ? addMeses(dia10, 1) : dia10;

  const joao = await criarPessoa({ nome: "João", telefone: "(11) 98888-1234" });
  const maria = await criarPessoa({ nome: "Maria", telefone: "(11) 97777-4321" });
  const pedro = await criarPessoa({ nome: "Pedro" });

  const c1 = await salvarCompra({
    pessoa_id: joao.id,
    descricao: "Celular",
    valor_total: 1200,
    quantidade_parcelas: 6,
    categoria: "Eletrônicos",
    data_compra: addMeses(hoje, -2),
    primeiro_vencimento: addMeses(primeiro, -2),
  });
  await salvarCompra({
    pessoa_id: maria.id,
    descricao: "Roupas",
    valor_total: 450,
    quantidade_parcelas: 3,
    categoria: "Roupas",
    data_compra: addMeses(hoje, -1),
    primeiro_vencimento: addMeses(primeiro, -1),
  });
  await salvarCompra({
    pessoa_id: pedro.id,
    descricao: "Fone de ouvido",
    valor_total: 500,
    quantidade_parcelas: 1,
    categoria: "Eletrônicos",
    data_compra: hoje,
    primeiro_vencimento: primeiro,
  });
  await salvarCompra({
    pessoa_id: maria.id,
    descricao: "Mercado",
    valor_total: 200,
    quantidade_parcelas: 1,
    categoria: "Mercado",
    data_compra: hoje,
    primeiro_vencimento: primeiro,
  });
  await salvarCompra({
    pessoa_id: null,
    descricao: "Minhas compras do mês",
    valor_total: 1800,
    quantidade_parcelas: 1,
    categoria: "Casa",
    data_compra: hoje,
    primeiro_vencimento: primeiro,
  });

  // marca as duas primeiras parcelas do celular do João como pagas
  const { data: parcelas } = await supabase
    .from("parcelas")
    .select("id, numero_parcela")
    .eq("compra_id", c1.id)
    .order("numero_parcela");
  for (const p of (parcelas ?? []).slice(0, 2)) {
    await marcarParcela(p.id as string, true);
  }
  return true;
}
