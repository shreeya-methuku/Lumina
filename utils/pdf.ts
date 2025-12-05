import { Slide } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

export const convertPdfToImages = async (file: File): Promise<Slide[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const slides: Slide[] = [];

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Scale 2.0 provides good quality for OCR/Analysis
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Convert to JPEG for efficiency
      const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      slides.push({
        id: Math.random().toString(36).substr(2, 9),
        url: imageUrl,
        name: `Pg ${i} - ${file.name}`,
        file: file
      });
    }

    return slides;
  } catch (error) {
    console.error("Error converting PDF:", error);
    throw new Error("Failed to parse PDF file. It might be password protected or corrupted.");
  }
};