// Japanese-compatible PDF Generator using html2canvas
async function generatePDFWithScreenshot() {
    try {
        // Show loading
        const button = document.querySelector('button[onclick="generatePDF()"]');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>PDF生成中...';
        button.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Get all sections to capture
        const sections = [
            { id: 'resultsContainer', title: '健康分析結果' }
        ];
        
        let isFirstPage = true;
        
        for (const section of sections) {
            const element = document.getElementById(section.id);
            if (!element || element.classList.contains('hidden')) continue;
            
            // Capture the section as image
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 20; // 10mm margin on each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Split into pages if content is too tall
            let heightLeft = imgHeight;
            let position = 10; // Top margin
            
            while (heightLeft > 0) {
                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;
                
                const pageImgHeight = Math.min(heightLeft, pageHeight - 20);
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                
                heightLeft -= (pageHeight - 20);
                position -= (pageHeight - 20);
            }
        }
        
        // Add header and footer to all pages
        const pageCount = pdf.internal.getNumberOfPages();
        const today = new Date().toLocaleDateString('ja-JP');
        
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            
            // Header
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text('じぶんを知ることから - AI健康分析レポート', 10, 7);
            pdf.text(today, pageWidth - 10, 7, { align: 'right' });
            
            // Footer
            pdf.setFontSize(8);
            pdf.text('本資料は医学的アドバイスの代替ではありません', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(`${i} / ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        // Save
        pdf.save(`健康分析レポート_${today.replace(/\//g, '_')}.pdf`);
        
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
        
        alert('✅ PDFをダウンロードしました！');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        
        // Restore button
        const button = document.querySelector('button[onclick="generatePDF()"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>PDFをダウンロード';
            button.disabled = false;
        }
        
        alert('❌ PDF生成中にエラーが発生しました: ' + error.message);
    }
}

// Replace the old generatePDF function
if (typeof window !== 'undefined') {
    window.generatePDF = generatePDFWithScreenshot;
}
