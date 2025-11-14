
import { Transaction } from '../types';
import { CURRENCY_DETAILS, TRANSACTION_TYPE_DETAILS } from '../constants';
import { amiriFontBase64 } from './AmiriFont';

declare const jspdf: any;

// Helper to format date
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

// CSV Export
export const exportToCsv = (transactions: Transaction[], accountName: string) => {
    const headers = ['التاريخ', 'الوصف', 'النوع', 'المبلغ', 'العملة'];
    const rows = transactions.map(t => [
        formatDate(t.date),
        `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
        TRANSACTION_TYPE_DETAILS[t.type].label,
        t.amount,
        CURRENCY_DETAILS[t.currency].symbol
    ]);

    // Use semicolon as a separator for better Excel compatibility
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM for Excel
        + headers.join(';') + '\n'
        + rows.map(e => e.join(';')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `كشف_حساب_${accountName.replace(/\s/g, '_')}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// PDF Export
export const exportToPdf = (transactions: Transaction[], accountName: string, dateRange: string) => {
    if (typeof jspdf === 'undefined' || typeof (jspdf as any).jsPDF.autoTable === 'undefined') {
        alert('مكتبة تصدير PDF لم يتم تحميلها بعد. الرجاء المحاولة مرة أخرى.');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // Add Amiri font for Arabic support
    doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');

    doc.setR2L(true); // Enable Right-to-Left mode

    doc.setFontSize(18);
    doc.text(`كشف حساب: ${accountName}`, 200, 15, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`الفترة: ${dateRange}`, 200, 22, { align: 'right' });
    
    const head = [['التاريخ', 'الوصف', 'النوع', 'المبلغ', 'العملة']];
    const body = transactions.map(t => [
        formatDate(t.date),
        t.description,
        TRANSACTION_TYPE_DETAILS[t.type].label,
        t.amount.toLocaleString(),
        CURRENCY_DETAILS[t.currency].symbol,
    ]);
    
    (doc as any).autoTable({
        head: head,
        body: body,
        startY: 30,
        theme: 'grid',
        styles: {
            font: 'Amiri',
            halign: 'right', // Align text to the right for Arabic
            cellPadding: 2,
            fontSize: 10,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
        }
    });

    const date = new Date().toISOString().split('T')[0];
    doc.save(`كشف_حساب_${accountName.replace(/\s/g, '_')}_${date}.pdf`);
};