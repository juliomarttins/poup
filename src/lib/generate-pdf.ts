// ARQUIVO 3/3: src/lib/generate-pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateTransactionsPDF = (transactions: Transaction[], title: string = "Relatório de Transações") => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30);

  // Preparar dados para a tabela
  const tableData = transactions.map((t) => {
    const date = new Date(t.date);
    // Ajuste para garantir que a data exiba corretamente sem voltar 1 dia devido ao fuso
    const formattedDate = date.toLocaleDateString("pt-BR", { timeZone: 'UTC' });

    const amount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(t.amount);

    return [
        formattedDate,
        t.description,
        t.category,
        t.type === 'income' ? 'Renda' : 'Despesa',
        amount
    ];
  });

  // Calcular totais
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const formatMoney = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Gerar Tabela
  autoTable(doc, {
    startY: 35,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255 }, // Escuro para combinar com o tema padrão
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 'auto' }, // Descrição
        2: { cellWidth: 30 }, // Categoria
        3: { cellWidth: 25 }, // Tipo
        4: { cellWidth: 35, halign: 'right' }, // Valor
    },
  });

  // Adicionar Resumo Final
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Total Receitas: ${formatMoney(totalIncome)}`, 14, finalY);
  doc.text(`Total Despesas: ${formatMoney(totalExpense)}`, 14, finalY + 6);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  // Muda a cor do saldo dependendo se é positivo ou negativo
  if(balance < 0) {
      doc.setTextColor(220, 38, 38); // Vermelho
  } else {
      doc.setTextColor(22, 163, 74); // Verde
  }
  doc.text(`Saldo do Período: ${formatMoney(balance)}`, 14, finalY + 14);

  // Salvar
  doc.save("relatorio-transacoes.pdf");
};