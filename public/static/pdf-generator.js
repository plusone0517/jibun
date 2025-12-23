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
            
            // Capture the section as image with higher quality
            const canvas = await html2canvas(element, {
                scale: 3, // Increased from 2 to 3 for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
            const imgWidth = pageWidth - 10; // 5mm margin on each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Calculate how many pages needed
            const maxPageHeight = pageHeight - 10; // 5mm margin top and bottom
            const numPages = Math.ceil(imgHeight / maxPageHeight);
            
            // Add pages and split image
            for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
                if (!isFirstPage || pageIndex > 0) {
                    pdf.addPage();
                }
                isFirstPage = false;
                
                // Calculate source position for this page
                const sourceY = pageIndex * maxPageHeight * (canvas.height / imgHeight);
                const sourceHeight = Math.min(
                    maxPageHeight * (canvas.height / imgHeight),
                    canvas.height - sourceY
                );
                
                // Create a temporary canvas for this page's content
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = sourceHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCtx.drawImage(
                    canvas,
                    0, sourceY, canvas.width, sourceHeight,
                    0, 0, canvas.width, sourceHeight
                );
                
                const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
                const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
                
                pdf.addImage(pageImgData, 'PNG', 5, 5, imgWidth, pageImgHeight);
            }
        }
        
        // Note: Header and footer are removed to avoid Japanese font issues
        // All content including titles are captured as images from the screen
        const today = new Date().toLocaleDateString('ja-JP');
        
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
