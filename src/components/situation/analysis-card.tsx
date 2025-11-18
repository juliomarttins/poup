
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FinancialAnalysis } from "@/lib/types";
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const statusConfig = {
    positive: {
        icon: TrendingUp,
        className: "border-accent/50 bg-accent/10",
        iconClassName: "text-accent"
    },
    negative: {
        icon: TrendingDown,
        className: "border-destructive/50 bg-destructive/10",
        iconClassName: "text-destructive"
    },
    neutral: {
        icon: AlertTriangle,
        className: "border-yellow-500/50 bg-yellow-500/10",
        iconClassName: "text-yellow-500"
    }
}

export function AnalysisCard({ analysis }: { analysis: FinancialAnalysis }) {
    const config = statusConfig[analysis.status];
    const Icon = config.icon;

    return (
        <Card className={cn("flex flex-col", config.className)}>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-full", config.className)}>
                        <Icon className={cn("h-6 w-6", config.iconClassName)} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <CardTitle className="text-base font-semibold">{analysis.title}</CardTitle>
                        <CardDescription className="text-sm">{analysis.summary}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{analysis.advice}</p>
            </CardContent>
        </Card>
    );
}
