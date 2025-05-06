
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
  element: HTMLElement, 
  filename: string
): Promise<void> => {
  if (!element) return;
  
  try {
    // Improved PDF generation with higher quality settings
    const canvas = await html2canvas(element, {
      scale: 3, // Increase scale for better resolution
      logging: false,
      useCORS: true,
      allowTaint: true,
      // Better font rendering
      fontDisplay: 'swap'
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0); // Use highest quality
    
    // Use a4 format for better compatibility
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Calculate dimensions to fit the page while maintaining aspect ratio
    const imgWidth = 210; // A4 width in mm (portrait)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF with better quality settings
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save(filename);
    
    return;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
