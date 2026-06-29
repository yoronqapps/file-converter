import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// pdf.js needs its worker file to do the heavy parsing off the main thread.
// Vite serves it from this URL pattern automatically.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Converts a PDF's pages into images. Returns an array of Blobs (one per page).
 * For now we only return the FIRST page as the primary conversion target —
 * multi-page export (zip) comes later once we add that UI.
 */
export async function convertPdfToImage(file, targetFormat) {
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  const targetMime = mimeMap[targetFormat];
  if (!targetMime) {
    throw new Error(`Unsupported PDF image target: ${targetFormat}`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const page = await pdf.getPage(1); // first page only, for now
  const scale = 2; // render at 2x for reasonable quality
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PDF render failed'))),
      targetMime,
      0.92
    );
  });
}

/**
 * Converts an image file into a single-page PDF.
 */
export async function convertImageToPdf(file) {
  const pdfDoc = await PDFDocument.create();
  const imageBytes = await file.arrayBuffer();

  let image;
  if (file.type === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    // pdf-lib only natively embeds png/jpg — everything else (webp, bmp)
    // needs to be re-encoded to jpg via canvas first.
    const jpgBlob = await reEncodeAsJpeg(file);
    const jpgBytes = await jpgBlob.arrayBuffer();
    image = await pdfDoc.embedJpg(jpgBytes);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

function reEncodeAsJpeg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Re-encode failed'))), 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}