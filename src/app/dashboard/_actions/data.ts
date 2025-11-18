
'use client';

import type { Transaction, ManagedDebt } from '@/lib/types';
import type { DateRange } from 'react-day-picker';

export function getDashboardStats(transactions: Transaction[], debts: ManagedDebt[], dateRange?: DateRange) {
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();

    const transactionsToProcess = (transactions || []).filter(t => {
        const transactionDate = new Date(t.date);
        
        if (dateRange && (dateRange.from || dateRange.to)) {
            const { from, to } = dateRange;
            const toEndOfDay = to ? new Date(to) : null;
            if (toEndOfDay) toEndOfDay.setUTCHours(23, 59, 59, 999);

            if (from && !toEndOfDay) return transactionDate >= from;
            if (!from && toEndOfDay) return transactionDate <= toEndOfDay;
            if (from && toEndOfDay) return transactionDate >= from && transactionDate <= toEndOfDay;
            return true;
        }
        
        // If no dateRange is provided, filter by the current month and year (UTC)
        return transactionDate.getUTCMonth() === currentMonth && transactionDate.getUTCFullYear() === currentYear;
    });

    const { totalIncome, totalExpenses } = transactionsToProcess.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.totalIncome += t.amount;
        } else {
            acc.totalExpenses += Math.abs(t.amount);
        }
        return acc;
    }, { totalIncome: 0, totalExpenses: 0 });

    const netBalance = totalIncome - totalExpenses;
    const totalDebt = (debts || []).reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

    return { totalIncome, totalExpenses, netBalance, totalDebt };
}
