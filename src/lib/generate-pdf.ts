import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction, ManagedDebt } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatMoney = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

// --- HELPERS VISUAIS ---

const drawHeader = (doc: jsPDF, title: string, subtitle: string = "") => {
  // Fundo Escuro Profissional
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 40, "F");
  
  // Logo / Nome
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Poupp", 14, 20);
  
  // Slogan
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("Gestão Financeira Inteligente", 14, 26);

  // Título do Relatório
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 200, 20, { align: "right" });

  // Subtítulo / Data
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  if (subtitle) doc.text(subtitle, 200, 26, { align: "right" });
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 200, 32, { align: "right" });
};

const drawBarChart = (doc: jsPDF, label: string, value: number, total: number, y: number, color: [number, number, number]) => {
    const percentage = total > 0 ? Math.min((value / total), 1) : 0;
    const barWidth = 80;
    const fillWidth = barWidth * percentage;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(label, 14, y);
    
    // Fundo da barra (track)
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(14, y + 2, barWidth, 6, 1, 1, "F");
    
    // Barra de valor (fill)
    doc.setFillColor(...color);
    if (fillWidth > 0) {
        doc.roundedRect(14, y + 2, fillWidth, 6, 1, 1, "F");
    }

    // Texto do valor e porcentagem
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(`${formatMoney(value)} (${(percentage * 100).toFixed(1)}%)`, 14 + barWidth + 5, y + 6);
}

// --- GERADORES ESPECÍFICOS ---

export const generateTransactionsPDF = (transactions: Transaction[], filterDesc: string = "") => {
  const doc = new jsPDF();
  drawHeader(doc, "Relatório de Transações", filterDesc);

  // Cálculos
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const maxValue = Math.max(totalIncome, totalExpense);

  // Gráficos de Resumo
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text("Resumo do Período", 14, 55);

  drawBarChart(doc, "Receitas", totalIncome, maxValue, 60, [22, 163, 74]); // Verde
  drawBarChart(doc, "Despesas", totalExpense, maxValue, 75, [220, 38, 38]); // Vermelho

  // Saldo Líquido em Destaque
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(130, 58, 60, 25, 2, 2, "F");
  doc.setFontSize(10);
  doc.text("Saldo Líquido", 160, 65, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(balance >= 0 ? 22 : 220, balance >= 0 ? 163 : 38, balance >= 0 ? 74 : 38);
  doc.text(formatMoney(balance), 160, 75, { align: "center" });

  // Tabela Grid
  const tableData = transactions.map((t) => {
    const date = new Date(t.date);
    const formattedDate = date.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
    return [
        formattedDate,
        t.description,
        t.category,
        t.type === 'income' ? 'Renda' : 'Despesa',
        formatMoney(t.amount)
    ];
  });

  autoTable(doc, {
    startY: 95,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: tableData,
    theme: 'grid', 
    styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 
        0: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' } 
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`transacoes_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateDebtsPDF = (debts: ManagedDebt[]) => {
    const doc = new jsPDF();
    drawHeader(doc, "Relatório de Dívidas");
  
    const totalDebt = debts.reduce((acc, d) => acc + d.totalAmount, 0);
    const totalPaid = debts.reduce((acc, d) => acc + d.paidAmount, 0);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Progresso Geral de Quitação", 14, 55);

    drawBarChart(doc, "Total Pago vs Total Devido", totalPaid, totalDebt, 60, [37, 99, 235]); // Azul

    const tableData = debts.map((d) => {
        const remaining = d.totalAmount - d.paidAmount;
        const progress = d.totalAmount > 0 ? (d.paidAmount / d.totalAmount) * 100 : 0;
        return [
            d.name,
            d.category,
            `${d.paidInstallments}/${d.totalInstallments}`,
            formatMoney(d.totalAmount),
            formatMoney(remaining),
            `${progress.toFixed(1)}%`
        ];
    });
  
    autoTable(doc, {
      startY: 80,
      head: [["Dívida", "Categoria", "Parcelas", "Total", "Restante", "% Pago"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
      columnStyles: { 
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' } 
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
  
    doc.save(`dividas_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateGeneralReportPDF = (
    transactions: Transaction[], 
    debts: ManagedDebt[],
    periodDescription: string = "Geral"
) => {
    const doc = new jsPDF();
    drawHeader(doc, "Relatório Geral Completo", periodDescription);

    let yPos = 55;

    // 1. Fluxo de Caixa
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const maxVal = Math.max(totalIncome, totalExpense);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("1. Fluxo de Caixa", 14, yPos);
    
    yPos += 10;
    drawBarChart(doc, "Receitas Totais", totalIncome, maxVal, yPos, [22, 163, 74]);
    drawBarChart(doc, "Despesas Totais", totalExpense, maxVal, yPos + 15, [220, 38, 38]);

    // 2. Dívidas
    yPos += 35;
    const totalDebt = debts.reduce((acc, d) => acc + d.totalAmount, 0);
    const totalPaidDebt = debts.reduce((acc, d) => acc + d.paidAmount, 0);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text("2. Situação de Dívidas", 14, yPos);
    
    yPos += 10;
    drawBarChart(doc, "Montante da Dívida Quitado", totalPaidDebt, totalDebt, yPos, [37, 99, 235]);

    // 3. Lista de Dívidas
    yPos += 25;
    doc.setFontSize(13);
    doc.text("3. Detalhamento de Dívidas", 14, yPos);

    const debtData = debts.map(d => [
        d.name, 
        d.category, 
        formatMoney(d.totalAmount),
        `${((d.paidAmount / d.totalAmount) * 100).toFixed(0)}%`
    ]);

    autoTable(doc, {
        startY: yPos + 5,
        head: [["Nome", "Categoria", "Total", "% Pago"]],
        body: debtData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 9 },
    });

    // 4. Lista de Transações
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 15;
    
    // Nova página se necessário
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(13);
    doc.text("4. Extrato de Transações (Filtrado)", 14, finalY);

    const transData = transactions.map(t => [
        new Date(t.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' }),
        t.description,
        t.category,
        t.type === 'income' ? '+' : '-',
        formatMoney(t.amount)
    ]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [["Data", "Descrição", "Categoria", "T", "Valor"]],
        body: transData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        columnStyles: { 4: { halign: 'right' } },
        styles: { fontSize: 8 },
    });

    doc.save(`relatorio_geral_completo_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}