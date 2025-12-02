"use client"

import { Table } from "@tanstack/react-table"
import { X, FileDown, PlusCircle, Filter, CheckCircle2, User, Tag, Circle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import type { Transaction, Profile } from "@/lib/types"
import { generateTransactionsPDF } from "@/lib/generate-pdf"
import { useUser, useFirestore } from "@/firebase"
import { saveReportHistory } from "@/firebase/firestore/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { writeBatch, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

// --- COMPONENTE DE FILTRO FACETADO (INLINE) ---
interface FacetedFilterProps<TData, TValue> {
  column?: any
  title: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: FacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                    }}
                  >
                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">{facets.get(option.value)}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// --- MAIN TOOLBAR ---

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onAdd: () => void;
  allTransactions: Transaction[];
  profiles: Profile[]; // [NOVO]
}

export function DataTableToolbar<TData>({
  table,
  onAdd,
  allTransactions,
  profiles,
}: DataTableToolbarProps<TData>) {
  
  const isFiltered = table.getState().columnFilters.length > 0
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isBulking, setIsBulking] = useState(false);

  // Opções para Filtros
  const statusOptions = [
      { label: "Pago", value: "paid", icon: CheckCircle2 },
      { label: "Pendente", value: "pending", icon: Circle },
  ];

  const typeOptions = [
      { label: "Receita", value: "income", icon: CheckCircle2 },
      { label: "Despesa", value: "expense", icon: Circle },
  ];

  const categoryOptions = Array.from(new Set(allTransactions.map(t => t.category))).map(c => ({
      label: c,
      value: c,
      icon: Tag
  }));

  const profileOptions = profiles.map(p => ({
      label: p.name,
      value: p.id,
      icon: User
  }));

  const handleExport = async () => {
    const filteredRows = table.getFilteredRowModel().rows;
    const transactions = filteredRows.map(row => row.original as Transaction);
    generateTransactionsPDF(transactions, "Extrato Filtrado");
    if (user && firestore) await saveReportHistory(firestore, user.uid, 'transacoes', 'Exportação Customizada');
  };

  const handleBulkAction = async (action: 'pay' | 'pending' | 'delete') => {
      if (!user || !firestore) return;
      const selected = table.getSelectedRowModel().rows;
      if (selected.length === 0) return;

      setIsBulking(true);
      const batch = writeBatch(firestore);
      
      selected.forEach(row => {
          const t = row.original as Transaction;
          const ref = doc(firestore, 'users', user.uid, 'transactions', t.id);
          
          if (action === 'delete') {
              batch.delete(ref);
          } else {
              batch.update(ref, { status: action === 'pay' ? 'paid' : 'pending' });
          }
      });

      try {
          await batch.commit();
          toast({ title: "Sucesso", description: `${selected.length} itens atualizados.` });
          table.toggleAllRowsSelected(false);
      } catch (e) {
          toast({ variant: "destructive", title: "Erro", description: "Falha na ação em massa." });
      } finally {
          setIsBulking(false);
      }
  };

  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* SELEÇÃO EM MASSA FLUTUANTE */}
      {selectedCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground/90 backdrop-blur-md text-background px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 border border-white/20">
              <span className="text-sm font-bold pl-2">{selectedCount} selecionados</span>
              <Separator orientation="vertical" className="h-4 bg-background/30" />
              <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 hover:bg-white/20 hover:text-white" onClick={() => handleBulkAction('pay')} disabled={isBulking}>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" /> Pagar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 hover:bg-white/20 hover:text-white" onClick={() => handleBulkAction('pending')} disabled={isBulking}>
                      <Circle className="mr-2 h-4 w-4 text-yellow-400" /> Pendenciar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 hover:bg-red-500/50 hover:text-white text-red-300" onClick={() => handleBulkAction('delete')} disabled={isBulking}>
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
              </div>
          </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder="Filtrar descrições..."
            value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          
          {/* FILTROS FACETADOS - ESTILO WINDOWS / PRO */}
          {table.getColumn("status") && (
            <DataTableFacetedFilter column={table.getColumn("status")} title="Status" options={statusOptions} />
          )}
          {table.getColumn("profileId") && (
            <DataTableFacetedFilter column={table.getColumn("profileId")} title="Perfil" options={profileOptions} />
          )}
          {table.getColumn("category") && (
            <DataTableFacetedFilter column={table.getColumn("category")} title="Categoria" options={categoryOptions} />
          )}
          {table.getColumn("type") && (
            <DataTableFacetedFilter column={table.getColumn("type")} title="Tipo" options={typeOptions} />
          )}

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
            PDF
          </Button>
          <DataTableViewOptions table={table} />
          <Button size="sm" className="h-8 gap-1 shadow-md" onClick={onAdd}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}