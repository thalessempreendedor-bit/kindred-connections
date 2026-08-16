import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listarCompras, listarParcelas, listarPessoas } from "@/lib/data";
import { mesAnoDe } from "@/lib/format";

export const chaves = {
  pessoas: ["pessoas"] as const,
  parcelas: ["parcelas"] as const,
  compras: ["compras"] as const,
};

export function usePessoas() {
  return useQuery({ queryKey: chaves.pessoas, queryFn: listarPessoas });
}

export function useParcelas() {
  return useQuery({ queryKey: chaves.parcelas, queryFn: listarParcelas });
}

export function useCompras() {
  return useQuery({ queryKey: chaves.compras, queryFn: listarCompras });
}

export function useAtualizarTudo() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: chaves.pessoas });
    qc.invalidateQueries({ queryKey: chaves.parcelas });
    qc.invalidateQueries({ queryKey: chaves.compras });
  };
}

export function mesmoMes(iso: string, ano: number, mes: number) {
  const d = mesAnoDe(iso);
  return d.ano === ano && d.mes === mes;
}
