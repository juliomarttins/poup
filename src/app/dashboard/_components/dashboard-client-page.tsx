'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { X, FileDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { Transaction, ManagedDebt } from '@/lib/types';
import { useDashboardSettings } from '@/contexts/dashboard-settings-context';
import { generateGeneralReportPDF } from '@/lib/generate-pdf';
import { saveReportHistory } from '@/firebase/firestore/actions'; // [NOVO]
import { useFirestore, useUser } from '@/firebase'; // [NOVO]

interface DashboardClientPageProps {
  initialData: {
    transactions: Transaction[];
    debts: ManagedDebt[];
  };
  children: (filteredData: { transactions: Transaction[], debts: ManagedDebt[] }, descriptionText: string) => ReactNode;
}

export function DashboardClientPage({ initialData, children }: DashboardClientPageProps) {
  const { settings } = useDashboardSettings();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Hooks para salvar histórico
  const { user } = useUser();
  const firestore = useFirestore();

  const filteredTransactions = useMemo(() => {
    if (!initialData.transactions) return [];
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return initialData.transactions;
    }
    return initialData.transactions.filter(t => {
      const date = new Date(t.date);
      const { from, to } = dateRange;
      const toEndOfDay = to ? new Date(to) : null;
      if (toEndOfDay) toEndOfDay.setHours(23, 59, 59, 999);

      if (from && !toEndOfDay) return date >= from;
      if (!from && toEndOfDay) return date <= toEndOfDay;
      if (from && toEndOfDay) return date >= from && date <= toEndOfDay;
      return true;
    });
  }, [initialData.transactions, dateRange]);

  const filteredDebts = useMemo(() => {
      return initialData.debts; 
  }, [initialData.debts]);

  const descriptionText = dateRange ? "Período selecionado" : "Geral";

  const handleExport = async () => {
      generateGeneralReportPDF(filteredTransactions, filteredDebts, descriptionText);
      if (user && firestore) {
          await saveReportHistory(firestore, user.uid, 'painel', 'Exportação do Painel', descriptionText);
      }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle>Visão Geral</CardTitle>
                <CardDescription>
                    Selecione um período para filtrar os dados.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 hidden sm:flex">
                <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <DateRangePicker
                onUpdate={({ range }) => setDateRange(range)}
                initialDateFrom={dateRange?.from}
                initialDateTo={dateRange?.to}
                align="start"
                locale="pt-BR"
                showCompare={false}
                />
                {dateRange && (
                <Button
                    variant="ghost"
                    onClick={() => setDateRange(undefined)}
                    className="h-9 px-2 lg:px-3"
                >
                    Limpar
                    <X className="ml-2 h-4 w-4" />
                </Button>
                )}
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:hidden gap-2">
                <FileDown className="h-4 w-4" /> Exportar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {settings.showStats && children({ transactions: filteredTransactions, debts: filteredDebts }, descriptionText)}
    </div>
  );
}