import * as pdfjsLibProxy from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Handle potential default export structure from ESM CDN
const pdfjsLib = (pdfjsLibProxy as any).default || pdfjsLibProxy;

// Configure worker for PDF.js
// We use the same version for the worker as the library to ensure compatibility
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

/**
 * Converts the first page of a PDF file to a Base64 image string.
 */
export const convertPdfToImage = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document using the resolved library instance
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Get the first page
  const page = await pdf.getPage(1);
  
  // Set scale for good quality (1080p target)
  // A standard page is often small in points, scale 2.0 or 3.0 ensures clarity
  const viewport = page.getViewport({ scale: 3.0 });
  
  // Prepare canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error("Could not create canvas context for PDF rendering");
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render PDF page into canvas context
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  
  // Convert to base64 image
  return canvas.toDataURL('image/png');
};

/**
 * Generates a PDF from a base64 image URL and triggers download.
 * Matches PDF dimensions to the image to maintain quality/ratio.
 */
export const saveImageAsPdf = (imageUrl: string, filename: string) => {
  const img = new Image();
  img.src = imageUrl;
  
  img.onload = () => {
    // Create PDF with orientation based on image
    const orientation = img.width > img.height ? 'l' : 'p';
    
    // Create PDF matching image dimensions in points (px)
    // jsPDF handling
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [img.width, img.height]
    });
    
    pdf.addImage(imageUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save(filename);
  };
};