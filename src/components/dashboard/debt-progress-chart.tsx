"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { memo, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile";
import type { ManagedDebt } from "@/lib/types";


const chartConfig = {
  debt: {
    label: "Dívida Total",
    color: "hsl(var(--primary))",
  },
}

interface DebtProgressChartProps {
    debts: ManagedDebt[];
}

function DebtProgressChartComponent({ debts }: DebtProgressChartProps) {
  const isMobile = useIsMobile();
  
  // This is a simplified representation. A real implementation would need
  // historical data to show true progress. Here, we simulate a linear reduction.
  const chartData = useMemo(() => {
    const totalDebt = debts.reduce((acc, d) => acc + d.totalAmount, 0);
    const paidDebt = debts.reduce((acc, d) => acc + d.paidAmount, 0);

    if (totalDebt === 0) {
        return Array(6).fill(0).map((_, i) => {
            const month = new Date();
            month.setMonth(month.getMonth() - (5 - i));
            return { month: month.toLocaleString('pt-BR', { month: 'short' }), debt: 0 };
        });
    }

    // Simulate 6 months of data, ending with the current remaining debt
    const remainingDebt = totalDebt - paidDebt;
    const monthlyReduction = (paidDebt > 0 && paidDebt < totalDebt) ? (totalDebt - remainingDebt) / 5 : (totalDebt * 0.05) / 5;
    
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const debtAmount = remainingDebt + (monthlyReduction * i);
        data.push({
            month: month.toLocaleString('pt-BR', { month: 'short' }),
            debt: Math.max(0, debtAmount), // Ensure debt doesn't go below zero
        });
    }
    return data;
  }, [debts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso da Dívida</CardTitle>
        <CardDescription>
          Simulação da redução da sua dívida total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full sm:h-[250px]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={isMobile ? {
              left: 0,
              right: 12,
              top: 10,
            } : {
              left: 12,
              right: 12,
              top: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            {!isMobile && <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />}
            {!isMobile && <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `R$${Number(value) / 1000}k`}
              domain={['dataMin - 500', 'dataMax + 500']}
            />}
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number), 'Dívida Total']} />}
            />
            <defs>
              <linearGradient id="fillDebt" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-debt)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-debt)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="debt"
              type="natural"
              fill="url(#fillDebt)"
              fillOpacity={0.4}
              stroke="var(--color-debt)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export const DebtProgressChart = memo(DebtProgressChartComponent);
