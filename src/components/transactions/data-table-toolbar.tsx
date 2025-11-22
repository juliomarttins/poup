"use client"

import { Table } from "@tanstack/react-table"
import { PlusCircle, X, FileDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { Transaction } from "@/lib/types"
import { generateTransactionsPDF } from "@/lib/generate-pdf"
import { useUser, useFirestore } from "@/firebase" // [NOVO]
import { saveReportHistory } from "@/firebase/firestore/actions" // [NOVO]

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onAdd: () => void;
  allTransactions: Transaction[];
}

export function DataTableToolbar<TData>({
  table,
  onAdd,
  allTransactions,
}: DataTableToolbarProps<TData>) {
  
  const isFiltered = table.getState().columnFilters.length > 0
  const categories = Array.from(new Set(allTransactions.map(t => t.category)));
  
  const { user } = useUser();
  const firestore = useFirestore();

  // [EDIT] Função para exportar com Histórico
  const handleExport = async () => {
    const filteredRows = table.getFilteredRowModel().rows;
    const transactions = filteredRows.map(row => row.original as Transaction);
    generateTransactionsPDF(transactions, "Relatório de Transações (Filtro Desktop)");
    
    if (user && firestore) {
        await saveReportHistory(firestore, user.uid, 'transacoes', 'Exportação de Transações (Desktop)');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filtrar por descrição..."
            value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
           <Select
            value={(table.getColumn("type")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("type")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-8 w-[120px] lg:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="income">Renda</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
           <Select
            value={(table.getColumn("category")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("category")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-8 w-[120px] lg:w-[180px] hidden md:flex">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Limpar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 hidden sm:flex" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />
            Exportar PDF
          </Button>

          <DataTableViewOptions table={table} />
          <Button size="sm" className="h-8 gap-1" onClick={onAdd}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Adicionar
              </span>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <DateRangePicker
            onUpdate={({ range }) => {
              table.getColumn("date")?.setFilterValue(range);
            }}
            initialDateFrom={undefined}
            initialDateTo={undefined}
            align="start"
            locale="pt-BR"
            showCompare={false}
          />
      </div>
    </div>
  )
}