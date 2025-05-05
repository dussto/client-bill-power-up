
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
  element: HTMLElement, 
  filename: string
): Promise<void> => {
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Calculate dimensions to fit the page while maintaining aspect ratio
    const imgWidth = 210; // A4 width in mm (portrait)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
    
    return;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
