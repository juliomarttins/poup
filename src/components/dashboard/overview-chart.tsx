
"use client"

import * as React from "react"
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts"
import { BarChart2, Donut, LineChart as LineChartIcon } from "lucide-react"

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
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Transaction } from "@/lib/types"

const monthlyChartConfig = {
  income: {
    label: "Renda",
    color: "hsl(var(--positive))",
  },
  expense: {
    label: "Despesa",
    color: "hsl(var(--negative))",
  },
}

const totalChartConfig = {
    income: {
        label: "Renda",
        color: "hsl(var(--positive))",
    },
    expense: {
        label: "Despesa",
        color: "hsl(var(--negative))",
    },
};

interface OverviewChartProps {
    transactions: Transaction[];
}


function OverviewChartComponent({ transactions }: OverviewChartProps) {
    const [activeChart, setActiveChart] = React.useState<"bar" | "donut" | "line">("bar");
    const isMobile = useIsMobile();
    
    const monthlyData = React.useMemo(() => {
        const data = transactions.reduce((acc, t) => {
            const date = new Date(t.date);
            // Adjust for timezone issues by using UTC methods
            const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth())).toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
            
            if (!acc[month]) {
                acc[month] = { month, income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                acc[month].income += t.amount;
            } else {
                acc[month].expense += Math.abs(t.amount);
            }
            return acc;
        }, {} as Record<string, {month: string, income: number, expense: number}>);
        
        const sortedData = Object.values(data).sort((a,b) => {
            const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
            return months.indexOf(a.month.toLowerCase()) - months.indexOf(b.month.toLowerCase());
        });

        if (sortedData.length === 0) {
            return [{ month: 'N/A', income: 0, expense: 0 }];
        }

        return sortedData;
    }, [transactions]);

    const totalData = React.useMemo(() => {
        const latestMonthData = monthlyData[monthlyData.length - 1];
        if (!latestMonthData || latestMonthData.month === 'N/A') return [];

        return [
            { name: 'income', value: latestMonthData.income, label: 'Renda', fill: 'var(--color-income)' },
            { name: 'expense', value: latestMonthData.expense, label: 'Despesa', fill: 'var(--color-expense)' },
        ];
    }, [monthlyData]);
    
  return (
    <Card>
      <CardHeader className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="grid gap-1">
            <CardTitle>Renda vs Despesa</CardTitle>
            <CardDescription>Visualize suas finanças por mês ou por proporção.</CardDescription>
        </div>
        <Tabs defaultValue="bar" className="w-full sm:w-auto" onValueChange={(value) => setActiveChart(value as "bar" | "donut" | "line")}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="bar" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Barras
            </TabsTrigger>
             <TabsTrigger value="line" className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4" />
                Linha
            </TabsTrigger>
            <TabsTrigger value="donut" className="flex items-center gap-2">
                <Donut className="h-4 w-4" />
                Rosca
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {monthlyData.length === 0 || monthlyData[0].month === 'N/A' ? (
             <div className="h-[200px] w-full sm:h-[250px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma transação registrada ainda.</p>
            </div>
        ) : activeChart === "bar" ? (
            <ChartContainer config={monthlyChartConfig} className="h-[200px] w-full sm:h-[250px]">
                <BarChart accessibilityLayer data={monthlyData} margin={isMobile ? {top: 20, right: 0, bottom: 0, left: 0} : { top: 20, right: 20, bottom: 20, left: 20 }} barSize={40}>
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
                    />}
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" formatter={(value, name) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number), name === 'income' ? 'Renda' : 'Despesa']} />}
                    />
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                    <ChartLegend content={<ChartLegendContent payload={Object.keys(monthlyChartConfig).map(key => ({value: monthlyChartConfig[key as keyof typeof monthlyChartConfig].label, type: 'square', color: monthlyChartConfig[key as keyof typeof monthlyChartConfig].color}))} />} />
                </BarChart>
            </ChartContainer>
        ) : activeChart === "line" ? (
             <ChartContainer config={monthlyChartConfig} className="h-[200px] w-full sm:h-[250px]">
                <LineChart accessibilityLayer data={monthlyData} margin={isMobile ? {top: 20, right: 20, bottom: 0, left: 0} : { top: 20, right: 20, bottom: 20, left: 20 }}>
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
                    />}
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dashed" formatter={(value, name) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number), name === 'income' ? 'Renda' : 'Despesa']} />}
                    />
                    <Line dataKey="income" type="natural" stroke="var(--color-income)" strokeWidth={2} dot={true} />
                    <Line dataKey="expense" type="natural" stroke="var(--color-expense)" strokeWidth={2} dot={true} />
                    <ChartLegend content={<ChartLegendContent payload={Object.keys(monthlyChartConfig).map(key => ({value: monthlyChartConfig[key as keyof typeof monthlyChartConfig].label, type: 'square', color: monthlyChartConfig[key as keyof typeof monthlyChartConfig].color}))} />} />
                </LineChart>
            </ChartContainer>
        ) : (
            <ChartContainer config={totalChartConfig} className="mx-auto aspect-square h-[250px]">
                 <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(value, name, props) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number), props.payload.label]}/>}
                    />
                    <Pie
                        data={totalData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                    >
                         <Cell key="cell-income" fill="var(--color-income)" />
                         <Cell key="cell-expense" fill="var(--color-expense)" />
                    </Pie>
                     <ChartLegend
                        content={<ChartLegendContent payload={totalData.map(item => ({ value: item.label, type: 'square', color: item.fill }))} />}
                        className="-translate-y-[10px] [&_button]:w-auto"
                    />
                </PieChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export const OverviewChart = React.memo(OverviewChartComponent);
