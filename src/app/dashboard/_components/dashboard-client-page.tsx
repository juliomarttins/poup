
'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { Transaction, ManagedDebt } from '@/lib/types';
import { useDashboardSettings } from '@/contexts/dashboard-settings-context';


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
    if (!initialData.debts) return [];
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return initialData.debts;
    }
    return initialData.debts.filter(d => {
      const date = new Date(d.dueDate);
      const { from, to } = dateRange;
      const toEndOfDay = to ? new Date(to) : null;
      if (toEndOfDay) toEndOfDay.setHours(23, 59, 59, 999);

      if (from && !toEndOfDay) return date >= from;
      if (!from && toEndOfDay) return date <= toEndOfDay;
      if (from && toEndOfDay) return date >= from && date <= toEndOfDay;
      return true;
    });
  }, [initialData.debts, dateRange]);

  const descriptionText = dateRange ? "Período selecionado" : "Este mês";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Período</CardTitle>
          <CardDescription>
            Selecione um intervalo de datas para visualizar os dados financeiros nesse período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
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
        </CardContent>
      </Card>
      
      {settings.showStats && children({ transactions: filteredTransactions, debts: filteredDebts }, descriptionText)}
    </div>
  );
}
