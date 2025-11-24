"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Transaction } from "@/lib/types"

const chartConfig = {
  income: {
    label: "Renda",
    color: "hsl(var(--positive))",
  },
  expense: {
    label: "Despesa",
    color: "hsl(var(--negative))",
  },
}

interface OverviewChartProps {
    transactions: Transaction[];
}

function OverviewChartComponent({ transactions }: OverviewChartProps) {
    const isMobile = useIsMobile();
    
    const data = React.useMemo(() => {
        const grouped = transactions.reduce((acc, t) => {
            const date = new Date(t.date);
            // Agrupa por dia para gráfico mais detalhado
            const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
            
            if (!acc[day]) {
                acc[day] = { day, income: 0, expense: 0, date: date.getTime() };
            }
            if (t.type === 'income') {
                acc[day].income += t.amount;
            } else {
                acc[day].expense += Math.abs(t.amount);
            }
            return acc;
        }, {} as Record<string, {day: string, income: number, expense: number, date: number}>);
        
        // Ordena por data real
        const sortedData = Object.values(grouped).sort((a,b) => a.date - b.date);

        // Se vazio, mostra dados zerados para manter layout
        if (sortedData.length === 0) return [];
        return sortedData;
    }, [transactions]);
    
  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
      <CardHeader className="px-0 sm:px-6 pt-0 sm:pt-6">
        <div className="grid gap-1">
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Entradas e saídas diárias.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            {data.length > 0 ? (
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--positive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--positive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--negative))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--negative))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis 
                    dataKey="day" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10} 
                    minTickGap={30}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="income"
                  type="monotone"
                  stroke="hsl(var(--positive))"
                  strokeWidth={2}
                  fill="url(#fillIncome)"
                  stackId="1"
                />
                <Area
                  dataKey="expense"
                  type="monotone"
                  stroke="hsl(var(--negative))"
                  strokeWidth={2}
                  fill="url(#fillExpense)"
                  stackId="2"
                />
              </AreaChart>
            ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    Sem dados para o período.
                </div>
            )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export const OverviewChart = React.memo(OverviewChartComponent);