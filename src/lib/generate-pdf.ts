import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateTransactionsPDF = (transactions: Transaction[], title: string = "Relatório de Transações") => {
  const doc = new jsPDF();

  // --- CABEÇALHO VISUAL ---
  // Fundo do cabeçalho
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Poupp", 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(title, 14, 28);

  doc.setFontSize(9);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 200, 20, { align: "right" });

  // --- PREPARAÇÃO DOS DADOS ---
  const tableData = transactions.map((t) => {
    const date = new Date(t.date);
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

  // --- CÁLCULO DOS TOTAIS ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpense;
  const formatMoney = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // --- TABELA COM LINHAS E COLUNAS (GRID) ---
  autoTable(doc, {
    startY: 45,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: tableData,
    theme: 'grid', // <--- ISSO ADICIONA AS LINHAS E COLUNAS CLARAS
    styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200], // Cor da linha cinza suave
        lineWidth: 0.1,
    },
    headStyles: { 
        fillColor: [30, 41, 59], // Cor escura moderna (slate-800)
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
    },
    columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Data
        1: { cellWidth: 'auto' }, // Descrição
        2: { cellWidth: 30, halign: 'center' }, // Categoria
        3: { cellWidth: 25, halign: 'center' }, // Tipo
        4: { cellWidth: 35, halign: 'right' }, // Valor
    },
    alternateRowStyles: {
        fillColor: [248, 250, 252] // Alternar cor bem suave
    }
  });

  // --- RESUMO FINANCEIRO (BOX) ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Desenhar um box de resumo
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(14, finalY, 80, 35, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo do Relatório", 19, finalY + 8);

  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74); // Verde
  doc.text(`Receitas: ${formatMoney(totalIncome)}`, 19, finalY + 16);
  
  doc.setTextColor(220, 38, 38); // Vermelho
  doc.text(`Despesas: ${formatMoney(totalExpense)}`, 19, finalY + 22);
  
  // Linha separadora
  doc.setDrawColor(220, 220, 220);
  doc.line(19, finalY + 25, 89, finalY + 25);

  doc.setFont("helvetica", "bold");
  if (balance >= 0) {
      doc.setTextColor(22, 163, 74); // Verde
  } else {
      doc.setTextColor(220, 38, 38); // Vermelho
  }
  doc.text(`Saldo: ${formatMoney(balance)}`, 19, finalY + 31);

  // Salvar
  doc.save("relatorio-financeiro-poup.pdf");
};