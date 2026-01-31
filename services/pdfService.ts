import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Robust resolution of the pdfjs-dist library object
const pdfjsLib: any = (pdfjs as any).default || pdfjs;

/**
 * Configure worker for PDF.js.
 */
const initializeWorker = () => {
  try {
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      // Use a consistent CDN version for the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
  } catch (err) {
    console.error("N.I.M's: Failed to initialize PDF worker:", err);
  }
};

initializeWorker();

/**
 * Converts the first page of a PDF file to a Base64 image string.
 */
export const convertPdfToImage = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Set high scale (3.0) to ensure AI can read text and small details in the portrait document
    const viewport = page.getViewport({ scale: 3.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error("Could not create canvas context for PDF rendering");
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error("N.I.M's: PDF to Image conversion failed:", err);
    throw new Error("Could not process PDF. Ensure it is a valid, unencrypted document.");
  }
};

/**
 * Generates a PDF from a base64 image URL and triggers download.
 * Matches PDF dimensions to the image to maintain quality.
 */
export const saveImageAsPdf = (imageUrl: string, filename: string) => {
  const img = new Image();
  img.src = imageUrl;
  
  img.onload = () => {
    // Determine orientation based on generated content (usually landscape)
    const orientation = img.width > img.height ? 'l' : 'p';
    
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [img.width, img.height]
    });
    
    pdf.addImage(imageUrl, 'PNG', 0, 0, img.width, img.height);
    pdf.save(filename);
  };
  
  img.onerror = () => {
    console.error("N.I.M's: Failed to load generated image for PDF conversion");
  };
};