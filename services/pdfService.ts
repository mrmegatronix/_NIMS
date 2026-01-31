import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Robust resolution of the pdfjs-dist library object
const pdfjsLib: any = (pdfjs as any).default || pdfjs;

/**
 * Configure worker for PDF.js defensively.
 * ESM.sh and other CDNs can have complex property access for GlobalWorkerOptions.
 */
const initializeWorker = () => {
  try {
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      // Using a standard CDN for the worker file is often more reliable than relative paths in ESM
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
    // Load the document using the resolved library instance
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Set scale for high quality (targeting clear analysis for Gemini)
    const viewport = page.getViewport({ scale: 2.0 });
    
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
    
    // Convert to base64 image (PNG for lossless quality during analysis)
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error("N.I.M's: PDF to Image conversion failed:", err);
    throw new Error("Could not process PDF. Please ensure it is not password protected.");
  }
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